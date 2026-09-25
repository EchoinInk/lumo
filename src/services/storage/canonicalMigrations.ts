import type { Habit, HabitColor } from "@/features/habits/types/habit";
import type {
  FocusArea,
  OnboardingPreferences,
  PlanningStyle,
  StruggleArea,
} from "@/features/onboarding/types/onboarding";
import { LegacyStorageKeys, StorageKeys } from "./storageKeys";
import {
  getStorageAdapter,
  StorageNamespaces,
  type StringStorageAdapter,
} from "./storageAdapter";

export type MigrationStatus =
  | "canonical-preserved"
  | "conflict-preserved"
  | "migrated"
  | "no-legacy-data"
  | "incompatible-legacy-preserved";

export interface DomainMigrationResult {
  domain: "tasks" | "habits" | "settings" | "onboarding";
  status: MigrationStatus;
  canonicalNamespace: string;
  canonicalKey: string;
  selectedLegacyKey?: string;
  preservedLegacyKeys: string[];
}

export interface WP21MigrationReport {
  version: 1;
  results: Partial<Record<DomainMigrationResult["domain"], DomainMigrationResult>>;
}

interface LegacyCandidate<T> {
  namespace: typeof StorageNamespaces.DEFAULT | typeof StorageNamespaces.ZUSTAND;
  key: string;
  convert: (raw: string) => T | undefined;
}

const defaultStorage = getStorageAdapter(StorageNamespaces.DEFAULT);
const zustandStorage = getStorageAdapter(StorageNamespaces.ZUSTAND);

function storageFor(namespace: LegacyCandidate<unknown>["namespace"]): StringStorageAdapter {
  return namespace === StorageNamespaces.DEFAULT ? defaultStorage : zustandStorage;
}

function candidateLabel(candidate: Pick<LegacyCandidate<unknown>, "namespace" | "key">): string {
  return `${candidate.namespace}:${candidate.key}`;
}

function decodeJson(raw: string): unknown {
  let value: unknown = JSON.parse(raw);
  if (typeof value === "string") {
    value = JSON.parse(value);
  }
  return value;
}

