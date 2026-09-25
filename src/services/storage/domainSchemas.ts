import type { BrainDumpEntry } from "@/features/brain-dump/types/brainDump";
import type { Habit } from "@/features/habits/types/habit";
import type {
  FocusArea,
  OnboardingPreferences,
  PlanningStyle,
  StruggleArea,
} from "@/features/onboarding/types/onboarding";
import type {
  DailyPlanningSummary,
  PlanningEnergyLevel,
  PlanningParkingState,
  PlanningSourceRef,
  PlanningSourceType,
} from "@/features/planning/types/planning";
import type { Reminder, ReminderSettings } from "@/features/reminders/types/reminder";
import type { Task } from "@/features/tasks/types/task";
import type { AppSettings } from "@/store/useSettingsStore";
import { StorageNamespaces } from "./storageAdapter";
import { LegacyStorageKeys, StorageKeys } from "./storageKeys";
import type { VersionedStorageDefinition } from "./versionedStorage";
import { toLocalDateKey } from "@/src/utils/dateTime";

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));
const isString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;
const isOptionalString = (value: unknown): boolean =>
  value === undefined || typeof value === "string";
const isNullableString = (value: unknown): boolean =>
  value === undefined || value === null || typeof value === "string";
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");
const isOneOf = <T extends string>(value: unknown, allowed: readonly T[]): value is T =>
  typeof value === "string" && allowed.includes(value as T);
const isFiniteNonNegative = (value: unknown): boolean =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

