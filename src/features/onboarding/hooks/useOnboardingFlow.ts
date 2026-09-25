/**
 * @deprecated Compatibility hook for the retired single-screen onboarding UI.
 * It projects the canonical feature store and keeps only transient step UI
 * locally; it does not own or persist onboarding domain data.
 */
import { useState } from "react";
import type {
  FocusArea as LegacyFocusArea,
  PlanningPreference,
  StruggleArea as LegacyStruggleArea,
} from "@/types/onboarding";
import { useOnboardingStore } from "../store/useOnboardingStore";
import type {
  FocusArea,
  StruggleArea,
} from "../types/onboarding";

const toCanonicalStruggle: Record<LegacyStruggleArea, StruggleArea> = {
  rememberingTasks: "remembering_tasks",
  routines: "building_routines",
  mealPlanning: "meal_planning",
  overwhelm: "feeling_overwhelmed",
  budgeting: "budgeting",
  consistency: "staying_consistent",
};
const toLegacyStruggle = Object.fromEntries(
  Object.entries(toCanonicalStruggle).map(([legacy, canonical]) => [canonical, legacy]),
) as Record<StruggleArea, LegacyStruggleArea>;

export const useOnboardingFlow = () => {
  const store = useOnboardingStore();
  const [currentStep, setCurrentStep] = useState(store.isComplete ? 4 : 1);
  const struggleAreas = store.preferences.struggleAreas.map(
    (area) => toLegacyStruggle[area],
  );
  const planningPreference = store.preferences.planningStyle ?? "minimal";
  const focusAreas = store.preferences.focusAreas.filter(
    (area): area is Exclude<FocusArea, "budget"> => area !== "budget",
  ) as LegacyFocusArea[];

  return {
    currentStep,
    struggleAreas,
    planningPreference,
    focusAreas,
    personalization: null,
    isCompleted: store.isComplete,
    setStruggleAreas: (areas: LegacyStruggleArea[]) =>
      store.setStruggleAreas(areas.map((area) => toCanonicalStruggle[area])),
    setPlanningPreference: (preference: PlanningPreference) => {
      store.setPlanningStyle(preference);
      setCurrentStep((step) => Math.min(3, step + 1));
    },
    setFocusAreas: (areas: LegacyFocusArea[]) => {
      store.setFocusAreas(areas);
      store.completeOnboarding();
      setCurrentStep(4);
    },
    nextStep: () => setCurrentStep((step) => Math.min(4, step + 1)),
    previousStep: () => setCurrentStep((step) => Math.max(1, step - 1)),
    completeOnboarding: () => store.completeOnboarding(),
  };
};
