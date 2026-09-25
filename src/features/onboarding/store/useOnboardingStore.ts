/**
 * Onboarding Store
 * Phase 11.9 - Onboarding Foundation
 */

import { migrateOnboardingStorage } from "@/src/services/storage/canonicalMigrations";
import {
  onboardingStorageDefinition,
  type OnboardingRecord,
} from "@/src/services/storage/domainSchemas";
import { loadVersionedData, saveVersionedData } from "@/src/services/storage/versionedStorage";
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
  hydrationError: null,
  isComplete: false,
  preferences: defaultPreferences,
  completedAt: null,

  // Hydrate from storage
  hydrate: async () => {
    try {
      migrateOnboardingStorage();
      const stored = loadVersionedData(onboardingStorageDefinition).data;
      set({ ...stored, hydrationError: null });
    } catch (error) {
      console.error("Error hydrating onboarding state:", error);
      set({ hydrationError: "Onboarding data needs recovery." });
      throw error;
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
      saveVersionedData(onboardingStorageDefinition, toRecord(newState));
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
      saveVersionedData(onboardingStorageDefinition, toRecord(newState));
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
      saveVersionedData(onboardingStorageDefinition, toRecord(newState));
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
      saveVersionedData(onboardingStorageDefinition, toRecord(newState));
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  },

  // Reset onboarding
  resetOnboarding: () => {
    const newState = {
      isHydrated: true,
      hydrationError: null,
      isComplete: false,
      preferences: defaultPreferences,
      completedAt: null,
    };
    set(newState);
    try {
      saveVersionedData(onboardingStorageDefinition, toRecord(newState));
    } catch (error) {
      console.error("Error resetting onboarding:", error);
    }
  },
}));

function toRecord(state: Pick<OnboardingRecord, "isComplete" | "preferences" | "completedAt">): OnboardingRecord {
  return {
    isComplete: state.isComplete,
    preferences: state.preferences,
    completedAt: state.completedAt,
  };
}
