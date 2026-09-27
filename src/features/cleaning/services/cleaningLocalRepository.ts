import {
  DurableMutationError,
  SerializedMutationQueue,
  type DurableMutationOperation,
} from "@/services/storage/durableMutation";
import { cleaningStorageDefinition } from "@/services/storage/domainSchemas";
import { loadVersionedData, saveVersionedData } from "@/services/storage/versionedStorage";
import { isLocalDateKey } from "@/utils/dateTime";
import type { CleaningItem, CleaningItemInput } from "../types/cleaning";
import { cleaningOccurrenceDates } from "./cleaningSchedule";

const mutations = new SerializedMutationQueue();

function loadAll(): CleaningItem[] {
  return loadVersionedData(cleaningStorageDefinition).data;
}

function saveAll(items: CleaningItem[]): void {
  saveVersionedData(cleaningStorageDefinition, items);
}

function validateInput(input: CleaningItemInput, operation: DurableMutationOperation): CleaningItemInput {
  const name = input.name.trim();
  const notes = input.notes?.trim() || undefined;
  if (!name) throw new DurableMutationError("cleaning", operation, "invalid-input", "A cleaning item needs a name.");
  if (!isLocalDateKey(input.startDate)) throw new DurableMutationError("cleaning", operation, "invalid-input", "Choose a valid schedule date.");
  if (input.recurrence.type !== "none" && (!Number.isInteger(input.recurrence.interval ?? 1) || (input.recurrence.interval ?? 1) < 1)) {
    throw new DurableMutationError("cleaning", operation, "invalid-input", "Repeat intervals must be at least one.");
  }
  return { ...input, name, notes };
}

function mutate<T>(operation: DurableMutationOperation, work: () => T): Promise<T> {
  return mutations.run(() => {
    try { return work(); }
    catch (cause) {
      if (cause instanceof DurableMutationError) throw cause;
      throw new DurableMutationError("cleaning", operation, "write-failed", "Cleaning changes could not be saved.", cause);
    }
  });
}

function activeIndex(items: CleaningItem[], id: string): number {
  return items.findIndex((item) => item.id === id && !item.deletedAt);
}

export async function getCleaningItems(): Promise<CleaningItem[]> {
  await mutations.waitForIdle();
  return loadAll().filter((item) => !item.deletedAt);
}

export function createCleaningItem(input: CleaningItemInput): Promise<CleaningItem> {
  return mutate("create", () => {
    const valid = validateInput(input, "create");
    const items = loadAll();
    const now = new Date().toISOString();
    const item: CleaningItem = {
      ...valid,
      id: `cleaning_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      completedDates: [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    };
    saveAll([...items, item]);
    return item;
  });
}

export function updateCleaningItem(id: string, input: CleaningItemInput): Promise<CleaningItem> {
  return mutate("update", () => {
    const valid = validateInput(input, "update");
    const items = loadAll();
    const index = activeIndex(items, id);
    if (index < 0) throw new DurableMutationError("cleaning", "update", "not-found", "That cleaning item no longer exists.");
    const current = items[index];
    const updated: CleaningItem = { ...current, ...valid, updatedAt: new Date().toISOString(), version: current.version + 1 };
    items[index] = updated;
    saveAll(items);
    return updated;
  });
}

export function deleteCleaningItem(id: string): Promise<void> {
  return mutate("delete", () => {
    const items = loadAll();
    const index = activeIndex(items, id);
    if (index < 0) return;
    const now = new Date().toISOString();
    items[index] = { ...items[index], deletedAt: now, updatedAt: now, version: items[index].version + 1 };
    saveAll(items);
  });
}

export function setCleaningCompletion(id: string, date: string, complete: boolean): Promise<CleaningItem> {
  return mutate(complete ? "complete" : "uncomplete", () => {
    const items = loadAll();
    const index = activeIndex(items, id);
    if (index < 0) throw new DurableMutationError("cleaning", complete ? "complete" : "uncomplete", "not-found", "That cleaning item no longer exists.");
    const current = items[index];
    if (!isLocalDateKey(date) || !cleaningOccurrenceDates(current, date, date).includes(date)) {
      throw new DurableMutationError("cleaning", complete ? "complete" : "uncomplete", "invalid-input", "Only scheduled occurrences can be changed.");
    }
    const completedDates = complete
      ? [...new Set([...current.completedDates, date])].sort()
      : current.completedDates.filter((value) => value !== date);
    const updated: CleaningItem = { ...current, completedDates, updatedAt: new Date().toISOString(), version: current.version + 1 };
    items[index] = updated;
    saveAll(items);
    return updated;
  });
}
