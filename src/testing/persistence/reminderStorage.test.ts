import {
  loadReminderSettings,
  loadReminders,
  sanitizeReminderSettings,
  sanitizeReminders,
} from "@/features/reminders/services/reminderStorage";
import { deleteKey, setString } from "@/services/storage/mmkv";
import { StorageKeys } from "@/services/storage/storageKeys";
import { assertEqual, resetTestState } from "../testUtils";
import { PersistenceLoadError } from "@/services/storage/versionedStorage";

export async function testSanitizeReminderSettingsFallsBackToDefaults(): Promise<void> {
  const settings = sanitizeReminderSettings({
    remindersEnabled: "yes",
    tone: "loud",
    quietHoursStart: 21,
  });

  assertEqual(settings.remindersEnabled, true, "invalid boolean should fall back");
  assertEqual(settings.tone, "gentle", "invalid tone should fall back");
  assertEqual(settings.quietHoursStart, "21:00", "invalid quiet hours should fall back");
}

export async function testSanitizeRemindersFiltersInvalidRecords(): Promise<void> {
  const reminders = sanitizeReminders([
    {
      id: "ok",
      title: "Stretch",
      tone: "gentle",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    { id: "bad", title: "" },
  ]);

  assertEqual(reminders.length, 1, "invalid reminders should be filtered");
  assertEqual(reminders[0]?.title, "Stretch", "valid reminder should remain");
}

export async function testLoadReminderSettingsRejectsCorruptJson(): Promise<void> {
  resetTestState();
  setString(StorageKeys.REMINDER_SETTINGS, "{bad");

  try {
    loadReminderSettings();
    throw new Error("corrupt reminder settings should not load as defaults");
  } catch (error) {
    assertEqual(
      error instanceof PersistenceLoadError && error.kind,
      "malformed-data",
      "corrupt reminder settings should be recoverable",
    );
  }
}

export async function testLoadRemindersRejectsCorruptJson(): Promise<void> {
  resetTestState();
  deleteKey(StorageKeys.REMINDERS);
  setString(StorageKeys.REMINDERS, "[]]");

  try {
    loadReminders();
    throw new Error("corrupt reminders should not load as empty");
  } catch (error) {
    assertEqual(
      error instanceof PersistenceLoadError && error.kind,
      "malformed-data",
      "corrupt reminders should be recoverable",
    );
  }
}
