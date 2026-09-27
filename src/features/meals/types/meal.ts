export const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = typeof mealTypes[number];

export interface MealNutrition {
  calories?: number;
  proteinGrams?: number;
  carbohydrateGrams?: number;
  fatGrams?: number;
}

export interface MealEntry {
  id: string;
  date: string;
  mealType: MealType;
  name: string;
  description?: string;
  nutrition?: MealNutrition;
  recipeSnapshot?: { recipeId: string; name: string; servings: number; ingredients: { name: string; quantity: number; unit: string }[] };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  version: number;
}

export interface MealEntryInput {
  date: string;
  mealType: MealType;
  name: string;
  description?: string;
  nutrition?: MealNutrition;
}
