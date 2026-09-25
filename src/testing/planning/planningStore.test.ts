import {
  createEmptyDailySummary,
  createEmptyPlanningParkingState,
  loadPlanningState,
} from "@/features/planning/services/planningStorage";
import { usePlanningStore } from "@/features/planning/store/usePlanningStore";
import {
  getSuggestedNextSteps,
} from "@/features/planning/services/planningComposer";
import type { Task } from "@/features/tasks/types/task";
import { deleteKey } from "@/services/storage/mmkv";
import { StorageKeys } from "@/services/storage/storageKeys";
import { addLocalDays, toLocalDateKey } from "@/src/utils/dateTime";
import { assert, assertEqual, resetTestState } from "../testUtils";

function resetPlanningStore(): void {
  const today = toLocalDateKey();
  usePlanningStore.setState({
    summary: createEmptyDailySummary(today),
    parking: createEmptyPlanningParkingState(),
    hasHydrated: false,
    hydrationError: null,
  });
}

function resetPlanningState(): void {
  resetTestState();
  deleteKey(StorageKeys.PLANNING_SUMMARY);
  deleteKey(StorageKeys.PLANNING_PARKING);
  resetPlanningStore();
}

function makeTask(id: string, title: string, priority: Task["priority"]): Task {
  const now = new Date().toISOString();
  return {
    id,
    title,
    completed: false,
    priority,
    createdAt: now,
    updatedAt: now,
  };
}

export async function testPlanningStoreNotifiesMultipleSubscribers(): Promise<void> {
  resetPlanningState();
  const today = toLocalDateKey();
  usePlanningStore.getState().hydratePlanning(today);
  let firstSubscriberEnergy: string | undefined;
  let secondSubscriberEnergy: string | undefined;

  const unsubscribeFirst = usePlanningStore.subscribe((state) => {
    firstSubscriberEnergy = state.summary.energyLevel;
  });
  const unsubscribeSecond = usePlanningStore.subscribe((state) => {
    secondSubscriberEnergy = state.summary.energyLevel;
  });

  usePlanningStore.getState().updateSummary((summary) => ({
    ...summary,
    energyLevel: "steady",
  }));

  unsubscribeFirst();
  unsubscribeSecond();

  assertEqual(firstSubscriberEnergy, "steady", "first subscriber should observe the update");
  assertEqual(secondSubscriberEnergy, "steady", "second subscriber should observe the update");
}

export async function testPlanningStoreFunctionalUpdatesDoNotOverwrite(): Promise<void> {
  resetPlanningState();
  const today = toLocalDateKey();
  usePlanningStore.getState().hydratePlanning(today);

  usePlanningStore.getState().updateSummary((summary) => ({
    ...summary,
    carryOverIds: [...summary.carryOverIds, "carry-a"],
  }));
  usePlanningStore.getState().updateSummary((summary) => ({
    ...summary,
    brainDumpQueueIds: [...summary.brainDumpQueueIds, "brain-b"],
  }));

  const summary = usePlanningStore.getState().summary;
  assertEqual(summary.carryOverIds.includes("carry-a"), true, "first update should remain");
  assertEqual(summary.brainDumpQueueIds.includes("brain-b"), true, "second update should remain");
}

export async function testPlanningParkingSurvivesRestart(): Promise<void> {
  resetPlanningState();
  const today = toLocalDateKey();
  usePlanningStore.getState().hydratePlanning(today);
  usePlanningStore.getState().parkSource(
    { sourceType: "task", sourceId: "task-restart" },
    { parkedFrom: "morning" },
  );

  resetPlanningStore();
  usePlanningStore.getState().hydratePlanning(today);

  assertEqual(
    usePlanningStore.getState().parking.parkedItems[0]?.sourceId,
    "task-restart",
    "parking should hydrate after an app restart",
  );
}

export async function testPlanningParkingSurvivesRolloverInStore(): Promise<void> {
  resetPlanningState();
  const today = toLocalDateKey();
  const tomorrow = addLocalDays(today, 1);
  usePlanningStore.getState().hydratePlanning(today);
  usePlanningStore.getState().updateSummary((summary) => ({
    ...summary,
    morningCompleted: true,
  }));
  usePlanningStore.getState().parkSource(
    { sourceType: "task", sourceId: "task-rollover" },
    { parkedFrom: "evening" },
  );

  usePlanningStore.getState().hydratePlanning(tomorrow);

  const state = usePlanningStore.getState();
  assertEqual(state.summary.date, tomorrow, "store summary should roll to the new day");
  assertEqual(state.summary.morningCompleted, false, "day-scoped completion should reset");
  assertEqual(
    state.parking.parkedItems[0]?.sourceId,
    "task-rollover",
    "parked item should remain after store rollover",
  );
}

export async function testDeletedSourceParkingCanBeClearedSafely(): Promise<void> {
  resetPlanningState();
  const today = toLocalDateKey();
  usePlanningStore.getState().hydratePlanning(today);
  usePlanningStore.getState().parkSource(
    { sourceType: "task", sourceId: "deleted-task" },
    { parkedFrom: "morning" },
  );

  usePlanningStore.getState().removeParkedSource({
    sourceType: "task",
    sourceId: "deleted-task",
  });

  assertEqual(
    usePlanningStore.getState().parking.parkedItems.length,
    0,
    "clearing a parked ref should not require the source entity to exist",
  );
}

export async function testRecommendationSelectionCanResolveBeyondVisibleRank(): Promise<void> {
  const today = toLocalDateKey();
  const tasks = [
    makeTask("low-1", "Low 1", "low"),
    makeTask("low-2", "Low 2", "low"),
    makeTask("low-3", "Low 3", "low"),
    makeTask("selected", "Selected", "medium"),
  ];

  const visible = getSuggestedNextSteps({
    tasks,
    reminders: [],
    routineLabels: [],
    brainDumpEntries: [],
    today,
  });
  const all = getSuggestedNextSteps({
    tasks,
    reminders: [],
    routineLabels: [],
    brainDumpEntries: [],
    today,
  }, Number.MAX_SAFE_INTEGER);

  assert(
    !visible.some((step) => step.sourceId === "selected"),
    "selected source can fall out of the visible ranked recommendations",
  );
  assert(
    all.some((step) => step.sourceId === "selected"),
    "the full resolver list should still include the selected source identity",
  );
}

export async function testParkingRestoreRemovesDurableRecord(): Promise<void> {
  resetPlanningState();
  const today = toLocalDateKey();
  usePlanningStore.getState().hydratePlanning(today);
  usePlanningStore.getState().parkSource(
    { sourceType: "task", sourceId: "task-restore" },
    { parkedFrom: "morning" },
  );
  usePlanningStore.getState().unparkSource({
    sourceType: "task",
    sourceId: "task-restore",
  });

  const reloaded = loadPlanningState(today);

  assertEqual(
    reloaded.parking.parkedItems.length,
    0,
    "restoring a parked source should remove its durable parking record",
  );
}
