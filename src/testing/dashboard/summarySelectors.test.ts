import {
  budgetSummaryForMonth,
  calorieSummaryForDate,
  habitSummaryForDate,
  todayProgressSummary,
  weightSummaryAsOf,
  workoutSummaryForWeek,
} from "@/features/dashboard/utils/summarySelectors";
import type { BudgetCategory } from "@/features/budget/types/budgetCategory";
import type { BudgetTransaction } from "@/features/budget/types/budgetTransaction";
import type { Habit } from "@/features/habits/types/habit";
import type { MealEntry } from "@/features/meals/types/meal";
import type { Task } from "@/features/tasks/types/task";
import type { WeightEntry } from "@/features/weight/types/weight";
import type { Workout } from "@/features/workouts/types/workout";
import { assertEqual } from "../testUtils";
import fs from "fs";
import path from "path";

const instant = "2026-09-28T00:00:00.000Z";
const task = (id: string, dueDate: string | undefined, completed = false, deletedAt: string | null = null): Task => ({
  id, title: id, priority: "medium", dueDate, completed, completedAt: completed ? instant : undefined,
  createdAt: instant, updatedAt: instant, deletedAt,
});
const habit = (id: string, completedDates: string[], deletedAt: string | null = null): Habit => ({
  id, title: id, frequency: "daily", streakCount: 0, completedDates,
  createdAt: instant, updatedAt: instant, deletedAt,
});
const meal = (id: string, date: string, calories?: number, deletedAt: string | null = null): MealEntry => ({
  id, date, mealType: "snack", name: id,
  nutrition: calories === undefined ? undefined : { calories },
  createdAt: instant, updatedAt: instant, deletedAt, version: 1,
});

export function testTodayProgressExcludesFutureOverdueDeletedAndUnscheduledTasks(): void {
  const summary = todayProgressSummary(
    [
      task("today-done", "2026-09-28", true),
      task("today-open", "2026-09-28"),
      task("future-done", "2026-09-29", true),
      task("overdue-done", "2026-09-27", true),
      task("unscheduled-done", undefined, true),
      task("deleted-done", "2026-09-28", true, instant),
    ],
    [habit("habit-done", ["2026-09-28"]), habit("habit-open", ["2026-09-27"])],
    "2026-09-28",
  );
  assertEqual(summary.tasks.completed, 1, "only a completed task due today is attributed to today");
  assertEqual(summary.tasks.total, 2, "only tasks due today form today's task denominator");
  assertEqual(summary.completed, 2, "task and exact-date habit completion combine without historical leakage");
  assertEqual(summary.total, 4, "combined denominator contains only today's scheduled records");
  assertEqual(summary.percent, 50, "today's percentage is calculated from today's canonical denominator");
}

export function testHistoricalHabitCompletionAndDeletedRecordsStayScoped(): void {
  const summary = habitSummaryForDate(
    [habit("historical", ["2026-09-27"]), habit("selected", ["2026-09-27", "2026-09-28"]), habit("deleted", ["2026-09-28"], instant)],
    "2026-09-28",
  );
  assertEqual(summary.completed, 1, "only the selected local date is completion attribution");
  assertEqual(summary.total, 2, "deleted habits do not remain in the denominator");
  assertEqual(summary.longestCurrentStreakDays, 2, "streak derives from dated canonical history through the selected day");
  assertEqual(habitSummaryForDate([], "2026-09-28").longestCurrentStreakDays, null, "no habits is unknown rather than a fabricated streak");
}

export function testCaloriesUseConsumedEntriesAndPreserveUnknownValues(): void {
  const summary = calorieSummaryForDate(
    [meal("known", "2026-09-28", 400), meal("unknown", "2026-09-28"), meal("other-day", "2026-09-29", 900), meal("deleted", "2026-09-28", 500, instant)],
    "2026-09-28",
  );
  assertEqual(summary.knownKcal, 400, "known consumed calories are summed for the exact day");
  assertEqual(summary.unknownEntryCount, 1, "missing nutrition remains explicitly unknown");
  assertEqual(summary.entries.length, 2, "other-day and deleted meals are excluded");
}

