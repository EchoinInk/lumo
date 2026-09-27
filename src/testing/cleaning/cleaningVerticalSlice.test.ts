import * as repository from "@/features/cleaning/services/cleaningLocalRepository";
import { cleaningOccurrenceDates, cleaningOccurrences } from "@/features/cleaning/services/cleaningSchedule";
import { useCleaningStore } from "@/features/cleaning/store/useCleaningStore";
import type { CleaningItem } from "@/features/cleaning/types/cleaning";
import { deleteKey } from "@/services/storage/mmkv";
import { StorageKeys } from "@/services/storage/storageKeys";
import { DurableMutationError } from "@/services/storage/durableMutation";
import { assert, assertDeepEqual, assertEqual } from "../testUtils";

function reset(): void {
  deleteKey(StorageKeys.CLEANING);
  useCleaningStore.setState({ items: [], isHydrated: true, isLoading: false, error: null });
}

function item(overrides: Partial<CleaningItem> = {}): CleaningItem {
  return {
    id: "cleaning-1",
    name: "Kitchen",
    startDate: "2026-09-21",
    recurrence: { type: "daily" },
    completedDates: [],
    createdAt: "2026-09-21T00:00:00.000Z",
    updatedAt: "2026-09-21T00:00:00.000Z",
    deletedAt: null,
    version: 1,
    ...overrides,
  };
}

export function testCleaningScheduleUsesCivilOccurrencesAndSkippedDays(): void {
  assertDeepEqual(
    cleaningOccurrenceDates(item(), "2026-09-23", "2026-09-27"),
    ["2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27"],
    "daily schedules should preserve each real occurrence after skipped days",
  );
  assertDeepEqual(
    cleaningOccurrenceDates(item({ startDate: "2026-09-23", recurrence: { type: "weekly" } }), "2026-09-21", "2026-10-08"),
    ["2026-09-23", "2026-09-30", "2026-10-07"],
    "weekly schedules should stay anchored to the selected local date",
  );
}

export function testProgressIsDerivedFromDatedOccurrences(): void {
  const items = [
    item({ completedDates: ["2026-09-21", "2026-09-23"] }),
    item({ id: "cleaning-2", startDate: "2026-09-23", recurrence: { type: "none" }, completedDates: ["2026-09-23"] }),
  ];
  const occurrences = cleaningOccurrences(items, "2026-09-21", "2026-09-23");
  assertEqual(occurrences.length, 4, "progress denominator should be scheduled occurrences, not item count");
  assertEqual(occurrences.filter((value) => value.completed).length, 3, "progress numerator should use persisted dated completions");
}

export async function testCleaningCrudCompletionUndoDeleteAndRestart(): Promise<void> {
  reset();
  const created = await repository.createCleaningItem({ name: "  Bathroom  ", notes: "  Sink  ", startDate: "2026-09-27", recurrence: { type: "weekly" } });
  assertEqual(created.name, "Bathroom", "create should normalize the user name");
  assertEqual(created.notes, "Sink", "create should normalize optional notes");

  const updated = await repository.updateCleaningItem(created.id, { name: "Bathroom reset", startDate: "2026-09-27", recurrence: { type: "daily" } });
  assertEqual(updated.recurrence.type, "daily", "editing should durably change the schedule");
  await repository.setCleaningCompletion(created.id, "2026-09-27", true);
  await repository.setCleaningCompletion(created.id, "2026-09-27", true);
  assertDeepEqual((await repository.getCleaningItems())[0].completedDates, ["2026-09-27"], "repeated completion must create one dated result");
  await repository.setCleaningCompletion(created.id, "2026-09-27", false);
  assertDeepEqual((await repository.getCleaningItems())[0].completedDates, [], "undo should remove that occurrence only");

  await repository.setCleaningCompletion(created.id, "2026-09-27", true);
  useCleaningStore.setState({ items: [], isHydrated: false });
  await useCleaningStore.getState().hydrate();
  assertDeepEqual(useCleaningStore.getState().items[0].completedDates, ["2026-09-27"], "hydration should restore completion history from storage");
  await repository.deleteCleaningItem(created.id);
  assertEqual((await repository.getCleaningItems()).length, 0, "deleted cleaning items should not remain displayed");
}

export async function testCleaningValidationAndSaveFailureRemainActionable(): Promise<void> {
  reset();
  let invalid: unknown;
  try {
    await repository.createCleaningItem({ name: " ", startDate: "not-a-date", recurrence: { type: "none" } });
  } catch (error) { invalid = error; }
  assert(invalid instanceof DurableMutationError, "invalid cleaning input should use the durable mutation contract");
  assertEqual((await repository.getCleaningItems()).length, 0, "invalid records must not be stored");

  const storage = globalThis.localStorage;
  const original = storage.setItem.bind(storage);
  storage.setItem = () => { throw new Error("disk full"); };
  let failed: unknown;
  try {
    await useCleaningStore.getState().createItem({ name: "Hall", startDate: "2026-09-27", recurrence: { type: "none" } });
  } catch (error) { failed = error; }
  finally { storage.setItem = original; }
  assert(failed instanceof DurableMutationError, "write failures should reject before UI success");
  assert(Boolean(useCleaningStore.getState().error), "the store should expose a retryable save failure");
  assertEqual(useCleaningStore.getState().items.length, 0, "failed writes must not update canonical memory");
}
