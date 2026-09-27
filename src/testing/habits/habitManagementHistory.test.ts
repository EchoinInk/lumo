import {
  calculateBestHabitStreak,
  calculateCurrentHabitStreak,
  getHabitCompletionHistory,
  isHabitScheduledOn,
} from "@/features/habits/services/habitHistory";
import * as repository from "@/features/habits/services/habitLocalRepository";
import { useHabitStore } from "@/features/habits/store/useHabitStore";
import type { Habit } from "@/features/habits/types/habit";
import { DurableMutationError } from "@/services/storage/durableMutation";
import { deleteKey } from "@/services/storage/mmkv";
import { StorageKeys } from "@/services/storage/storageKeys";
import { assert, assertDeepEqual, assertEqual } from "../testUtils";

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "habit-history",
    title: "Gentle routine",
    frequency: "daily",
    streakCount: 99,
    completedDates: [],
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

function reset(): void {
  deleteKey(StorageKeys.HABITS);
  useHabitStore.setState({
    habits: [],
    isHydrated: true,
    isLoading: false,
    error: null,
  });
}

export function testWeeklyScheduleDistinguishesScheduledAndOffDays(): void {
  const weekly = habit({ frequency: "weekly", targetDays: ["Mon", "Wed"] });
  assertEqual(isHabitScheduledOn(weekly, "2026-09-28"), true, "Monday should be scheduled");
  assertEqual(isHabitScheduledOn(weekly, "2026-09-29"), false, "Tuesday should be an off day");
}

export function testCurrentStreakUsesScheduledDaysAndStopsAtMissedDay(): void {
  const weekly = habit({
    frequency: "weekly",
    targetDays: ["Mon", "Wed", "Fri"],
    completedDates: ["2026-09-18", "2026-09-23", "2026-09-25"],
  });
  assertEqual(
    calculateCurrentHabitStreak(weekly, "2026-09-27"),
    2,
    "the missed Monday should break the schedule-aware streak",
  );
}

export function testYesterdayOnlyDailyStreakRemainsActive(): void {
  assertEqual(
    calculateCurrentHabitStreak(habit({ completedDates: ["2026-09-26"] }), "2026-09-27"),
    1,
    "today should remain available without erasing yesterday's active streak",
  );
}

export function testHistoricalBestIsIndependentOfCurrentStreak(): void {
  const record = habit({
    completedDates: ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-20"],
  });
  assertEqual(calculateBestHabitStreak(record), 3, "historical best should retain the longest past run");
  assertEqual(calculateCurrentHabitStreak(record, "2026-09-21"), 1, "current streak should use the active run only");
}

export function testCompletionHistoryIsDatedUniqueAndNewestFirst(): void {
  assertDeepEqual(
    getHabitCompletionHistory(habit({ completedDates: ["2026-09-20", "invalid", "2026-09-21", "2026-09-20"] })),
    ["2026-09-21", "2026-09-20"],
    "history should expose valid persisted dates once, newest first",
  );
}

export async function testWeeklyHabitRequiresTargetDays(): Promise<void> {
  reset();
  let error: unknown;
  try {
    await repository.createHabit({ title: "Weekly", frequency: "weekly" });
  } catch (cause) {
    error = cause;
  }
  assert(error instanceof DurableMutationError, "invalid weekly input should use the durable failure contract");
  assertEqual((error as DurableMutationError).kind, "invalid-input", "weekly validation should identify invalid input");
  assertEqual((await repository.getHabits()).length, 0, "invalid input must not be persisted");
}

export async function testCompletionUndoAndRepeatedActionsPersistExactlyOnce(): Promise<void> {
  reset();
  const created = await repository.createHabit({ title: "Water", frequency: "daily" });
  await Promise.all([
    repository.completeHabit(created.id, "2026-09-27"),
    repository.completeHabit(created.id, "2026-09-27"),
  ]);
  assertDeepEqual(
    (await repository.getHabitById(created.id))?.completedDates,
    ["2026-09-27"],
    "repeated completion must persist one dated record",
  );
  await repository.uncompleteHabit(created.id, "2026-09-27");
  assertDeepEqual(
    (await repository.getHabitById(created.id))?.completedDates,
    [],
    "undo should remove the persisted dated record",
  );
}

export async function testDeletionRecoverySurvivesRepositoryReload(): Promise<void> {
  reset();
  const created = await repository.createHabit({ title: "Walk", frequency: "daily" });
  await repository.completeHabit(created.id, "2026-09-26");
  await repository.deleteHabit(created.id);
  assertEqual(await repository.getHabitById(created.id), null, "deleted habits should leave active management results");

  await repository.restoreHabit(created.id);
  const reloaded = await repository.getHabitById(created.id);
  assertEqual(reloaded?.title, "Walk", "restored habit should be retrievable after a fresh repository read");
  assertDeepEqual(reloaded?.completedDates, ["2026-09-26"], "deletion recovery should preserve dated history");
}
