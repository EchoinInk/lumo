import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { migrateSettingsStorage } from "../services/storage/canonicalMigrations";
import { createPersistStorage } from "./createPersistStorage";

migrateSettingsStorage();

export interface AppSettings {
  theme: "light" | "dark" | "system";
  language: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  onboardingCompleted: boolean;
  reducedMotion: boolean;
  simplifiedMode: boolean;
}

type SettingsState = {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
};

type SettingsActions = {
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setError: (error: string | null) => void;
  setHasHydrated: (value: boolean) => void;
};

const defaultSettings: AppSettings = {
  theme: "system",
  language: "en",
  notificationsEnabled: true,
  soundEnabled: true,
  hapticFeedbackEnabled: true,
  onboardingCompleted: false,
  reducedMotion: false,
  simplifiedMode: false,
};

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      isLoading: false,
      error: null,
      hasHydrated: false,

      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      resetSettings: () => set({ settings: defaultSettings }),

      setOnboardingCompleted: (completed) =>
        set((state) => ({
          settings: { ...state.settings, onboardingCompleted: completed },
        })),

      setError: (error) => set({ error }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => createPersistStorage()),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
