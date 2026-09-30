import {
  DurableMutationError,
  SerializedMutationQueue,
  type DurableMutationOperation,
} from "@/src/services/storage/durableMutation";
import { reminderStorageDefinition } from "@/src/services/storage/domainSchemas";
import { loadVersionedData, saveVersionedData } from "@/src/services/storage/versionedStorage";
import { isTimestampInstant } from "@/src/utils/dateTime";
import type {
  CreateReminderInput,
  Reminder,
  ReminderDeliveryState,
  ReminderSourceRef,
  UpdateReminderInput,
} from "../types/reminder";

const mutations = new SerializedMutationQueue();

function sourceRefFor(input: Pick<CreateReminderInput, "sourceRef" | "sourceBrainDumpId">): ReminderSourceRef | undefined {
  return input.sourceRef ?? (input.sourceBrainDumpId
    ? { type: "brain-dump", id: input.sourceBrainDumpId }
    : undefined);
}

export function normalizeReminder(reminder: Reminder): Reminder {
  const sourceRef = reminder.sourceRef ?? (reminder.sourceBrainDumpId
    ? { type: "brain-dump" as const, id: reminder.sourceBrainDumpId }
    : undefined);
  const deliveryState: ReminderDeliveryState = reminder.deliveryState ?? "not-scheduled";
  return {
    ...reminder,
    enabled: reminder.enabled ?? true,
    deliveryState,
    sourceRef,
    sourceBrainDumpId: reminder.sourceBrainDumpId ?? sourceRef?.id,
    version: reminder.version ?? 1,
  };
}

function loadAll(): Reminder[] {
  return loadVersionedData(reminderStorageDefinition).data.map(normalizeReminder);
}

function saveAll(reminders: Reminder[]): void {
  saveVersionedData(reminderStorageDefinition, reminders);
}

function validateSchedule(scheduledAt: string | undefined, operation: DurableMutationOperation, unchangedValue?: string): string | undefined {
  if (scheduledAt === undefined) return undefined;
  if (!isTimestampInstant(scheduledAt)) {
    throw new DurableMutationError("reminders", operation, "invalid-input", "Use a valid reminder date and time.");
  }
  if (scheduledAt !== unchangedValue && Date.parse(scheduledAt) <= Date.now()) {
    throw new DurableMutationError("reminders", operation, "invalid-input", "Choose a reminder time in the future.");
  }
  return scheduledAt;
}

function validateTitle(title: string, operation: DurableMutationOperation): string {
  const value = title.trim();
  if (!value) throw new DurableMutationError("reminders", operation, "invalid-input", "A reminder needs a title.");
  return value;
}

function mutate<T>(operation: DurableMutationOperation, work: () => T): Promise<T> {
  return mutations.run(() => {
    try { return work(); }
    catch (cause) {
      if (cause instanceof DurableMutationError) throw cause;
      throw new DurableMutationError("reminders", operation, "write-failed", "Reminder changes could not be saved.", cause);
    }
  });
}

function activeIndex(reminders: Reminder[], id: string): number {
  return reminders.findIndex((reminder) => reminder.id === id && !reminder.archivedAt);
}

function deliveryAfterDesiredChange(reminder: Reminder): Pick<Reminder, "deliveryState" | "osNotificationId" | "deliveryError" | "deliveryUpdatedAt"> {
  const now = new Date().toISOString();
  if (reminder.osNotificationId) {
    return { deliveryState: "cancellation-pending", osNotificationId: reminder.osNotificationId, deliveryUpdatedAt: now };
  }
  return { deliveryState: "not-scheduled", deliveryUpdatedAt: now };
}

export async function getReminders(): Promise<Reminder[]> {
  await mutations.waitForIdle();
  const stored = loadVersionedData(reminderStorageDefinition).data;
  const normalized = stored.map(normalizeReminder);
  if (stored.some((reminder) => reminder.enabled === undefined || reminder.deliveryState === undefined || reminder.version === undefined)) {
    saveAll(normalized);
  }
  return normalized;
}

