/**
 * Onboarding types for Lumo
 * Phase 11.9 - Onboarding Foundation
 */

export type StruggleArea =
  | "remembering_tasks"
  | "building_routines"
  | "meal_planning"
  | "budgeting"
  | "staying_consistent"
  | "feeling_overwhelmed";

export type PlanningStyle = "minimal" | "visual" | "structured" | "flexible";

export type FocusArea =
  | "tasks"
  | "habits"
  | "meals"
  | "wellness"
  | "fitness"
  | "budget";

export interface OnboardingPreferences {
  struggleAreas: StruggleArea[];
  planningStyle: PlanningStyle | null;
  focusAreas: FocusArea[];
}

export interface OnboardingState {
  isHydrated: boolean;
  hydrationError: string | null;
  isComplete: boolean;
  preferences: OnboardingPreferences;
  completedAt: string | null;
}

export interface OnboardingStore extends OnboardingState {
  // Actions
  hydrate: () => Promise<void>;
  setStruggleAreas: (values: StruggleArea[]) => void;
  setPlanningStyle: (value: PlanningStyle) => void;
  setFocusAreas: (values: FocusArea[]) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => void;
}

// Display labels for UI
export const STRUGGLE_AREA_LABELS: Record<StruggleArea, string> = {
  remembering_tasks: "Remembering tasks",
  building_routines: "Building routines",
  meal_planning: "Meal planning",
  budgeting: "Budgeting",
  staying_consistent: "Staying consistent",
  feeling_overwhelmed: "Feeling overwhelmed",
};

export const PLANNING_STYLE_LABELS: Record<PlanningStyle, string> = {
  minimal: "Minimal",
  visual: "Visual",
  structured: "Structured",
  flexible: "Flexible",
};

export const FOCUS_AREA_LABELS: Record<FocusArea, string> = {
  tasks: "Tasks",
  habits: "Habits",
  meals: "Meals",
  wellness: "Wellness",
  fitness: "Fitness",
  budget: "Budget",
};
