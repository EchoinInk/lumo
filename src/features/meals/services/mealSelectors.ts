import type { MealEntry, MealNutrition } from "../types/meal";

export function mealsForDate(meals: MealEntry[], date: string): MealEntry[] {
  return meals.filter((meal) => meal.date === date).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function mealHistory(meals: MealEntry[]): MealEntry[] {
  return [...meals].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function nutritionTotals(meals: MealEntry[]): Required<MealNutrition> {
  return meals.reduce((totals, meal) => ({
    calories: totals.calories + (meal.nutrition?.calories ?? 0),
    proteinGrams: totals.proteinGrams + (meal.nutrition?.proteinGrams ?? 0),
    carbohydrateGrams: totals.carbohydrateGrams + (meal.nutrition?.carbohydrateGrams ?? 0),
    fatGrams: totals.fatGrams + (meal.nutrition?.fatGrams ?? 0),
  }), { calories: 0, proteinGrams: 0, carbohydrateGrams: 0, fatGrams: 0 });
}
