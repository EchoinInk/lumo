/** @deprecated Dashboard personalization is derived from canonical onboarding preferences. */
import { useOnboardingStore } from "@/features/onboarding/store/useOnboardingStore";
import type { DashboardPersonalization } from "@/types/onboarding";

export const getPersonalizedDashboardConfig = (): DashboardPersonalization => {
  const { focusAreas, planningStyle } =
    useOnboardingStore.getState().preferences;
  return {
    showHabits: focusAreas.includes("habits"),
    showTasks: focusAreas.includes("tasks"),
    showMeals: focusAreas.includes("meals"),
    showWellness: focusAreas.includes("wellness"),
    showFitness: focusAreas.includes("fitness"),
    dashboardDensity:
      planningStyle === "minimal"
        ? "minimal"
        : planningStyle === "structured"
          ? "detailed"
          : "standard",
    cardStyle:
      planningStyle === "minimal"
        ? "compact"
        : planningStyle === "visual"
          ? "spacious"
          : "comfortable",
  };
};

export const isFeatureVisible = (
  feature: keyof DashboardPersonalization,
): boolean => Boolean(getPersonalizedDashboardConfig()[feature]);

export const getDashboardDensity = () =>
  getPersonalizedDashboardConfig().dashboardDensity;

export const getCardStyle = () =>
  getPersonalizedDashboardConfig().cardStyle;

export const getVisibleFeatures = (): string[] => {
  const config = getPersonalizedDashboardConfig();
  return [
    config.showHabits && "habits",
    config.showTasks && "tasks",
    config.showMeals && "meals",
    config.showWellness && "wellness",
    config.showFitness && "fitness",
  ].filter((feature): feature is string => Boolean(feature));
};

export const getVisibleFeatureCount = (): number => getVisibleFeatures().length;

export const updateDashboardPersonalization = (): never => {
  throw new Error(
    "Legacy dashboard personalization writes are retired; update canonical onboarding preferences",
  );
};