export function createReminder(input: CreateReminderInput): Promise<Reminder> {
  return mutate("create", () => {
    const title = validateTitle(input.title, "create");
    const scheduledAt = validateSchedule(input.scheduledAt, "create");
    const reminders = loadAll();
    const sourceRef = sourceRefFor(input);
    const existing = sourceRef && reminders.find((reminder) =>
      !reminder.archivedAt && reminder.sourceRef?.type === sourceRef.type && reminder.sourceRef.id === sourceRef.id,
    );
    if (existing) return existing;
    const now = new Date().toISOString();
    const reminder: Reminder = {
      id: `reminder_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      title,
      scheduledAt,
      enabled: input.enabled ?? true,
      tone: input.tone ?? "gentle",
      deliveryState: "not-scheduled",
      deliveryUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
      sourceRef,
      sourceBrainDumpId: sourceRef?.type === "brain-dump" ? sourceRef.id : undefined,
      version: 1,
    };
    saveAll([reminder, ...reminders]);
    return reminder;
  });
}

export function updateReminder(id: string, input: UpdateReminderInput): Promise<Reminder> {
  return mutate("update", () => {
    const title = validateTitle(input.title, "update");
    const reminders = loadAll();
    const index = activeIndex(reminders, id);
    if (index < 0) throw new DurableMutationError("reminders", "update", "not-found", "That reminder no longer exists.");
    const current = reminders[index];
    const scheduledAt = validateSchedule(input.scheduledAt, "update", current.scheduledAt);
    const desiredChanged = current.scheduledAt !== scheduledAt || current.enabled !== input.enabled;
    const updated: Reminder = {
      ...current,
      title,
      scheduledAt,
      enabled: input.enabled,
      tone: input.tone,
      ...(desiredChanged ? deliveryAfterDesiredChange(current) : {}),
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    };
    reminders[index] = updated;
    saveAll(reminders);
    return updated;
  });
}

export function setReminderCompleted(id: string, completed: boolean): Promise<Reminder> {
  return mutate(completed ? "complete" : "uncomplete", () => {
    const reminders = loadAll();
    const index = activeIndex(reminders, id);
    if (index < 0) throw new DurableMutationError("reminders", completed ? "complete" : "uncomplete", "not-found", "That reminder no longer exists.");
    const current = reminders[index];
    if (Boolean(current.completedAt) === completed) return current;
    const now = new Date().toISOString();
    const updated: Reminder = {
      ...current,
      completedAt: completed ? now : undefined,
      ...deliveryAfterDesiredChange(current),
      updatedAt: now,
      version: current.version + 1,
    };
    reminders[index] = updated;
    saveAll(reminders);
    return updated;
  });
}

export function deleteReminder(id: string): Promise<void> {
  return mutate("delete", () => {
    const reminders = loadAll();
    const index = activeIndex(reminders, id);
    if (index < 0) return;
    const current = reminders[index];
    const now = new Date().toISOString();
    reminders[index] = {
      ...current,
      archivedAt: now,
      ...deliveryAfterDesiredChange(current),
      updatedAt: now,
      version: current.version + 1,
    };
    saveAll(reminders);
  });
}

export function recordReminderScheduled(id: string, osNotificationId: string): Promise<Reminder> {
  return mutate("update", () => {
    const identifier = osNotificationId.trim();
    if (!identifier) throw new DurableMutationError("reminders", "update", "invalid-input", "The OS notification identifier is required.");
    const reminders = loadAll();
    const index = activeIndex(reminders, id);
    if (index < 0) throw new DurableMutationError("reminders", "update", "not-found", "That reminder no longer exists.");
    const current = reminders[index];
    if (!current.enabled || current.completedAt || !current.scheduledAt) {
      throw new DurableMutationError("reminders", "update", "conflict", "Only an active scheduled reminder can record an OS notification.");
    }
    const now = new Date().toISOString();
    const updated = { ...current, deliveryState: "scheduled" as const, osNotificationId: identifier, deliveryError: undefined, deliveryUpdatedAt: now, updatedAt: now, version: current.version + 1 };
    reminders[index] = updated;
    saveAll(reminders);
    return updated;
  });
}

export function recordReminderScheduling(id: string): Promise<Reminder> {
  return mutate("update", () => {
    const reminders = loadAll();
    const index = activeIndex(reminders, id);
    if (index < 0) throw new DurableMutationError("reminders", "update", "not-found", "That reminder no longer exists.");
    const current = reminders[index];
    if (!current.enabled || current.completedAt || !current.scheduledAt || current.osNotificationId) {
      throw new DurableMutationError("reminders", "update", "conflict", "Only an active unscheduled reminder can begin OS scheduling.");
    }
    const now = new Date().toISOString();
    const updated = { ...current, deliveryState: "scheduling" as const, deliveryError: undefined, deliveryUpdatedAt: now, updatedAt: now, version: current.version + 1 };
    reminders[index] = updated;
    saveAll(reminders);
    return updated;
  });
}

export function recordReminderDeliveryFailure(id: string, message: string): Promise<Reminder> {
  return mutate("update", () => {
    const reminders = loadAll();
    const index = activeIndex(reminders, id);
    if (index < 0) throw new DurableMutationError("reminders", "update", "not-found", "That reminder no longer exists.");
    const current = reminders[index];
    const now = new Date().toISOString();
    const updated = { ...current, deliveryState: "failed" as const, deliveryError: message.trim() || "Notification scheduling failed.", deliveryUpdatedAt: now, updatedAt: now, version: current.version + 1 };
    reminders[index] = updated;
    saveAll(reminders);
    return updated;
  });
}

export function recordReminderCancelled(id: string): Promise<Reminder> {
  return mutate("update", () => {
    const reminders = loadAll();
    const index = reminders.findIndex((reminder) => reminder.id === id);
    if (index < 0) throw new DurableMutationError("reminders", "update", "not-found", "That reminder no longer exists.");
    const current = reminders[index];
    const now = new Date().toISOString();
    const updated = { ...current, deliveryState: "not-scheduled" as const, osNotificationId: undefined, deliveryError: undefined, deliveryUpdatedAt: now, updatedAt: now, version: current.version + 1 };
    reminders[index] = updated;
    saveAll(reminders);
    return updated;
  });
}
