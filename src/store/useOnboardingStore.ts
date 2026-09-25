/**
 * @deprecated Compatibility export only.
 *
 * Onboarding is owned by the feature store. Legacy records are migrated into
 * that store's canonical `onboarding` key before hydration.
 */
export { useOnboardingStore } from "@/features/onboarding/store/useOnboardingStore";
export type {
  FocusArea,
  OnboardingPreferences,
  OnboardingState,
  PlanningStyle,
  StruggleArea,
} from "@/features/onboarding/types/onboarding";
