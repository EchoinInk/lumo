export const StorageKeys = {
  // Domain data
  TASKS: "tasks",
  HABITS: "habits",
  CLEANING: "cleaning",
  MEALS: "meals",
  RECIPES: "recipes",
  GROCERIES: "groceries",
  MEAL_PLANS: "meal_plans",
  BUDGET: "budget",
  BUDGET_CATEGORIES: "budget_categories",
  BRAIN_DUMP_ENTRIES: "brain_dump_entries",
  REMINDERS: "reminders",
  REMINDER_SETTINGS: "reminder_settings",
  PLANNING_SUMMARY: "daily_planning_summary",
  PLANNING_PARKING: "planning_parking",

  // User preferences
  USER_SETTINGS: "user_settings",
  ONBOARDING: "onboarding",

  // Compatibility metadata (records migration outcomes; never stores domain data)
  WP21_MIGRATION: "lumo:storage-migration:wp2.1:v1",

  // Sync system
  SYNC_QUEUE: "sync_queue_entries",
  SYNC_LAST_SYNC_AT: "sync_last_sync_at",

  // Auth (non-sensitive — tokens stored in SecureStore)
  AUTH_USER_CACHE: "auth_user_cache",
} as const;

export const LegacyStorageKeys = {
  HABITS_ZUSTAND: "habit-storage",
  HABITS_PREFIXED_ZUSTAND: "habits_habit-storage",
  SETTINGS_ZUSTAND: "settings-storage",
  SETTINGS_PREFIXED_ZUSTAND: "settings_settings-storage",
  SETTINGS_DIRECT: "user_settings",
  ONBOARDING_ZUSTAND: "onboarding-storage",
  ONBOARDING_PREFIXED_ZUSTAND: "onboarding_onboarding-storage",
} as const;
