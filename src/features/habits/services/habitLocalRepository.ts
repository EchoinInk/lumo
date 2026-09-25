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

const mutations = new SerializedMutationQueue();

function loadAllHabits(): Habit[] {
  migrateHabitStorage();
  return loadVersionedData(habitStorageDefinition).data;
}

function persistHabits(habits: Habit[]): void {
  saveVersionedData(habitStorageDefinition, habits);
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
    const updatedHabit: Habit = {
      ...current,
      ...updates,
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
    if (habit.completedDates.includes(date)) return habit;

    const completedDates = [...habit.completedDates, date];
    const updatedHabit: Habit = {
      ...habit,
      completedDates,
      streakCount: calculateStreak(completedDates),
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
    if (!habit.completedDates.includes(date)) return habit;

    const completedDates = habit.completedDates.filter((item) => item !== date);
    const updatedHabit: Habit = {
      ...habit,
      completedDates,
      streakCount: calculateStreak(completedDates),
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

function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;

  const sorted = [...completedDates].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (!sorted.includes(today) && !sorted.includes(yesterday)) return 0;

  let streak = 0;
  const currentDate = new Date();
  while (true) {
    const dateStr = currentDate.toISOString().split("T")[0];
    if (!sorted.includes(dateStr)) break;
    streak += 1;
    currentDate.setDate(currentDate.getDate() - 1);
  }
  return streak;
}
