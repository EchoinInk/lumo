import {
  migrateHabitStorage,
  migrateOnboardingStorage,
  migrateSettingsStorage,
} from "@/services/storage/canonicalMigrations";
import { getString, setString } from "@/services/storage/mmkv";
import {
  createStorageAdapter,
  getStorageAdapter,
  StorageNamespaces,
} from "@/services/storage/storageAdapter";
import { LegacyStorageKeys, StorageKeys } from "@/services/storage/storageKeys";
import { assertDeepEqual, assertEqual, resetTestState } from "../testUtils";

const defaultStorage = getStorageAdapter(StorageNamespaces.DEFAULT);
const zustandStorage = getStorageAdapter(StorageNamespaces.ZUSTAND);

function resetStorage(): void {
  resetTestState();
  defaultStorage.clearAll();
  zustandStorage.clearAll();
}

function legacyHabit(overrides: Record<string, unknown> = {}) {
  return {
    id: "legacy-habit",
    title: "Legacy habit",
    frequency: "weekly",
    targetDays: [1, 3, 5],
    completedDates: ["2026-09-22"],
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-22T00:00:00.000Z",
    version: 3,
    ...overrides,
  };
}

function zustandEnvelope(state: Record<string, unknown>): string {
  return JSON.stringify({ state, version: 0 });
}

export function testExistingDefaultKeysRemainCompatible(): void {
  resetStorage();
  setString(StorageKeys.TASKS, "existing-tasks");

  assertEqual(
    defaultStorage.getString(StorageKeys.TASKS),
    "existing-tasks",
    "the reconciled default adapter should retain existing raw keys",
  );
  assertEqual(
    getString(StorageKeys.TASKS),
    "existing-tasks",
    "the service facade should read the same default namespace",
  );
}

export function testStorageNamespacesAreIsolated(): void {
  resetStorage();
  defaultStorage.set("shared-key", "default-value");
  zustandStorage.set("shared-key", "zustand-value");

  assertEqual(defaultStorage.getString("shared-key"), "default-value", "default namespace");
  assertEqual(zustandStorage.getString("shared-key"), "zustand-value", "named namespace");

  defaultStorage.clearAll();
  assertEqual(
    zustandStorage.getString("shared-key"),
    "zustand-value",
    "clearing one namespace must not clear another",
  );
}

export function testWebAdapterPersistsAcrossAdapterRecreation(): void {
  resetStorage();
  const firstLoad = createStorageAdapter(StorageNamespaces.ZUSTAND);
  firstLoad.set("reload-key", "durable-value");

  const reloadedAdapter = createStorageAdapter(StorageNamespaces.ZUSTAND);
  assertEqual(
    reloadedAdapter.getString("reload-key"),
    "durable-value",
    "browser localStorage should survive adapter recreation",
  );
}

export function testHabitMigrationIsRepeatableAndPreservesLegacySource(): void {
  resetStorage();
  zustandStorage.set(
    LegacyStorageKeys.HABITS_ZUSTAND,
    zustandEnvelope({ habits: [legacyHabit()] }),
  );

  const first = migrateHabitStorage();
  const migratedRaw = defaultStorage.getString(StorageKeys.HABITS);
  const second = migrateHabitStorage();

  assertEqual(first.status, "migrated", "first run should migrate a compatible source");
  assertEqual(
    second.status,
    "conflict-preserved",
    "repeat run should preserve the now-canonical target and legacy source",
  );
  assertEqual(
    defaultStorage.getString(StorageKeys.HABITS),
    migratedRaw,
    "repeat migration must not rewrite canonical records",
  );
  assertEqual(
    zustandStorage.contains(LegacyStorageKeys.HABITS_ZUSTAND),
    true,
    "legacy records must remain recoverable",
  );
  const migrated = JSON.parse(migratedRaw ?? "[]");
  assertDeepEqual(
    migrated[0]?.targetDays,
    ["Mon", "Wed", "Fri"],
    "compatible numeric weekdays should map explicitly",
  );
}

