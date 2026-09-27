import type { MealEntry } from "@/features/meals/types/meal";
import { calorieSummaryForDate } from "@/features/dashboard/utils/summarySelectors";

export interface DailyCalorieSummary {
  date: string;
  knownCalories: number;
  knownEntryCount: number;
  unknownEntryCount: number;
  entries: MealEntry[];
}

export function dailyCalorieSummary(meals: MealEntry[], date: string): DailyCalorieSummary {
  const summary = calorieSummaryForDate(meals, date);
  return {
    date,
    entries: summary.entries,
    knownCalories: summary.knownKcal,
    knownEntryCount: summary.knownEntryCount,
    unknownEntryCount: summary.unknownEntryCount,
  };
}
