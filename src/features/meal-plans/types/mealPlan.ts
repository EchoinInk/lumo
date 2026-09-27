export const mealSlots = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealSlot = typeof mealSlots[number];
export interface PlannedMealAssignment { id: string; date: string; slot: MealSlot; recipeId?: string; recipeSnapshot?: { name: string; ingredients: { id?: string; name: string; quantity: number; unit: string }[] }; manualDescription?: string; createdAt: string; updatedAt: string; }
export interface WeeklyMealPlan { id: string; weekStart: string; assignments: PlannedMealAssignment[]; createdAt: string; updatedAt: string; version: number; }
export interface PlannedMealInput { date: string; slot: MealSlot; recipeId?: string; manualDescription?: string; }
