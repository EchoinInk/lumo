import { LegacyStorageKeys, StorageKeys } from "./storageKeys";
import { StorageNamespaces } from "./storageAdapter";

export const CanonicalLocalDomains = {
  tasks: {
    store: "src/features/tasks/store/useTaskStore.ts",
    repository: "src/features/tasks/services/taskLocalRepository.ts",
    namespace: StorageNamespaces.DEFAULT,
    key: StorageKeys.TASKS,
    legacy: ["src/store/useTaskStore.ts (compatibility alias; formerly memory-only)"],
  },
  habits: {
    store: "src/features/habits/store/useHabitStore.ts",
    repository: "src/features/habits/services/habitLocalRepository.ts",
    namespace: StorageNamespaces.DEFAULT,
    key: StorageKeys.HABITS,
    legacy: [
      `${StorageNamespaces.ZUSTAND}:${LegacyStorageKeys.HABITS_ZUSTAND}`,
      `${StorageNamespaces.DEFAULT}:${LegacyStorageKeys.HABITS_PREFIXED_ZUSTAND}`,
    ],
  },
  settings: {
    store: "src/store/useSettingsStore.ts",
    repository: null,
    namespace: StorageNamespaces.ZUSTAND,
    key: LegacyStorageKeys.SETTINGS_ZUSTAND,
    legacy: [
      `${StorageNamespaces.DEFAULT}:${LegacyStorageKeys.SETTINGS_PREFIXED_ZUSTAND}`,
      `${StorageNamespaces.DEFAULT}:${LegacyStorageKeys.SETTINGS_DIRECT}`,
    ],
  },
  onboarding: {
    store: "src/features/onboarding/store/useOnboardingStore.ts",
    repository: null,
    namespace: StorageNamespaces.DEFAULT,
    key: StorageKeys.ONBOARDING,
    legacy: [
      `${StorageNamespaces.ZUSTAND}:${LegacyStorageKeys.ONBOARDING_ZUSTAND}`,
      `${StorageNamespaces.DEFAULT}:${LegacyStorageKeys.ONBOARDING_PREFIXED_ZUSTAND}`,
    ],
  },
} as const;

export type CanonicalLocalDomain = keyof typeof CanonicalLocalDomains;