export function testWeightAndWorkoutSelectorsRespectCivilDateBoundaries(): void {
  const weights: WeightEntry[] = [
    { id: "old", grams: 70000, date: "2026-09-27", createdAt: instant, updatedAt: instant, deletedAt: null, version: 1 },
    { id: "today", grams: 70500, date: "2026-09-28", createdAt: instant, updatedAt: instant, deletedAt: null, version: 1 },
    { id: "future", grams: 99000, date: "2026-09-29", createdAt: instant, updatedAt: instant, deletedAt: null, version: 1 },
  ];
  const weight = weightSummaryAsOf(weights, "2026-09-28");
  assertEqual(weight.latest?.id, "today", "future weight entries cannot become today's current value");
  assertEqual(weight.changeGrams, 500, "weight change uses the immediately previous eligible record");

  const workouts: Workout[] = [
    { id: "monday", activity: "Walk", date: "2026-09-28", durationMinutes: 20, calorieEstimate: 100, createdAt: instant, updatedAt: instant, deletedAt: null, version: 1 },
    { id: "unknown", activity: "Stretch", date: "2026-10-04", durationMinutes: 10, calorieEstimate: null, createdAt: instant, updatedAt: instant, deletedAt: null, version: 1 },
    { id: "next-week", activity: "Run", date: "2026-10-05", durationMinutes: 60, calorieEstimate: 600, createdAt: instant, updatedAt: instant, deletedAt: null, version: 1 },
  ];
  const week = workoutSummaryForWeek(workouts, "2026-10-04");
  assertEqual(week.count, 2, "Monday-through-Sunday workouts share one civil week");
  assertEqual(week.durationMinutes, 30, "next Monday is excluded from the current week");
  assertEqual(week.unknownCalorieEntryCount, 1, "missing workout calorie estimates remain unknown");
}

export function testBudgetUsesLedgerActualsOnceAcrossMonthBoundary(): void {
  const categories: BudgetCategory[] = [{ id: "food", name: "Food", plannedAmountMinor: 50000, currencyCode: "NZD", period: "monthly", createdAt: instant, updatedAt: instant, deletedAt: null, version: 1 }];
  const transactions: BudgetTransaction[] = [
    { id: "manual", type: "expense", amountMinor: 1000, currencyCode: "NZD", categoryId: "food", categoryNameSnapshot: "Food", title: "Manual", date: "2026-09-01", sourcePaymentId: null, createdAt: instant, updatedAt: instant, deletedAt: null, version: 1 },
    { id: "payment-expense", type: "expense", amountMinor: 2500, currencyCode: "NZD", categoryId: "food", categoryNameSnapshot: "Food", title: "Paid bill", date: "2026-09-30", sourcePaymentId: "payment-1", createdAt: instant, updatedAt: instant, deletedAt: null, version: 1 },
    { id: "next-month", type: "expense", amountMinor: 9000, currencyCode: "NZD", categoryId: "food", categoryNameSnapshot: "Food", title: "October", date: "2026-10-01", sourcePaymentId: null, createdAt: instant, updatedAt: instant, deletedAt: null, version: 1 },
  ];
  const summary = budgetSummaryForMonth(categories, transactions, "2026-09-28");
  assertEqual(summary.expenseMinor, 3500, "actuals come once from manual and payment-linked ledger expenses");
  assertEqual(summary.remainingMinor, 46500, "remaining is planned minus current-month ledger expense");
  assertEqual(summary.endDateExclusive, "2026-10-01", "calendar month uses an exclusive next-month boundary");
}

export function testLiveSummarySurfacesUseCanonicalSelectorsWithoutRetiredMocks(): void {
  const root = path.resolve(__dirname, "../../..");
  const dashboard = fs.readFileSync(path.join(root, "app", "(tabs)", "index.tsx"), "utf8");
  const health = fs.readFileSync(path.join(root, "app", "(tabs)", "health.tsx"), "utf8");
  const budget = fs.readFileSync(path.join(root, "app", "(tabs)", "more", "budget.tsx"), "utf8");
  assertEqual(dashboard.includes("todayProgressSummary"), true, "Dashboard uses the canonical daily selector");
  assertEqual(health.includes("calorieSummaryForDate"), true, "Health uses canonical health selectors");
  assertEqual(budget.includes("budgetSummaryForMonth"), true, "Budget uses the canonical monthly selector");
  assertEqual(fs.existsSync(path.join(root, "src", "features", "dashboard", "components", "WeeklyProgress.tsx")), false, "retired fake weekly goals are removed");
  assertEqual(fs.existsSync(path.join(root, "src", "features", "habits", "mock", "mockHabits.ts")), false, "mock habit records are removed");
}
