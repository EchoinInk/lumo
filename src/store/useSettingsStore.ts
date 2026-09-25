import { create } from "zustand";
import { migrateSettingsStorage } from "../services/storage/canonicalMigrations";
import {
  defaultAppSettings,
  settingsStorageDefinition,
} from "../services/storage/domainSchemas";
import { loadVersionedData, saveVersionedData } from "../services/storage/versionedStorage";

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
  hydrateSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setError: (error: string | null) => void;
  setHasHydrated: (value: boolean) => void;
};

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()((set, get) => ({
      settings: defaultAppSettings,
      isLoading: false,
      error: null,
      hasHydrated: false,

      hydrateSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          migrateSettingsStorage();
          const settings = loadVersionedData(settingsStorageDefinition).data;
          set({ settings, hasHydrated: true, isLoading: false });
        } catch (error) {
          set({
            hasHydrated: true,
            isLoading: false,
            error: "Settings need recovery before they can be used.",
          });
          throw error;
        }
      },

      updateSettings: (updates) => {
        const settings = { ...get().settings, ...updates };
        saveVersionedData(settingsStorageDefinition, settings);
        set({ settings });
      },

      resetSettings: () => {
        saveVersionedData(settingsStorageDefinition, defaultAppSettings);
        set({ settings: defaultAppSettings });
      },

      setOnboardingCompleted: (completed) => {
        const settings = { ...get().settings, onboardingCompleted: completed };
        saveVersionedData(settingsStorageDefinition, settings);
        set({ settings });
      },

      setError: (error) => set({ error }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
}));
