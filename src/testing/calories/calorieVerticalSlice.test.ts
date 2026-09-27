import { dailyCalorieSummary } from "@/features/calories/services/calorieSelectors";
import * as preferences from "@/features/calories/services/caloriePreferencesRepository";
import * as meals from "@/features/meals/services/mealLocalRepository";
import * as plans from "@/features/meal-plans/services/mealPlanLocalRepository";
import { useCaloriePreferencesStore } from "@/features/calories/store/useCaloriePreferencesStore";
import { useMealStore } from "@/features/meals/store/useMealStore";
import { DurableMutationError } from "@/services/storage/durableMutation";
import { deleteKey } from "@/services/storage/mmkv";
import { StorageKeys } from "@/services/storage/storageKeys";
import { assert, assertEqual } from "../testUtils";

function reset(): void { deleteKey(StorageKeys.MEALS); deleteKey(StorageKeys.MEAL_PLANS); deleteKey(StorageKeys.CALORIE_PREFERENCES); useMealStore.setState({ meals: [], isHydrated: false, isLoading: false, error: null }); useCaloriePreferencesStore.setState({ preferences: { dailyGoalKcal: null, updatedAt: null, version: 0 }, isHydrated: false, isLoading: false, isSaving: false, error: null }); }

export async function testCaloriesUseOnlyConsumedMealsAndKeepUnknownHonest(): Promise<void> {
  reset();
  await plans.saveAssignment("2026-09-28", { date: "2026-09-28", slot: "dinner", manualDescription: "Planned meal" });
  await meals.createMeal({ name: "Known breakfast", mealType: "breakfast", date: "2026-09-28", nutrition: { calories: 450 } });
  await meals.createMeal({ name: "Unknown snack", mealType: "snack", date: "2026-09-28" });
  const summary = dailyCalorieSummary(await meals.getMeals(), "2026-09-28");
  assertEqual(summary.knownCalories, 450, "planned meals never count toward consumed calorie intake"); assertEqual(summary.knownEntryCount, 1, "known calorie records are traceable"); assertEqual(summary.unknownEntryCount, 1, "missing calories remain explicitly unknown instead of inferred");
}

export async function testCalorieEditsDeletesAndDailyBoundariesRecalculate(): Promise<void> {
  reset(); const entry = await meals.createMeal({ name: "Quick intake", mealType: "snack", date: "2026-09-30", nutrition: { calories: 125 } }); await meals.createMeal({ name: "Next day", mealType: "breakfast", date: "2026-10-01", nutrition: { calories: 300 } });
  assertEqual(dailyCalorieSummary(await meals.getMeals(), "2026-09-30").knownCalories, 125, "local date aggregation excludes the next day");
  await meals.updateMeal(entry.id, { name: "Corrected", mealType: "snack", date: "2026-10-01", nutrition: { calories: 150 } }); assertEqual(dailyCalorieSummary(await meals.getMeals(), "2026-09-30").knownCalories, 0, "moving an entry removes it from the old date"); assertEqual(dailyCalorieSummary(await meals.getMeals(), "2026-10-01").knownCalories, 450, "edited calories and date reconcile immediately");
  await meals.deleteMeal(entry.id); assertEqual(dailyCalorieSummary(await meals.getMeals(), "2026-10-01").knownCalories, 300, "deleting the canonical meal removes its intake");
}

export async function testCalorieGoalPersistenceValidationAndNoGoal(): Promise<void> {
  reset(); assertEqual((await preferences.getCaloriePreferences()).dailyGoalKcal, null, "fresh installs honestly have no configured goal"); await preferences.saveCalorieGoal(2100); await useCaloriePreferencesStore.getState().hydrate(); assertEqual(useCaloriePreferencesStore.getState().preferences.dailyGoalKcal, 2100, "goal survives hydration restart"); await preferences.saveCalorieGoal(null); assertEqual((await preferences.getCaloriePreferences()).dailyGoalKcal, null, "a goal can be explicitly removed");
  let failure: unknown; try { await preferences.saveCalorieGoal(0); } catch (error) { failure = error; } assert(failure instanceof DurableMutationError, "invalid calorie goals are rejected");
}
