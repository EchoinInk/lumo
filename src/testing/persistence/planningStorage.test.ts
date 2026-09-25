import {
  createEmptyDailySummary,
  loadPlanningState,
  loadDailyPlanningSummary,
  normalizeDailyPlanningSummary,
  normalizePlanningParkingState,
  persistPlanningParkingState,
  persistDailyPlanningSummary,
} from "@/features/planning/services/planningStorage";
import { deleteKey, setString } from "@/services/storage/mmkv";
import { StorageKeys } from "@/services/storage/storageKeys";
import { assertEqual, resetTestState } from "../testUtils";
import { PersistenceLoadError } from "@/services/storage/versionedStorage";
import { addLocalDays, toLocalDateKey } from "@/src/utils/dateTime";

export async function testNormalizeDailyPlanningSummaryFallsBackSafely(): Promise<void> {
  const summary = normalizeDailyPlanningSummary({
    date: "2026-01-01",
    selectedFocusIds: ["a", 1, null] as unknown as string[],
    parkedIds: ["task-1", null] as unknown as string[],
    energyLevel: "invalid" as never,
    morningCompleted: "yes" as never,
  });

  assertEqual(summary.selectedFocusIds.join(","), "a", "non-string ids should be filtered");
  assertEqual(summary.date, "2026-01-01", "valid existing date keys should be preserved");
  assertEqual(summary.parkedIds.join(","), "task-1", "valid parked ids should be preserved");
  assertEqual(summary.energyLevel, undefined, "invalid energy should be cleared");
  assertEqual(summary.morningCompleted, false, "invalid booleans should default false");
}

export async function testLoadDailyPlanningSummaryRollsOverStaleDate(): Promise<void> {
  resetTestState();
  deleteKey(StorageKeys.PLANNING_SUMMARY);

  persistDailyPlanningSummary(
    normalizeDailyPlanningSummary({
      date: "2000-01-01",
      morningCompleted: true,
      selectedFocusIds: ["old-focus"],
    }),
  );

  const loaded = loadDailyPlanningSummary();
  const today = toLocalDateKey();

  assertEqual(loaded?.date, today, "stale planning summary should roll to today");
  assertEqual(loaded?.morningCompleted, false, "rolled summary should reset completion flags");
  assertEqual(loaded?.selectedFocusIds.length, 0, "rolled summary should clear focus ids");
}

export async function testLoadDailyPlanningSummaryRejectsCorruptJson(): Promise<void> {
  resetTestState();
  setString(StorageKeys.PLANNING_SUMMARY, "{bad json");

  try {
    loadDailyPlanningSummary();
    throw new Error("corrupt planning data should not load as empty");
  } catch (error) {
    assertEqual(
      error instanceof PersistenceLoadError && error.kind,
      "malformed-data",
      "corrupt planning data should be recoverable",
    );
  }
}

export async function testCreateEmptyDailySummaryUsesToday(): Promise<void> {
  const summary = createEmptyDailySummary();
  const today = toLocalDateKey();

  assertEqual(summary.date, today, "empty summary should use today");
  assertEqual(summary.eveningCompleted, false, "empty summary should not be completed");
}

export async function testPlanningAdjustmentsPreserveChoicesWhileReopening(): Promise<void> {
  const completed = normalizeDailyPlanningSummary({
    date: toLocalDateKey(),
    energyLevel: "steady",
    nextStepId: "task-1",
    morningCompleted: true,
    eveningCompleted: true,
  });

  const reopenedMorning = normalizeDailyPlanningSummary({
    ...completed,
    morningCompleted: false,
  });
  const reopenedEvening = normalizeDailyPlanningSummary({
    ...completed,
    eveningCompleted: false,
  });

  assertEqual(
    reopenedMorning.nextStepId,
    "task-1",
    "morning adjustment should preserve selected next step",
  );
  assertEqual(
    reopenedMorning.energyLevel,
    "steady",
    "morning adjustment should preserve energy level",
  );
  assertEqual(
    reopenedEvening.eveningCompleted,
    false,
    "evening adjustment should reopen reset",
  );
}

export async function testPlanningParkingSurvivesDayRollover(): Promise<void> {
  resetTestState();
  deleteKey(StorageKeys.PLANNING_SUMMARY);
  deleteKey(StorageKeys.PLANNING_PARKING);
  const today = toLocalDateKey();
  const tomorrow = addLocalDays(today, 1);

  persistDailyPlanningSummary(
    normalizeDailyPlanningSummary({
      date: today,
      morningCompleted: true,
      selectedFocusIds: ["focus-task-a"],
    }),
  );
  persistPlanningParkingState(
    normalizePlanningParkingState({
      parkedItems: [
        {
          id: "task:task-a",
          sourceType: "task",
          sourceId: "task-a",
          parkedAt: "2026-09-25T00:00:00.000Z",
          parkedFrom: "morning",
        },
      ],
    }),
  );

  const rolled = loadPlanningState(tomorrow);

  assertEqual(rolled.summary.date, tomorrow, "daily summary should roll forward");
  assertEqual(
    rolled.summary.morningCompleted,
    false,
    "rolled daily summary should reset day-scoped completion",
  );
  assertEqual(
    rolled.parking.parkedItems[0]?.sourceId,
    "task-a",
    "parking metadata should survive rollover",
  );
}

export async function testLegacyDailyParkingMigratesToDurableParking(): Promise<void> {
  resetTestState();
  deleteKey(StorageKeys.PLANNING_SUMMARY);
  deleteKey(StorageKeys.PLANNING_PARKING);
  const today = toLocalDateKey();

  persistDailyPlanningSummary(
    normalizeDailyPlanningSummary({
      date: addLocalDays(today, -1),
      parkedIds: ["legacy-task"],
      eveningParkedIds: ["evening-task"],
    }),
  );

  const loaded = loadPlanningState(today);

  assertEqual(
    loaded.parking.parkedItems.some((item) => item.sourceId === "legacy-task"),
    true,
    "legacy morning parking should move into durable parking",
  );
  assertEqual(
    loaded.parking.parkedItems.some(
      (item) => item.sourceId === "evening-task" && item.parkedFrom === "evening",
    ),
    true,
    "legacy evening parking should move into durable parking",
  );
}
