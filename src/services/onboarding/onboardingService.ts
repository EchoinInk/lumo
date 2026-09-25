/** @deprecated Use the feature onboarding hook/store directly. */
import { onboardingCompleteHaptic, onboardingProgressHaptic } from "@/animations/haptics";
import { useOnboardingStore } from "@/features/onboarding/store/useOnboardingStore";
import type {
  FocusArea,
  PlanningStyle,
  StruggleArea,
} from "@/features/onboarding/types/onboarding";

export const setStruggleAreas = (areas: StruggleArea[]) => {
  useOnboardingStore.getState().setStruggleAreas(areas);
};

export const setPlanningPreference = (preference: PlanningStyle) => {
  useOnboardingStore.getState().setPlanningStyle(preference);
  onboardingProgressHaptic();
};

export const setFocusAreas = (areas: FocusArea[]) => {
  useOnboardingStore.getState().setFocusAreas(areas);
  onboardingProgressHaptic();
};

export const completeOnboarding = () => {
  useOnboardingStore.getState().completeOnboarding();
  onboardingCompleteHaptic();
};

export const resetOnboarding = () => {
  useOnboardingStore.getState().resetOnboarding();
};

export const isOnboardingCompleted = (): boolean =>
  useOnboardingStore.getState().isComplete;

export const getCurrentStep = (): number =>
  useOnboardingStore.getState().isComplete ? 4 : 1;

export const nextStep = (): never => {
  throw new Error("Legacy onboarding step state is retired; use the routed feature flow");
};

export const previousStep = (): never => {
  throw new Error("Legacy onboarding step state is retired; use the routed feature flow");
};
