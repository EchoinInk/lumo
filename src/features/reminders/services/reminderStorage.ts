import {
  reminderSettingsStorageDefinition,
  reminderStorageDefinition,
} from "@/src/services/storage/domainSchemas";
import { loadVersionedData, saveVersionedData } from "@/src/services/storage/versionedStorage";
import type {
  Reminder,
  ReminderSettings,
  ReminderTone,
} from "../types/reminder";

const VALID_TONES = new Set<ReminderTone>([
  "gentle",
  "practical",
  "encouraging",
]);

export const defaultReminderSettings: ReminderSettings = {
  remindersEnabled: true,
  quietHoursStart: "21:00",
  quietHoursEnd: "08:00",
  hapticsEnabled: true,
  tone: "gentle",
};

function isIsoString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function sanitizeReminderSettings(raw: unknown): ReminderSettings {
  if (!raw || typeof raw !== "object") {
    return defaultReminderSettings;
  }

  const settings = raw as Partial<ReminderSettings>;

  return {
    remindersEnabled:
      typeof settings.remindersEnabled === "boolean"
        ? settings.remindersEnabled
        : defaultReminderSettings.remindersEnabled,
    quietHoursStart:
      typeof settings.quietHoursStart === "string"
        ? settings.quietHoursStart
        : defaultReminderSettings.quietHoursStart,
    quietHoursEnd:
      typeof settings.quietHoursEnd === "string"
        ? settings.quietHoursEnd
        : defaultReminderSettings.quietHoursEnd,
    hapticsEnabled:
      typeof settings.hapticsEnabled === "boolean"
        ? settings.hapticsEnabled
        : defaultReminderSettings.hapticsEnabled,
    tone:
      settings.tone && VALID_TONES.has(settings.tone)
        ? settings.tone
        : defaultReminderSettings.tone,
  };
}

export function sanitizeReminder(raw: unknown): Reminder | null {
  if (!raw || typeof raw !== "object") return null;

  const reminder = raw as Partial<Reminder>;
  const title = typeof reminder.title === "string" ? reminder.title.trim() : "";
  if (!title || !isIsoString(reminder.id)) return null;

  const now = new Date().toISOString();

  return {
    id: reminder.id,
    title,
    scheduledAt: isIsoString(reminder.scheduledAt)
      ? reminder.scheduledAt
      : undefined,
    tone:
      reminder.tone && VALID_TONES.has(reminder.tone)
        ? reminder.tone
        : defaultReminderSettings.tone,
    completedAt: isIsoString(reminder.completedAt)
      ? reminder.completedAt
      : undefined,
    archivedAt: isIsoString(reminder.archivedAt)
      ? reminder.archivedAt
      : undefined,
    createdAt: isIsoString(reminder.createdAt) ? reminder.createdAt : now,
    updatedAt: isIsoString(reminder.updatedAt) ? reminder.updatedAt : now,
    sourceBrainDumpId: isIsoString(reminder.sourceBrainDumpId)
      ? reminder.sourceBrainDumpId
      : undefined,
  };
}

export function sanitizeReminders(raw: unknown): Reminder[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((reminder) => sanitizeReminder(reminder))
    .filter((reminder): reminder is Reminder => reminder !== null);
}

export function loadReminders(): Reminder[] {
  return loadVersionedData(reminderStorageDefinition).data;
}

export function loadReminderSettings(): ReminderSettings {
  return loadVersionedData(reminderSettingsStorageDefinition).data;
}

export function persistReminders(reminders: Reminder[]): void {
  saveVersionedData(reminderStorageDefinition, reminders);
}

export function persistReminderSettings(settings: ReminderSettings): void {
  saveVersionedData(reminderSettingsStorageDefinition, settings);
}
