import { DurableMutationError, SerializedMutationQueue } from "@/services/storage/durableMutation";
import { caloriePreferencesStorageDefinition } from "@/services/storage/domainSchemas";
import { loadVersionedData, saveVersionedData } from "@/services/storage/versionedStorage";
import type { CaloriePreferences } from "../types/caloriePreferences";

const queue = new SerializedMutationQueue();
export async function getCaloriePreferences(): Promise<CaloriePreferences> { await queue.waitForIdle(); return loadVersionedData(caloriePreferencesStorageDefinition).data; }
export function saveCalorieGoal(dailyGoalKcal: number | null): Promise<CaloriePreferences> {
  return queue.run(() => {
    if (dailyGoalKcal !== null && (!Number.isSafeInteger(dailyGoalKcal) || dailyGoalKcal <= 0)) throw new DurableMutationError("calorie-preferences", "update", "invalid-input", "Calorie goal must be a positive whole number.");
    try { const current = loadVersionedData(caloriePreferencesStorageDefinition).data; const value = { dailyGoalKcal, updatedAt: new Date().toISOString(), version: current.version + 1 }; saveVersionedData(caloriePreferencesStorageDefinition, value); return value; }
    catch (cause) { if (cause instanceof DurableMutationError) throw cause; throw new DurableMutationError("calorie-preferences", "update", "write-failed", "Calorie preferences could not be saved.", cause); }
  });
}
