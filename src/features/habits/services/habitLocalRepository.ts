import { migrateHabitStorage } from "@/services/storage/canonicalMigrations";
import {
  DurableMutationError,
  type DurableMutationOperation,
  SerializedMutationQueue,
} from "@/services/storage/durableMutation";
import { habitStorageDefinition } from "@/services/storage/domainSchemas";
import {
  loadVersionedData,
  saveVersionedData,
} from "@/services/storage/versionedStorage";
import { CreateHabitInput, Habit, UpdateHabitInput } from "../types/habit";
import { isLocalDateKey, toLocalDateKey } from "@/src/utils/dateTime";
import {
  calculateCurrentHabitStreak,
  isHabitScheduledOn,
  isValidWeeklyTargetDays,
} from "./habitHistory";

const mutations = new SerializedMutationQueue();

function loadAllHabits(): Habit[] {
  migrateHabitStorage();
  return loadVersionedData(habitStorageDefinition).data;
}

function persistHabits(habits: Habit[]): void {
  saveVersionedData(habitStorageDefinition, habits);
}

function validateSchedule(
  input: Pick<CreateHabitInput, "frequency" | "targetDays">,
  operation: DurableMutationOperation,
): void {
  if (!isValidWeeklyTargetDays(input.frequency, input.targetDays)) {
    throw new DurableMutationError(
      "habits",
      operation,
      "invalid-input",
      "Weekly habits need at least one valid target day.",
    );
  }
}

function mutate<T>(
  operation: DurableMutationOperation,
  mutation: () => T,
): Promise<T> {
  return mutations.run(() => {
    try {
      return mutation();
    } catch (cause) {
      if (cause instanceof DurableMutationError) throw cause;
      throw new DurableMutationError(
        "habits",
        operation,
        "write-failed",
        `Habits could not be ${operation === "delete" ? "deleted" : "saved"}.`,
        cause,
      );
    }
  });
}

function findActiveHabitIndex(habits: Habit[], id: string): number {
  return habits.findIndex((habit) => habit.id === id && !habit.deletedAt);
}

function unavailableHabit(
  operation: DurableMutationOperation,
  id: string,
  habits: Habit[],
): DurableMutationError {
  const wasDeleted = habits.some((habit) => habit.id === id && habit.deletedAt);
  return new DurableMutationError(
    "habits",
    operation,
    wasDeleted ? "conflict" : "not-found",
    wasDeleted
      ? `Habit ${id} was deleted before it could be changed.`
      : `Habit ${id} was not found.`,
  );
}

export async function getHabits(): Promise<Habit[]> {
  await mutations.waitForIdle();
  return loadAllHabits().filter((habit) => !habit.deletedAt);
}

export async function getHabitById(id: string): Promise<Habit | null> {
  const habits = await getHabits();
  return habits.find((habit) => habit.id === id) ?? null;
}

