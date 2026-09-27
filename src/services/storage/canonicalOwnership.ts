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
  cleaning: {
    store: "src/features/cleaning/store/useCleaningStore.ts",
    repository: "src/features/cleaning/services/cleaningLocalRepository.ts",
    namespace: StorageNamespaces.DEFAULT,
    key: StorageKeys.CLEANING,
    legacy: [],
  },
  meals: {
    store: "src/features/meals/store/useMealStore.ts",
    repository: "src/features/meals/services/mealLocalRepository.ts",
    namespace: StorageNamespaces.DEFAULT,
    key: StorageKeys.MEALS,
    legacy: [
      "src/store/useMealStore.ts (compatibility alias; formerly memory-only)",
      "src/services/mealRepository.ts (compatibility alias; formerly a stub)",
    ],
  },
  "budget-categories": {
    store: "src/features/budget/store/useBudgetCategoryStore.ts",
    repository: "src/features/budget/services/budgetCategoryRepository.ts",
    namespace: StorageNamespaces.DEFAULT,
    key: StorageKeys.BUDGET_CATEGORIES,
    legacy: ["src/store/useBudgetStore.ts and src/services/budgetRepository.ts (compatibility adapters)"],
  },
  "budget-transactions": {
    store: "src/features/budget/store/useBudgetTransactionStore.ts",
    repository: "src/features/budget/services/budgetTransactionRepository.ts",
    namespace: StorageNamespaces.DEFAULT,
    key: StorageKeys.BUDGET_TRANSACTIONS,
    legacy: ["src/services/budgetRepository.ts (compatibility adapter)"],
  },
  payments: {
    store: "src/features/payments/store/usePaymentStore.ts",
    repository: "src/features/payments/services/paymentRepository.ts",
    namespace: StorageNamespaces.DEFAULT,
    key: StorageKeys.PAYMENTS,
    legacy: [],
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
