/**
 * Onboarding Store
 * Phase 11.9 - Onboarding Foundation
 */

import { getString, setString } from "@/src/services/storage/mmkv";
import { migrateOnboardingStorage } from "@/src/services/storage/canonicalMigrations";
import { StorageKeys } from "@/src/services/storage/storageKeys";
import { create } from "zustand";
import {
  FocusArea,
  OnboardingPreferences,
  OnboardingStore,
  PlanningStyle,
  StruggleArea,
} from "../types/onboarding";

const defaultPreferences: OnboardingPreferences = {
  struggleAreas: [],
  planningStyle: null,
  focusAreas: [],
};

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  // State
  isHydrated: false,
  isComplete: false,
  preferences: defaultPreferences,
  completedAt: null,

  // Hydrate from storage
  hydrate: async () => {
    try {
      migrateOnboardingStorage();
      const stored = getString(StorageKeys.ONBOARDING);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({
          isComplete: parsed.isComplete ?? false,
          preferences: parsed.preferences ?? defaultPreferences,
          completedAt: parsed.completedAt ?? null,
        });
      }
    } catch (error) {
      console.error("Error hydrating onboarding state:", error);
    } finally {
      set({ isHydrated: true });
    }
  },

  // Set struggle areas
  setStruggleAreas: (values: StruggleArea[]) => {
    const newState = {
      ...get(),
      preferences: {
        ...get().preferences,
        struggleAreas: values,
      },
    };
    set(newState);
    // Persist to storage
    try {
      setString(
        StorageKeys.ONBOARDING,
        JSON.stringify({
          isComplete: newState.isComplete,
          preferences: newState.preferences,
          completedAt: newState.completedAt,
        })
      );
    } catch (error) {
      console.error("Error saving struggle areas:", error);
    }
  },

  // Set planning style
  setPlanningStyle: (value: PlanningStyle) => {
    const newState = {
      ...get(),
      preferences: {
        ...get().preferences,
        planningStyle: value,
      },
    };
    set(newState);
    try {
      setString(
        StorageKeys.ONBOARDING,
        JSON.stringify({
          isComplete: newState.isComplete,
          preferences: newState.preferences,
          completedAt: newState.completedAt,
        })
      );
    } catch (error) {
      console.error("Error saving planning style:", error);
    }
  },

  // Set focus areas
  setFocusAreas: (values: FocusArea[]) => {
    const newState = {
      ...get(),
      preferences: {
        ...get().preferences,
        focusAreas: values,
      },
    };
    set(newState);
    try {
      setString(
        StorageKeys.ONBOARDING,
        JSON.stringify({
          isComplete: newState.isComplete,
          preferences: newState.preferences,
          completedAt: newState.completedAt,
        })
      );
    } catch (error) {
      console.error("Error saving focus areas:", error);
    }
  },

  // Complete onboarding
  completeOnboarding: () => {
    const completedAt = new Date().toISOString();
    const newState = {
      ...get(),
      isComplete: true,
      completedAt,
    };
    set(newState);
    try {
      setString(
        StorageKeys.ONBOARDING,
        JSON.stringify({
          isComplete: true,
          preferences: newState.preferences,
          completedAt,
        })
      );
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  },

  // Reset onboarding
  resetOnboarding: () => {
    const newState = {
      isHydrated: true,
      isComplete: false,
      preferences: defaultPreferences,
      completedAt: null,
    };
    set(newState);
    try {
      setString(
        StorageKeys.ONBOARDING,
        JSON.stringify({
          isComplete: false,
          preferences: defaultPreferences,
          completedAt: null,
        })
      );
    } catch (error) {
      console.error("Error resetting onboarding:", error);
    }
  },
}));
