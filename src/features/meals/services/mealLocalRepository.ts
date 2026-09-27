import { DurableMutationError, SerializedMutationQueue, type DurableMutationOperation } from "@/services/storage/durableMutation";
import { mealStorageDefinition } from "@/services/storage/domainSchemas";
import { loadVersionedData, saveVersionedData } from "@/services/storage/versionedStorage";
import { isLocalDateKey } from "@/utils/dateTime";
import { mealTypes, type MealEntry, type MealEntryInput, type MealNutrition } from "../types/meal";
import type { Recipe } from "@/features/recipes/types/recipe";

const mutations = new SerializedMutationQueue();
const nutritionFields: (keyof MealNutrition)[] = ["calories", "proteinGrams", "carbohydrateGrams", "fatGrams"];

function loadAll(): MealEntry[] { return loadVersionedData(mealStorageDefinition).data; }
function saveAll(meals: MealEntry[]): void { saveVersionedData(mealStorageDefinition, meals); }

function validate(input: MealEntryInput, operation: DurableMutationOperation): MealEntryInput {
  const name = input.name.trim();
  if (!name) throw new DurableMutationError("meals", operation, "invalid-input", "A consumed meal needs a name.");
  if (!isLocalDateKey(input.date)) throw new DurableMutationError("meals", operation, "invalid-input", "Choose a valid meal date.");
  if (!mealTypes.includes(input.mealType)) throw new DurableMutationError("meals", operation, "invalid-input", "Choose a supported meal type.");
  const nutrition = (input.nutrition ? Object.fromEntries(
    nutritionFields.filter((field) => input.nutrition?.[field] !== undefined).map((field) => [field, input.nutrition?.[field]]),
  ) : {}) as MealNutrition;
  for (const field of nutritionFields) {
    const value = nutrition[field];
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) throw new DurableMutationError("meals", operation, "invalid-input", "Nutrition values must be zero or greater.");
  }
  return { ...input, name, description: input.description?.trim() || undefined, nutrition: Object.keys(nutrition).length ? nutrition : undefined };
}

function mutate<T>(operation: DurableMutationOperation, work: () => T): Promise<T> {
  return mutations.run(() => {
    try { return work(); }
    catch (cause) {
      if (cause instanceof DurableMutationError) throw cause;
      throw new DurableMutationError("meals", operation, "write-failed", "Meal changes could not be saved.", cause);
    }
  });
}

export async function getMeals(): Promise<MealEntry[]> { await mutations.waitForIdle(); return loadAll().filter((meal) => !meal.deletedAt); }
export async function getMealById(id: string): Promise<MealEntry | null> { return (await getMeals()).find((meal) => meal.id === id) ?? null; }

export function createMeal(input: MealEntryInput): Promise<MealEntry> {
  return mutate("create", () => {
    const valid = validate(input, "create"); const meals = loadAll(); const now = new Date().toISOString();
    const meal: MealEntry = { ...valid, id: `meal_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`, createdAt: now, updatedAt: now, deletedAt: null, version: 1 };
    saveAll([...meals, meal]); return meal;
  });
}
/** Copies the recipe at logging time so later recipe edits/deletion cannot rewrite consumed history. */
export function createMealFromRecipe(recipe: Recipe, input: Omit<MealEntryInput, "name" | "description">): Promise<MealEntry> {
  return mutate("create", () => { const valid = validate({ ...input, name: recipe.name, description: `Saved recipe · ${recipe.servings} servings` }, "create"); const meals = loadAll(); const now = new Date().toISOString(); const meal: MealEntry = { ...valid, recipeSnapshot: { recipeId: recipe.id, name: recipe.name, servings: recipe.servings, ingredients: recipe.ingredients.map(({ name, quantity, unit }) => ({ name, quantity, unit })) }, id: `meal_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`, createdAt: now, updatedAt: now, deletedAt: null, version: 1 }; saveAll([...meals, meal]); return meal; });
}

export function updateMeal(id: string, input: MealEntryInput): Promise<MealEntry> {
  return mutate("update", () => {
    const valid = validate(input, "update"); const meals = loadAll(); const index = meals.findIndex((meal) => meal.id === id && !meal.deletedAt);
    if (index < 0) throw new DurableMutationError("meals", "update", "not-found", "That meal no longer exists.");
    const updated: MealEntry = { ...meals[index], ...valid, updatedAt: new Date().toISOString(), version: meals[index].version + 1 };
    meals[index] = updated; saveAll(meals); return updated;
  });
}

export function deleteMeal(id: string): Promise<void> {
  return mutate("delete", () => {
    const meals = loadAll(); const index = meals.findIndex((meal) => meal.id === id && !meal.deletedAt); if (index < 0) return;
    const now = new Date().toISOString(); meals[index] = { ...meals[index], deletedAt: now, updatedAt: now, version: meals[index].version + 1 }; saveAll(meals);
  });
}
