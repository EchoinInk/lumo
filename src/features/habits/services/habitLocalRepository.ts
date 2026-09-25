import { getString, setString } from "@/services/storage/mmkv";
import { migrateHabitStorage } from "@/services/storage/canonicalMigrations";
import { StorageKeys } from "@/services/storage/storageKeys";
import { CreateHabitInput, Habit, UpdateHabitInput } from "../types/habit";

const HABITS_KEY = StorageKeys.HABITS;

export class HabitLocalRepositoryError extends Error {
  constructor(
    message: string,
    public cause?: unknown,
  ) {
    super(message);
    this.name = "HabitLocalRepositoryError";
  }
}

export async function getHabits(): Promise<Habit[]> {
  try {
    migrateHabitStorage();
    const data = getString(HABITS_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data) as Habit[];
    // Filter out soft-deleted habits
    return parsed.filter((h) => !h.deletedAt);
  } catch (error) {
    console.error("[HabitLocalRepository] Failed to get habits:", error);
    return [];
  }
}

export async function getHabitById(id: string): Promise<Habit | null> {
  try {
    const habits = await getHabits();
    return habits.find((h) => h.id === id) || null;
  } catch (error) {
    console.error(`[HabitLocalRepository] Failed to get habit ${id}:`, error);
    return null;
  }
}

export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  try {
    const habits = await getHabits();
    const now = new Date().toISOString();

    const newHabit: Habit = {
      id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...input,
      streakCount: 0,
      completedDates: [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: "pending",
      version: 1,
    };

    const updated = [...habits, newHabit];
    setString(HABITS_KEY, JSON.stringify(updated));

    return newHabit;
  } catch (error) {
    console.error("[HabitLocalRepository] Failed to create habit:", error);
    throw new HabitLocalRepositoryError("Failed to create habit", error);
  }
}

export async function updateHabit(
  id: string,
  updates: UpdateHabitInput,
): Promise<Habit> {
  try {
    const habits = await getHabits();
    const habitIndex = habits.findIndex((h) => h.id === id);

    if (habitIndex === -1) {
      throw new HabitLocalRepositoryError(`Habit ${id} not found`);
    }

    const updatedHabit: Habit = {
      ...habits[habitIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      syncStatus: "pending",
      version: (habits[habitIndex].version || 1) + 1,
    };

    const updated = [...habits];
    updated[habitIndex] = updatedHabit;
    setString(HABITS_KEY, JSON.stringify(updated));

    return updatedHabit;
  } catch (error) {
    console.error(
      `[HabitLocalRepository] Failed to update habit ${id}:`,
      error,
    );
    throw new HabitLocalRepositoryError(`Failed to update habit ${id}`, error);
  }
}

export async function deleteHabit(id: string): Promise<void> {
  try {
    const habits = await getHabits();
    const habitIndex = habits.findIndex((h) => h.id === id);

    if (habitIndex === -1) {
      console.warn(`[HabitLocalRepository] Habit ${id} not found for deletion`);
      return;
    }

    // Soft delete
    const updated = [...habits];
    updated[habitIndex] = {
      ...updated[habitIndex],
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    setString(HABITS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error(
      `[HabitLocalRepository] Failed to delete habit ${id}:`,
      error,
    );
    throw new HabitLocalRepositoryError(`Failed to delete habit ${id}`, error);
  }
}

export async function hardDeleteHabit(id: string): Promise<void> {
  try {
    const habits = await getHabits();
    const updated = habits.filter((h) => h.id !== id);
    setString(HABITS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error(
      `[HabitLocalRepository] Failed to hard delete habit ${id}:`,
      error,
    );
    throw new HabitLocalRepositoryError(
      `Failed to hard delete habit ${id}`,
      error,
    );
  }
}

export async function completeHabit(id: string, date: string): Promise<Habit> {
  try {
    const habits = await getHabits();
    const habitIndex = habits.findIndex((h) => h.id === id);

    if (habitIndex === -1) {
      throw new HabitLocalRepositoryError(`Habit ${id} not found`);
    }

    const habit = habits[habitIndex];
    if (habit.completedDates.includes(date)) {
      // Already completed, return as-is
      return habit;
    }

    const updatedHabit: Habit = {
      ...habit,
      completedDates: [...habit.completedDates, date],
      streakCount: calculateStreak([...habit.completedDates, date]),
      updatedAt: new Date().toISOString(),
      syncStatus: "pending",
      version: (habit.version || 1) + 1,
    };

    const updated = [...habits];
    updated[habitIndex] = updatedHabit;
    setString(HABITS_KEY, JSON.stringify(updated));

    return updatedHabit;
  } catch (error) {
    console.error(
      `[HabitLocalRepository] Failed to complete habit ${id}:`,
      error,
    );
    throw new HabitLocalRepositoryError(
      `Failed to complete habit ${id}`,
      error,
    );
  }
}

export async function uncompleteHabit(
  id: string,
  date: string,
): Promise<Habit> {
  try {
    const habits = await getHabits();
    const habitIndex = habits.findIndex((h) => h.id === id);

    if (habitIndex === -1) {
      throw new HabitLocalRepositoryError(`Habit ${id} not found`);
    }

    const habit = habits[habitIndex];
    if (!habit.completedDates.includes(date)) {
      // Not completed, return as-is
      return habit;
    }

    const updatedHabit: Habit = {
      ...habit,
      completedDates: habit.completedDates.filter((d) => d !== date),
      streakCount: calculateStreak(
        habit.completedDates.filter((d) => d !== date),
      ),
      updatedAt: new Date().toISOString(),
      syncStatus: "pending",
      version: (habit.version || 1) + 1,
    };

    const updated = [...habits];
    updated[habitIndex] = updatedHabit;
    setString(HABITS_KEY, JSON.stringify(updated));

    return updatedHabit;
  } catch (error) {
    console.error(
      `[HabitLocalRepository] Failed to uncomplete habit ${id}:`,
      error,
    );
    throw new HabitLocalRepositoryError(
      `Failed to uncomplete habit ${id}`,
      error,
    );
  }
}

function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;

  const sorted = [...completedDates].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Check if streak is active (completed today or yesterday)
  if (!sorted.includes(today) && !sorted.includes(yesterday)) {
    return 0;
  }

  let streak = 0;
  let currentDate = new Date();

  while (true) {
    const dateStr = currentDate.toISOString().split("T")[0];
    if (sorted.includes(dateStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