export function testCanonicalHabitWinsConflictingLegacyFixture(): void {
  resetStorage();
  const canonical = [
    {
      ...legacyHabit({ id: "canonical", title: "Canonical habit" }),
      targetDays: ["Tue"],
      streakCount: 1,
    },
  ];
  defaultStorage.set(StorageKeys.HABITS, JSON.stringify(canonical));
  zustandStorage.set(
    LegacyStorageKeys.HABITS_ZUSTAND,
    zustandEnvelope({ habits: [legacyHabit({ title: "Conflicting habit" })] }),
  );

  const result = migrateHabitStorage();

  assertEqual(result.status, "conflict-preserved", "canonical records should win conflicts");
  assertDeepEqual(
    JSON.parse(defaultStorage.getString(StorageKeys.HABITS) ?? "[]"),
    canonical,
    "conflicting legacy records must not be merged into canonical data",
  );
  assertEqual(
    zustandStorage.contains(LegacyStorageKeys.HABITS_ZUSTAND),
    true,
    "conflicting legacy fixture should remain untouched",
  );
}

export function testIncompatibleHabitFixtureIsNotPartiallyMigrated(): void {
  resetStorage();
  zustandStorage.set(
    LegacyStorageKeys.HABITS_ZUSTAND,
    zustandEnvelope({ habits: [legacyHabit(), legacyHabit({ id: "monthly", frequency: "monthly" })] }),
  );

  const result = migrateHabitStorage();

  assertEqual(
    result.status,
    "incompatible-legacy-preserved",
    "an incompatible collection should remain intact for later recovery",
  );
  assertEqual(
    defaultStorage.contains(StorageKeys.HABITS),
    false,
    "migration must not cherry-pick only compatible records",
  );
}

export function testHistoricalSettingsKeyMigratesToNamedNamespace(): void {
  resetStorage();
  const legacyEnvelope = {
    state: {
      settings: {
        theme: "light",
        language: "en-NZ",
        notificationsEnabled: false,
        soundEnabled: false,
        hapticFeedbackEnabled: false,
        onboardingCompleted: true,
      },
    },
    version: 0,
  };
  defaultStorage.set(
    LegacyStorageKeys.SETTINGS_PREFIXED_ZUSTAND,
    JSON.stringify(JSON.stringify(legacyEnvelope)),
  );

  const result = migrateSettingsStorage();
  const migrated = JSON.parse(
    zustandStorage.getString(LegacyStorageKeys.SETTINGS_ZUSTAND) ?? "{}",
  );

  assertEqual(result.status, "migrated", "historical settings should migrate");
  assertEqual(migrated.state.settings.language, "en-NZ", "language should survive");
  assertEqual(migrated.state.settings.hapticFeedbackEnabled, false, "haptics should survive");
  assertEqual(migrated.state.settings.reducedMotion, false, "new preferences should default safely");
  assertEqual(
    defaultStorage.contains(LegacyStorageKeys.SETTINGS_PREFIXED_ZUSTAND),
    true,
    "historical settings source must remain available",
  );
}

export function testLegacyOnboardingMapsIntoCanonicalShape(): void {
  resetStorage();
  zustandStorage.set(
    LegacyStorageKeys.ONBOARDING_ZUSTAND,
    zustandEnvelope({
      data: {
        struggleAreas: ["rememberingTasks", "overwhelm"],
        planningPreference: "visual",
        focusAreas: ["tasks", "habits"],
        completedAt: "2026-08-01T00:00:00.000Z",
        currentStep: 4,
      },
    }),
  );

  const result = migrateOnboardingStorage();
  const migrated = JSON.parse(
    defaultStorage.getString(StorageKeys.ONBOARDING) ?? "{}",
  );

  assertEqual(result.status, "migrated", "legacy onboarding should migrate");
  assertEqual(migrated.isComplete, true, "completion should survive");
  assertDeepEqual(
    migrated.preferences.struggleAreas,
    ["remembering_tasks", "feeling_overwhelmed"],
    "legacy struggle identifiers should map explicitly",
  );
  assertEqual(
    zustandStorage.contains(LegacyStorageKeys.ONBOARDING_ZUSTAND),
    true,
    "legacy onboarding source must remain available",
  );
}
