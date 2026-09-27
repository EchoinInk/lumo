import type { BudgetCategory } from "@/features/budget/types/budgetCategory";
import type { BudgetPeriodTotals, BudgetTransaction } from "@/features/budget/types/budgetTransaction";
import type { Habit } from "@/features/habits/types/habit";
import type { MealEntry } from "@/features/meals/types/meal";
import type { Task } from "@/features/tasks/types/task";
import type { WeightEntry } from "@/features/weight/types/weight";
import type { Workout } from "@/features/workouts/types/workout";
import { calculateBudgetTotals } from "@/features/budget/services/budgetSummary";
import { calculateCurrentHabitStreak, isHabitScheduledOn } from "@/features/habits/services/habitHistory";
import { addLocalDays, weekdayIndexForLocalDate } from "@/utils/dateTime";

export interface CompletionSummary {
  completed: number;
  total: number;
  percent: number;
}

export interface TodayProgressSummary extends CompletionSummary {
  date: string;
  tasks: CompletionSummary;
  habits: CompletionSummary;
}

export interface HabitDaySummary extends CompletionSummary {
  date: string;
  scheduled: Habit[];
  completedIds: string[];
  longestCurrentStreakDays: number | null;
}

export interface CalorieDaySummary {
  date: string;
  entries: MealEntry[];
  knownKcal: number;
  knownEntryCount: number;
  unknownEntryCount: number;
}

export interface WeightAsOfSummary {
  asOfDate: string;
  latest: WeightEntry | null;
  previous: WeightEntry | null;
  changeGrams: number | null;
}

export interface WorkoutWeekSummary {
  startDate: string;
  endDateExclusive: string;
  count: number;
  durationMinutes: number;
  knownKcal: number;
  knownCalorieEntryCount: number;
  unknownCalorieEntryCount: number;
}

const completion = (completed: number, total: number): CompletionSummary => ({
  completed,
  total,
  percent: total === 0 ? 0 : Math.round((completed / total) * 100),
});

/**
 * Task progress for a local civil date. The denominator is active records whose
 * dueDate equals the date. Completion is attributed to the task's due date, not
 * its completedAt timestamp, so future, overdue, unscheduled and deleted tasks
 * cannot change the selected day's progress.
 */
export function taskProgressForDate(tasks: Task[], date: string): CompletionSummary {
  const due = tasks.filter((task) => !task.deletedAt && task.dueDate === date);
  return completion(due.filter((task) => task.completed).length, due.length);
}

/**
 * Habit progress for a local civil date. The denominator is active habits
 * scheduled on the date; completion is the presence of that exact date in the
 * habit's canonical completion history. Deleted habits and unrelated history
 * do not contribute. A missing streak is null rather than an invented zero-day
 * achievement.
 */
export function habitSummaryForDate(habits: Habit[], date: string): HabitDaySummary {
  const active = habits.filter((habit) => !habit.deletedAt);
  const scheduled = active.filter((habit) => isHabitScheduledOn(habit, date));
  const completedIds = scheduled
    .filter((habit) => habit.completedDates.includes(date))
    .map((habit) => habit.id);
  const currentStreaks = active.map((habit) => calculateCurrentHabitStreak(habit, date));
  return {
    date,
    scheduled,
    completedIds,
    longestCurrentStreakDays: currentStreaks.length ? Math.max(...currentStreaks) : null,
    ...completion(completedIds.length, scheduled.length),
  };
}

/** Combines only the canonical task and habit denominators for the same date. */
export function todayProgressSummary(tasks: Task[], habits: Habit[], date: string): TodayProgressSummary {
  const taskSummary = taskProgressForDate(tasks, date);
  const habitSummary = habitSummaryForDate(habits, date);
  const combined = completion(
    taskSummary.completed + habitSummary.completed,
    taskSummary.total + habitSummary.total,
  );
  return { date, tasks: taskSummary, habits: habitSummary, ...combined };
}

/**
 * Calorie intake for one local civil date. Meals are consumed records; meal-plan
 * assignments are intentionally not accepted by this selector. Known calories
 * are summed in kcal and missing nutrition remains an explicit unknown count.
 */
export function calorieSummaryForDate(meals: MealEntry[], date: string): CalorieDaySummary {
  const entries = meals.filter((meal) => !meal.deletedAt && meal.date === date);
  const known = entries.filter((meal) => meal.nutrition?.calories !== undefined);
  return {
    date,
    entries,
    knownKcal: known.reduce((sum, meal) => sum + (meal.nutrition?.calories ?? 0), 0),
    knownEntryCount: known.length,
    unknownEntryCount: entries.length - known.length,
  };
}

/** Latest and immediately previous active weight records on or before a date. */
export function weightSummaryAsOf(entries: WeightEntry[], asOfDate: string): WeightAsOfSummary {
  const history = entries
    .filter((entry) => !entry.deletedAt && entry.date <= asOfDate)
    .slice()
    .sort((left, right) => right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt));
  const latest = history[0] ?? null;
  const previous = history[1] ?? null;
  return {
    asOfDate,
    latest,
    previous,
    changeGrams: latest && previous ? latest.grams - previous.grams : null,
  };
}

export function mondayForLocalDate(date: string): string {
  return addLocalDays(date, -((weekdayIndexForLocalDate(date) + 6) % 7));
}

/** Active workout records in a Monday-inclusive, next-Monday-exclusive window. */
export function workoutSummaryForWeek(workouts: Workout[], date: string): WorkoutWeekSummary {
  const startDate = mondayForLocalDate(date);
  const endDateExclusive = addLocalDays(startDate, 7);
  const selected = workouts.filter(
    (workout) => !workout.deletedAt && workout.date >= startDate && workout.date < endDateExclusive,
  );
  const known = selected.filter((workout) => workout.calorieEstimate !== null);
  return {
    startDate,
    endDateExclusive,
    count: selected.length,
    durationMinutes: selected.reduce((sum, workout) => sum + workout.durationMinutes, 0),
    knownKcal: known.reduce((sum, workout) => sum + (workout.calorieEstimate ?? 0), 0),
    knownCalorieEntryCount: known.length,
    unknownCalorieEntryCount: selected.length - known.length,
  };
}

/**
 * Calendar-month budget summary in NZD minor units. The transaction ledger is
 * the sole spending/income source; paid payments contribute only through their
 * canonical sourcePaymentId-linked expense, preventing double counting.
 */
export function budgetSummaryForMonth(
  categories: BudgetCategory[],
  transactions: BudgetTransaction[],
  date: string,
): BudgetPeriodTotals {
  return calculateBudgetTotals(
    categories.filter((category) => !category.deletedAt),
    transactions,
    date,
  );
}
