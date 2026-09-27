import {
  addLocalDays,
  isLocalDateKey,
  toLocalDateKey,
  weekdayIndexForLocalDate,
} from "@/src/utils/dateTime";
import type { Habit, HabitFrequency } from "../types/habit";

export const habitWeekdays = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export type HabitWeekday = (typeof habitWeekdays)[number];

export function isValidWeeklyTargetDays(
  frequency: HabitFrequency,
  targetDays?: string[],
): boolean {
  if (frequency === "daily") return true;
  return Boolean(
    targetDays?.length &&
      new Set(targetDays).size === targetDays.length &&
      targetDays.every((day) => habitWeekdays.includes(day as HabitWeekday)),
  );
}

export function isHabitScheduledOn(habit: Pick<Habit, "frequency" | "targetDays">, date: string): boolean {
  if (!isLocalDateKey(date)) return false;
  if (habit.frequency === "daily") return true;
  if (!isValidWeeklyTargetDays(habit.frequency, habit.targetDays)) return false;
  return habit.targetDays!.includes(habitWeekdays[weekdayIndexForLocalDate(date)]);
}

function previousScheduledDate(habit: Habit, fromDate: string): string | null {
  let candidate = addLocalDays(fromDate, -1);
  for (let attempts = 0; attempts < 7; attempts += 1) {
    if (isHabitScheduledOn(habit, candidate)) return candidate;
    candidate = addLocalDays(candidate, -1);
  }
  return null;
}

function activeStreakEnd(habit: Habit, today: string): string | null {
  if (isHabitScheduledOn(habit, today) && habit.completedDates.includes(today)) {
    return today;
  }
  return previousScheduledDate(habit, today);
}

export function calculateCurrentHabitStreak(
  habit: Habit,
  today: string = toLocalDateKey(),
): number {
  const completed = new Set<string>(habit.completedDates.filter(isLocalDateKey));
  let cursor = activeStreakEnd(habit, today);
  let streak = 0;

  while (cursor && cursor <= today && completed.has(cursor)) {
    streak += 1;
    cursor = previousScheduledDate(habit, cursor);
  }
  return streak;
}

export function calculateBestHabitStreak(habit: Habit): number {
  const scheduledCompletions = [...new Set(habit.completedDates)]
    .filter(isLocalDateKey)
    .filter((date) => isHabitScheduledOn(habit, date))
    .sort();

  let best = 0;
  let current = 0;
  let previous: string | null = null;
  for (const date of scheduledCompletions) {
    current = previousScheduledDate(habit, date) === previous ? current + 1 : 1;
    best = Math.max(best, current);
    previous = date;
  }
  return best;
}

export function getHabitCompletionHistory(habit: Habit): string[] {
  return [...new Set(habit.completedDates)]
    .filter(isLocalDateKey)
    .sort((left, right) => right.localeCompare(left));
}
