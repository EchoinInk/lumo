import * as habitLocalRepository from "@/features/habits/services/habitLocalRepository";
import type { Habit } from "@/features/habits/types/habit";
import type { AsyncResult } from "@/types/result";
import { err, ok } from "@/types/result";

/**
 * @deprecated Use HabitLocalRepository from the habits feature.
 * This facade delegates every operation to the canonical repository so an old
 * import cannot reactivate the former persisted Zustand store.
 */
export class HabitRepository {
  async getAll(): AsyncResult<Habit[]> {
    return this.capture(() => habitLocalRepository.getHabits());
  }

  async getById(id: string): AsyncResult<Habit | null> {
    return this.capture(() => habitLocalRepository.getHabitById(id));
  }

  async create(
    habit: Omit<
      Habit,
      "id" | "createdAt" | "updatedAt" | "completedDates" | "streakCount"
    >,
  ): AsyncResult<Habit> {
    return this.capture(() =>
      habitLocalRepository.createHabit({
        title: habit.title,
        description: habit.description,
        frequency: habit.frequency,
        targetDays: habit.targetDays,
        color: habit.color,
        icon: habit.icon,
      }),
    );
  }

  async update(id: string, updates: Partial<Habit>): AsyncResult<Habit> {
    return this.capture(() => habitLocalRepository.updateHabit(id, updates));
  }

  async delete(id: string): AsyncResult<boolean> {
    return this.capture(async () => {
      await habitLocalRepository.deleteHabit(id);
      return true;
    });
  }

  async toggleCompletion(id: string, date: string): AsyncResult<Habit> {
    return this.capture(async () => {
      const habit = await habitLocalRepository.getHabitById(id);
      if (!habit) throw new Error(`Habit ${id} not found`);
      return habit.completedDates.includes(date)
        ? habitLocalRepository.uncompleteHabit(id, date)
        : habitLocalRepository.completeHabit(id, date);
    });
  }

  async getByFrequency(frequency: "daily" | "weekly"): AsyncResult<Habit[]> {
    return this.capture(async () =>
      (await habitLocalRepository.getHabits()).filter(
        (habit) => habit.frequency === frequency,
      ),
    );
  }

  async getByDate(date: string): AsyncResult<Habit[]> {
    return this.capture(async () =>
      (await habitLocalRepository.getHabits()).filter((habit) =>
        habit.completedDates.includes(date),
      ),
    );
  }

  private async capture<T>(operation: () => Promise<T>): AsyncResult<T> {
    try {
      return ok(await operation());
    } catch (error) {
      return err(error instanceof Error ? error.message : String(error));
    }
  }
}

export const habitRepository = new HabitRepository();