function isRecurrence(value: unknown): boolean {
  if (value === undefined) return true;
  if (!isObject(value) || !isOneOf(value.type, ["none", "daily", "weekly", "monthly"])) return false;
  if (value.interval !== undefined && (!Number.isInteger(value.interval) || (value.interval as number) < 1)) return false;
  return value.weekdays === undefined ||
    (value.type === "weekly" && Array.isArray(value.weekdays) && value.weekdays.every((day) =>
      isOneOf(day, ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
    ));
}

export function isTask(value: unknown): value is Task {
  if (!isObject(value)) return false;
  return isString(value.id) && isString(value.title) &&
    typeof value.completed === "boolean" &&
    isOneOf(value.priority, ["low", "medium", "high"]) &&
    isOptionalString(value.description) &&
    (value.energyRequired === undefined || isOneOf(value.energyRequired, ["low", "medium", "high"])) &&
    isRecurrence(value.recurrence) && isOptionalString(value.dueDate) &&
    isOptionalString(value.dueTime) && isString(value.createdAt) &&
    isString(value.updatedAt) && isNullableString(value.deletedAt) &&
    (value.syncStatus === undefined || isOneOf(value.syncStatus, ["pending", "synced", "failed"])) &&
    (value.version === undefined || Number.isInteger(value.version)) &&
    isOptionalString(value.lastSyncedAt) &&
    (value.pendingSync === undefined || typeof value.pendingSync === "boolean");
}

export function isHabit(value: unknown): value is Habit {
  if (!isObject(value)) return false;
  return isString(value.id) && isString(value.title) &&
    isOneOf(value.frequency, ["daily", "weekly"]) &&
    isFiniteNonNegative(value.streakCount) && isStringArray(value.completedDates) &&
    isString(value.createdAt) && isString(value.updatedAt) &&
    isOptionalString(value.description) &&
    (value.targetDays === undefined || (isStringArray(value.targetDays) && value.targetDays.every((day) =>
      isOneOf(day, ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
    ))) &&
    (value.color === undefined || isOneOf(value.color, ["blue", "green", "yellow", "orange", "pink", "purple", "teal"])) &&
    isOptionalString(value.icon) && isNullableString(value.deletedAt) &&
    (value.syncStatus === undefined || isOneOf(value.syncStatus, ["pending", "synced", "failed"])) &&
    (value.version === undefined || Number.isInteger(value.version)) &&
    isOptionalString(value.lastSyncedAt) &&
    (value.pendingSync === undefined || typeof value.pendingSync === "boolean");
}

const struggleAreas: readonly StruggleArea[] = ["remembering_tasks", "building_routines", "meal_planning", "budgeting", "staying_consistent", "feeling_overwhelmed"];
const planningStyles: readonly PlanningStyle[] = ["minimal", "visual", "structured", "flexible"];
const focusAreas: readonly FocusArea[] = ["tasks", "habits", "meals", "wellness", "fitness", "budget"];

export interface OnboardingRecord {
  isComplete: boolean;
  preferences: OnboardingPreferences;
  completedAt: string | null;
}

export function isOnboardingRecord(value: unknown): value is OnboardingRecord {
  if (!isObject(value) || !isObject(value.preferences)) return false;
  const preferences = value.preferences;
  return typeof value.isComplete === "boolean" &&
    (value.completedAt === null || isString(value.completedAt)) &&
    Array.isArray(preferences.struggleAreas) && preferences.struggleAreas.every((item) => isOneOf(item, struggleAreas)) &&
    (preferences.planningStyle === null || isOneOf(preferences.planningStyle, planningStyles)) &&
    Array.isArray(preferences.focusAreas) && preferences.focusAreas.every((item) => isOneOf(item, focusAreas));
}

export const defaultAppSettings: AppSettings = {
  theme: "system",
  language: "en",
  notificationsEnabled: true,
  soundEnabled: true,
  hapticFeedbackEnabled: true,
  onboardingCompleted: false,
  reducedMotion: false,
  simplifiedMode: false,
};

export function isAppSettings(value: unknown): value is AppSettings {
  if (!isObject(value)) return false;
  return isOneOf(value.theme, ["light", "dark", "system"]) &&
    isString(value.language) &&
    ["notificationsEnabled", "soundEnabled", "hapticFeedbackEnabled", "onboardingCompleted", "reducedMotion", "simplifiedMode"]
      .every((key) => typeof value[key] === "boolean");
}

function migrateSettings(value: unknown): AppSettings {
  if (!isObject(value)) throw new Error("Settings must be an object.");
  const state = isObject(value.state) ? value.state : value;
  const settings = isObject(state.settings) ? state.settings : state;
  const candidate = { ...defaultAppSettings, ...settings };
  if (!isAppSettings(candidate)) throw new Error("Settings fields are invalid.");
  return candidate;
}

export function isBrainDumpEntry(value: unknown): value is BrainDumpEntry {
  if (!isObject(value)) return false;
  return isString(value.id) && isString(value.text) &&
    isOneOf(value.status, ["open", "converted", "archived"]) &&
    isString(value.createdAt) && isString(value.updatedAt) &&
    isOptionalString(value.convertedAt) && isOptionalString(value.linkedEntityId) &&
    (value.convertedTo === undefined || isOneOf(value.convertedTo, ["task", "reminder", "routine_idea", "archived_note"]));
}

export function isReminder(value: unknown): value is Reminder {
  if (!isObject(value)) return false;
  return isString(value.id) && isString(value.title) &&
    isOneOf(value.tone, ["gentle", "practical", "encouraging"]) &&
    isOptionalString(value.scheduledAt) && isOptionalString(value.completedAt) &&
    isOptionalString(value.archivedAt) && isString(value.createdAt) && isString(value.updatedAt);
}

export function isReminderSettings(value: unknown): value is ReminderSettings {
  if (!isObject(value)) return false;
  return typeof value.remindersEnabled === "boolean" &&
    typeof value.hapticsEnabled === "boolean" && isString(value.quietHoursStart) &&
    isString(value.quietHoursEnd) && isOneOf(value.tone, ["gentle", "practical", "encouraging"]);
}

const planningEnergy: readonly PlanningEnergyLevel[] = ["low", "medium", "steady"];
const planningSourceTypes: readonly PlanningSourceType[] = [
  "task",
  "reminder",
  "routine",
  "brainDump",
];

function isPlanningSourceRef(value: unknown): value is PlanningSourceRef {
  if (!isObject(value)) return false;
  return isOneOf(value.sourceType, planningSourceTypes) && isString(value.sourceId);
}

export function isDailyPlanningSummary(value: unknown): value is DailyPlanningSummary {
  if (!isObject(value)) return false;
  return isString(value.date) && isStringArray(value.selectedFocusIds) &&
    isStringArray(value.carryOverIds) && isStringArray(value.brainDumpQueueIds) &&
    isOptionalString(value.nextStepId) &&
    (value.nextStepRef === undefined || isPlanningSourceRef(value.nextStepRef)) &&
    (value.energyLevel === undefined || isOneOf(value.energyLevel, planningEnergy)) &&
    typeof value.morningCompleted === "boolean" && typeof value.eveningCompleted === "boolean" &&
    isStringArray(value.parkedIds) && isStringArray(value.eveningCarriedIds) &&
    isStringArray(value.eveningParkedIds) && typeof value.eveningBrainDumpVisited === "boolean";
}

export function isPlanningParkingState(value: unknown): value is PlanningParkingState {
  if (!isObject(value) || !Array.isArray(value.parkedItems)) return false;
  return value.parkedItems.every((item) =>
    isObject(item) &&
    isString(item.id) &&
    isPlanningSourceRef(item) &&
    isString(item.parkedAt) &&
    isOneOf(item.parkedFrom, ["morning", "evening"]) &&
    isOptionalString(item.originalDueDate),
  );
}

const arrayDefinition = <T>(
  domain: VersionedStorageDefinition<T[]>["domain"],
  key: string,
  validateItem: (value: unknown) => value is T,
): VersionedStorageDefinition<T[]> => ({
  domain,
  key,
  schemaVersion: 1,
  empty: () => [],
  validate: (value): value is T[] => Array.isArray(value) && value.every(validateItem),
});

export const taskStorageDefinition = arrayDefinition("tasks", StorageKeys.TASKS, isTask);
export const habitStorageDefinition = arrayDefinition("habits", StorageKeys.HABITS, isHabit);
export const brainDumpStorageDefinition = arrayDefinition("brain-dump", StorageKeys.BRAIN_DUMP_ENTRIES, isBrainDumpEntry);
export const reminderStorageDefinition = arrayDefinition("reminders", StorageKeys.REMINDERS, isReminder);

export const settingsStorageDefinition: VersionedStorageDefinition<AppSettings> = {
  domain: "settings",
  key: LegacyStorageKeys.SETTINGS_ZUSTAND,
  namespace: StorageNamespaces.ZUSTAND,
  schemaVersion: 1,
  empty: () => ({ ...defaultAppSettings }),
  validate: isAppSettings,
  migrateLegacy: migrateSettings,
};

export const onboardingStorageDefinition: VersionedStorageDefinition<OnboardingRecord> = {
  domain: "onboarding",
  key: StorageKeys.ONBOARDING,
  schemaVersion: 1,
  empty: () => ({ isComplete: false, preferences: { struggleAreas: [], planningStyle: null, focusAreas: [] }, completedAt: null }),
  validate: isOnboardingRecord,
};

export const reminderSettingsStorageDefinition: VersionedStorageDefinition<ReminderSettings> = {
  domain: "reminder-settings",
  key: StorageKeys.REMINDER_SETTINGS,
  schemaVersion: 1,
  empty: () => ({ remindersEnabled: true, quietHoursStart: "21:00", quietHoursEnd: "08:00", hapticsEnabled: true, tone: "gentle" }),
  validate: isReminderSettings,
};

export const planningStorageDefinition: VersionedStorageDefinition<DailyPlanningSummary> = {
  domain: "planning",
  key: StorageKeys.PLANNING_SUMMARY,
  schemaVersion: 1,
  empty: () => ({ date: toLocalDateKey(), selectedFocusIds: [], carryOverIds: [], brainDumpQueueIds: [], morningCompleted: false, eveningCompleted: false, parkedIds: [], eveningCarriedIds: [], eveningParkedIds: [], eveningBrainDumpVisited: false }),
  validate: isDailyPlanningSummary,
};

export const planningParkingStorageDefinition: VersionedStorageDefinition<PlanningParkingState> = {
  domain: "planning-parking",
  key: StorageKeys.PLANNING_PARKING,
  schemaVersion: 1,
  empty: () => ({ parkedItems: [] }),
  validate: isPlanningParkingState,
};

export const activeStorageDefinitions = {
  tasks: taskStorageDefinition,
  habits: habitStorageDefinition,
  settings: settingsStorageDefinition,
  onboarding: onboardingStorageDefinition,
  "brain-dump": brainDumpStorageDefinition,
  reminders: reminderStorageDefinition,
  "reminder-settings": reminderSettingsStorageDefinition,
  planning: planningStorageDefinition,
  "planning-parking": planningParkingStorageDefinition,
} as const;