function getZustandState(raw: string): Record<string, unknown> | undefined {
  try {
    const decoded = decodeJson(raw);
    if (!decoded || typeof decoded !== "object") return undefined;
    const envelope = decoded as Record<string, unknown>;
    const state = envelope.state;
    return state && typeof state === "object"
      ? (state as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

function readReport(): WP21MigrationReport {
  const raw = defaultStorage.getString(StorageKeys.WP21_MIGRATION);
  if (!raw) return { version: 1, results: {} };
  try {
    const parsed = JSON.parse(raw) as WP21MigrationReport;
    return parsed.version === 1 && parsed.results
      ? parsed
      : { version: 1, results: {} };
  } catch {
    return { version: 1, results: {} };
  }
}

function recordResult(result: DomainMigrationResult): DomainMigrationResult {
  const report = readReport();
  report.results[result.domain] = result;
  defaultStorage.set(StorageKeys.WP21_MIGRATION, JSON.stringify(report));
  return result;
}

function migrateFirstCompatible<T>({
  domain,
  canonicalNamespace,
  canonicalKey,
  serialize,
  candidates,
}: {
  domain: DomainMigrationResult["domain"];
  canonicalNamespace: LegacyCandidate<unknown>["namespace"];
  canonicalKey: string;
  serialize: (value: T) => string;
  candidates: LegacyCandidate<T>[];
}): DomainMigrationResult {
  const canonicalStorage = storageFor(canonicalNamespace);
  const presentCandidates = candidates.filter((candidate) =>
    storageFor(candidate.namespace).contains(candidate.key),
  );
  const preservedLegacyKeys = presentCandidates.map(candidateLabel);

  if (canonicalStorage.contains(canonicalKey)) {
    return recordResult({
      domain,
      status:
        presentCandidates.length > 0
          ? "conflict-preserved"
          : "canonical-preserved",
      canonicalNamespace,
      canonicalKey,
      preservedLegacyKeys,
    });
  }

  for (const candidate of presentCandidates) {
    const raw = storageFor(candidate.namespace).getString(candidate.key);
    if (raw === undefined) continue;
    const converted = candidate.convert(raw);
    if (converted === undefined) continue;

    canonicalStorage.set(canonicalKey, serialize(converted));
    return recordResult({
      domain,
      status: "migrated",
      canonicalNamespace,
      canonicalKey,
      selectedLegacyKey: candidateLabel(candidate),
      preservedLegacyKeys,
    });
  }

  return recordResult({
    domain,
    status:
      presentCandidates.length > 0
        ? "incompatible-legacy-preserved"
        : "no-legacy-data",
    canonicalNamespace,
    canonicalKey,
    preservedLegacyKeys,
  });
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const habitColors = new Set<HabitColor>([
  "blue",
  "green",
  "yellow",
  "orange",
  "pink",
  "purple",
  "teal",
]);

function convertLegacyHabit(value: unknown): Habit | undefined {
  if (!value || typeof value !== "object") return undefined;
  const habit = value as Record<string, unknown>;
  if (
    typeof habit.id !== "string" ||
    typeof habit.title !== "string" ||
    (habit.frequency !== "daily" && habit.frequency !== "weekly") ||
    !Array.isArray(habit.completedDates) ||
    !habit.completedDates.every((date) => typeof date === "string") ||
    typeof habit.createdAt !== "string" ||
    typeof habit.updatedAt !== "string"
  ) {
    return undefined;
  }

  let targetDays: string[] | undefined;
  if (habit.frequency === "weekly") {
    if (!Array.isArray(habit.targetDays)) return undefined;
    targetDays = [];
    for (const day of habit.targetDays) {
      if (typeof day === "string" && dayNames.includes(day as (typeof dayNames)[number])) {
        targetDays.push(day);
        continue;
      }
      if (typeof day === "number" && Number.isInteger(day) && day >= 0 && day <= 6) {
        targetDays.push(dayNames[day]);
        continue;
      }
      return undefined;
    }
  }

  if (habit.color !== undefined && !habitColors.has(habit.color as HabitColor)) {
    return undefined;
  }

  return {
    id: habit.id,
    title: habit.title,
    ...(typeof habit.description === "string"
      ? { description: habit.description }
      : {}),
    frequency: habit.frequency,
    ...(targetDays ? { targetDays } : {}),
    streakCount:
      typeof habit.streakCount === "number" ? habit.streakCount : 0,
    completedDates: [...habit.completedDates] as string[],
    ...(habit.color ? { color: habit.color as HabitColor } : {}),
    ...(typeof habit.icon === "string" ? { icon: habit.icon } : {}),
    createdAt: habit.createdAt,
    updatedAt: habit.updatedAt,
    ...(habit.deletedAt === null || typeof habit.deletedAt === "string"
      ? { deletedAt: habit.deletedAt }
      : {}),
    ...(habit.syncStatus === "pending" ||
    habit.syncStatus === "synced" ||
    habit.syncStatus === "failed"
      ? { syncStatus: habit.syncStatus }
      : {}),
    ...(typeof habit.version === "number" ? { version: habit.version } : {}),
    ...(typeof habit.lastSyncedAt === "string"
      ? { lastSyncedAt: habit.lastSyncedAt }
      : {}),
    ...(typeof habit.pendingSync === "boolean"
      ? { pendingSync: habit.pendingSync }
      : {}),
  };
}

function convertLegacyHabits(raw: string): Habit[] | undefined {
  const state = getZustandState(raw);
  if (!state || !Array.isArray(state.habits)) return undefined;
  const converted = state.habits.map(convertLegacyHabit);
  return converted.every((habit): habit is Habit => habit !== undefined)
    ? converted
    : undefined;
}

const struggleAreaMap: Record<string, StruggleArea> = {
  rememberingTasks: "remembering_tasks",
  routines: "building_routines",
  mealPlanning: "meal_planning",
  budgeting: "budgeting",
  consistency: "staying_consistent",
  overwhelm: "feeling_overwhelmed",
};
const planningStyles = new Set<PlanningStyle>([
  "minimal",
  "visual",
  "structured",
  "flexible",
]);
const focusAreas = new Set<FocusArea>([
  "tasks",
  "habits",
  "meals",
  "wellness",
  "fitness",
  "budget",
]);

interface CanonicalOnboardingRecord {
  isComplete: boolean;
  preferences: OnboardingPreferences;
  completedAt: string | null;
}

function convertLegacyOnboarding(raw: string): CanonicalOnboardingRecord | undefined {
  const state = getZustandState(raw);
  const data = state?.data;
  if (!data || typeof data !== "object") return undefined;
  const record = data as Record<string, unknown>;
  if (
    !Array.isArray(record.struggleAreas) ||
    !Array.isArray(record.focusAreas) ||
    typeof record.planningPreference !== "string"
  ) {
    return undefined;
  }

  const mappedStruggles = record.struggleAreas.map((area) =>
    typeof area === "string" ? struggleAreaMap[area] : undefined,
  );
  if (mappedStruggles.some((area) => area === undefined)) return undefined;
  if (!planningStyles.has(record.planningPreference as PlanningStyle)) return undefined;
  if (
    !record.focusAreas.every(
      (area) => typeof area === "string" && focusAreas.has(area as FocusArea),
    )
  ) {
    return undefined;
  }
  if (record.completedAt !== null && typeof record.completedAt !== "string") {
    return undefined;
  }

  return {
    isComplete: typeof record.completedAt === "string",
    preferences: {
      struggleAreas: mappedStruggles as StruggleArea[],
      planningStyle: record.planningPreference as PlanningStyle,
      focusAreas: [...record.focusAreas] as FocusArea[],
    },
    completedAt: record.completedAt as string | null,
  };
}

interface CanonicalSettingsRecord {
  state: {
    settings: {
      theme: "light" | "dark" | "system";
      language: string;
      notificationsEnabled: boolean;
      soundEnabled: boolean;
      hapticFeedbackEnabled: boolean;
      onboardingCompleted: boolean;
      reducedMotion: boolean;
      simplifiedMode: boolean;
    };
  };
  version: number;
}

function convertSettingsObject(value: unknown): CanonicalSettingsRecord | undefined {
  if (!value || typeof value !== "object") return undefined;
  const decoded = value as Record<string, unknown>;
  const state =
    decoded.state && typeof decoded.state === "object"
      ? (decoded.state as Record<string, unknown>)
      : decoded;
  const candidate =
    state.settings && typeof state.settings === "object"
      ? (state.settings as Record<string, unknown>)
      : state;

  if (
    candidate.theme !== "light" &&
    candidate.theme !== "dark" &&
    candidate.theme !== "system"
  ) {
    return undefined;
  }
  const booleanKeys = [
    "notificationsEnabled",
    "soundEnabled",
    "hapticFeedbackEnabled",
    "onboardingCompleted",
  ] as const;
  if (
    typeof candidate.language !== "string" ||
    booleanKeys.some((key) => typeof candidate[key] !== "boolean") ||
    (candidate.reducedMotion !== undefined &&
      typeof candidate.reducedMotion !== "boolean") ||
    (candidate.simplifiedMode !== undefined &&
      typeof candidate.simplifiedMode !== "boolean")
  ) {
    return undefined;
  }

  return {
    state: {
      settings: {
        theme: candidate.theme,
        language: candidate.language,
        notificationsEnabled: candidate.notificationsEnabled as boolean,
        soundEnabled: candidate.soundEnabled as boolean,
        hapticFeedbackEnabled: candidate.hapticFeedbackEnabled as boolean,
        onboardingCompleted: candidate.onboardingCompleted as boolean,
        reducedMotion: (candidate.reducedMotion as boolean | undefined) ?? false,
        simplifiedMode: (candidate.simplifiedMode as boolean | undefined) ?? false,
      },
    },
    version: typeof decoded.version === "number" ? decoded.version : 0,
  };
}

function convertLegacySettings(raw: string): CanonicalSettingsRecord | undefined {
  try {
    return convertSettingsObject(decodeJson(raw));
  } catch {
    return undefined;
  }
}

export function migrateHabitStorage(): DomainMigrationResult {
  return migrateFirstCompatible({
    domain: "habits",
    canonicalNamespace: StorageNamespaces.DEFAULT,
    canonicalKey: StorageKeys.HABITS,
    serialize: JSON.stringify,
    candidates: [
      {
        namespace: StorageNamespaces.ZUSTAND,
        key: LegacyStorageKeys.HABITS_ZUSTAND,
        convert: convertLegacyHabits,
      },
      {
        namespace: StorageNamespaces.DEFAULT,
        key: LegacyStorageKeys.HABITS_PREFIXED_ZUSTAND,
        convert: convertLegacyHabits,
      },
    ],
  });
}

export function migrateOnboardingStorage(): DomainMigrationResult {
  return migrateFirstCompatible({
    domain: "onboarding",
    canonicalNamespace: StorageNamespaces.DEFAULT,
    canonicalKey: StorageKeys.ONBOARDING,
    serialize: JSON.stringify,
    candidates: [
      {
        namespace: StorageNamespaces.ZUSTAND,
        key: LegacyStorageKeys.ONBOARDING_ZUSTAND,
        convert: convertLegacyOnboarding,
      },
      {
        namespace: StorageNamespaces.DEFAULT,
        key: LegacyStorageKeys.ONBOARDING_PREFIXED_ZUSTAND,
        convert: convertLegacyOnboarding,
      },
    ],
  });
}

export function migrateSettingsStorage(): DomainMigrationResult {
  return migrateFirstCompatible({
    domain: "settings",
    canonicalNamespace: StorageNamespaces.ZUSTAND,
    canonicalKey: LegacyStorageKeys.SETTINGS_ZUSTAND,
    serialize: JSON.stringify,
    candidates: [
      {
        namespace: StorageNamespaces.DEFAULT,
        key: LegacyStorageKeys.SETTINGS_PREFIXED_ZUSTAND,
        convert: convertLegacySettings,
      },
      {
        namespace: StorageNamespaces.DEFAULT,
        key: LegacyStorageKeys.SETTINGS_DIRECT,
        convert: convertLegacySettings,
      },
    ],
  });
}

export function recordTaskOwnership(): DomainMigrationResult {
  const hasCanonical = defaultStorage.contains(StorageKeys.TASKS);
  return recordResult({
    domain: "tasks",
    status: hasCanonical ? "canonical-preserved" : "no-legacy-data",
    canonicalNamespace: StorageNamespaces.DEFAULT,
    canonicalKey: StorageKeys.TASKS,
    preservedLegacyKeys: [],
  });
}

export function runCanonicalStorageMigrations(): WP21MigrationReport {
  recordTaskOwnership();
  migrateHabitStorage();
  migrateSettingsStorage();
  migrateOnboardingStorage();
  return readReport();
}

export function getWP21MigrationReport(): WP21MigrationReport {
  return readReport();
}
