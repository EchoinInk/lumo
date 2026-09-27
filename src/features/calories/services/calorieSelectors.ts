import type { MealEntry } from "@/features/meals/types/meal";

export interface DailyCalorieSummary {
  date: string;
  knownCalories: number;
  knownEntryCount: number;
  unknownEntryCount: number;
  entries: MealEntry[];
}

export function dailyCalorieSummary(meals: MealEntry[], date: string): DailyCalorieSummary {
  const entries = meals.filter((meal) => !meal.deletedAt && meal.date === date);
  const known = entries.filter((meal) => meal.nutrition?.calories !== undefined);
  return {
    date,
    entries,
    knownCalories: known.reduce((sum, meal) => sum + (meal.nutrition?.calories ?? 0), 0),
    knownEntryCount: known.length,
    unknownEntryCount: entries.length - known.length,
  };
}