export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  return mutate("create", () => {
    validateSchedule(input, "create");
    const habits = loadAllHabits();
    const now = new Date().toISOString();
    const newHabit: Habit = {
      id: `habit_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      ...input,
      streakCount: 0,
      completedDates: [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: "pending",
      pendingSync: true,
      version: 1,
    };

    persistHabits([...habits, newHabit]);
    return newHabit;
  });
}

export async function updateHabit(
  id: string,
  updates: UpdateHabitInput,
): Promise<Habit> {
  return mutate("update", () => {
    const habits = loadAllHabits();
    const habitIndex = findActiveHabitIndex(habits, id);
    if (habitIndex === -1) throw unavailableHabit("update", id, habits);

    const current = habits[habitIndex];
    const nextSchedule = {
      frequency: updates.frequency ?? current.frequency,
      targetDays: updates.frequency === "daily"
        ? undefined
        : updates.targetDays ?? current.targetDays,
    };
    validateSchedule(nextSchedule, "update");
    const updatedHabit: Habit = {
      ...current,
      ...updates,
      ...nextSchedule,
      updatedAt: new Date().toISOString(),
      syncStatus: "pending",
      pendingSync: true,
      version: (current.version ?? 0) + 1,
    };
    const updated = [...habits];
    updated[habitIndex] = updatedHabit;
    persistHabits(updated);
    return updatedHabit;
  });
}

export async function deleteHabit(id: string): Promise<void> {
  return mutate("delete", () => {
    const habits = loadAllHabits();
    const habitIndex = findActiveHabitIndex(habits, id);
    if (habitIndex === -1) return;

    const now = new Date().toISOString();
    const updated = [...habits];
    updated[habitIndex] = {
      ...updated[habitIndex],
      deletedAt: now,
      updatedAt: now,
      syncStatus: "pending",
      pendingSync: true,
      version: (updated[habitIndex].version ?? 0) + 1,
    };
    persistHabits(updated);
  });
}

export async function restoreHabit(id: string): Promise<Habit> {
  return mutate("update", () => {
    const habits = loadAllHabits();
    const habitIndex = habits.findIndex((habit) => habit.id === id && habit.deletedAt);
    if (habitIndex === -1) throw unavailableHabit("update", id, habits);

    const current = habits[habitIndex];
    const restored: Habit = {
      ...current,
      deletedAt: null,
      updatedAt: new Date().toISOString(),
      syncStatus: "pending",
      pendingSync: true,
      version: (current.version ?? 0) + 1,
    };
    const updated = [...habits];
    updated[habitIndex] = restored;
    persistHabits(updated);
    return restored;
  });
}

export async function hardDeleteHabit(id: string): Promise<void> {
  return mutate("delete", () => {
    persistHabits(loadAllHabits().filter((habit) => habit.id !== id));
  });
}

export async function completeHabit(id: string, date: string): Promise<Habit> {
  return mutate("complete", () => {
    const habits = loadAllHabits();
    const habitIndex = findActiveHabitIndex(habits, id);
    if (habitIndex === -1) throw unavailableHabit("complete", id, habits);

    const habit = habits[habitIndex];
    if (!isLocalDateKey(date) || !isHabitScheduledOn(habit, date)) {
      throw new DurableMutationError(
        "habits",
        "complete",
        "invalid-input",
        "Habit completions need a valid scheduled local date.",
      );
    }
    if (habit.completedDates.includes(date)) return habit;

    const completedDates = [...habit.completedDates, date];
    const updatedHabit: Habit = {
      ...habit,
      completedDates,
      streakCount: calculateCurrentHabitStreak({ ...habit, completedDates }),
      updatedAt: new Date().toISOString(),
      syncStatus: "pending",
      pendingSync: true,
      version: (habit.version ?? 0) + 1,
    };
    const updated = [...habits];
    updated[habitIndex] = updatedHabit;
    persistHabits(updated);
    return updatedHabit;
  });
}

export async function uncompleteHabit(
  id: string,
  date: string,
): Promise<Habit> {
  return mutate("uncomplete", () => {
    const habits = loadAllHabits();
    const habitIndex = findActiveHabitIndex(habits, id);
    if (habitIndex === -1) throw unavailableHabit("uncomplete", id, habits);

    const habit = habits[habitIndex];
    if (!isLocalDateKey(date)) {
      throw new DurableMutationError(
        "habits",
        "uncomplete",
        "invalid-input",
        "Habit completion dates must use a valid local date.",
      );
    }
    if (!habit.completedDates.includes(date)) return habit;

    const completedDates = habit.completedDates.filter((item) => item !== date);
    const updatedHabit: Habit = {
      ...habit,
      completedDates,
      streakCount: calculateCurrentHabitStreak({ ...habit, completedDates }),
      updatedAt: new Date().toISOString(),
      syncStatus: "pending",
      pendingSync: true,
      version: (habit.version ?? 0) + 1,
    };
    const updated = [...habits];
    updated[habitIndex] = updatedHabit;
    persistHabits(updated);
    return updatedHabit;
  });
}

export function calculateStreak(
  completedDates: string[],
  today: string = toLocalDateKey(),
): number {
  return calculateCurrentHabitStreak({
    id: "compatibility-streak",
    title: "Compatibility streak",
    frequency: "daily",
    streakCount: 0,
    completedDates,
    createdAt: `${today}T00:00:00.000Z`,
    updatedAt: `${today}T00:00:00.000Z`,
  }, today);
}
