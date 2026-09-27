import * as repository from "@/features/weight/services/weightRepository";
import { latestWeight, weightChangeGrams, weightHistory } from "@/features/weight/services/weightSelectors";
import { gramsToUnit, parseWeightToGrams } from "@/features/weight/services/weightUnits";
import { useWeightStore } from "@/features/weight/store/useWeightStore";
import { DurableMutationError } from "@/services/storage/durableMutation";
import { deleteKey } from "@/services/storage/mmkv";
import { StorageKeys } from "@/services/storage/storageKeys";
import { assert, assertEqual } from "../testUtils";

function reset(): void { deleteKey(StorageKeys.WEIGHT); useWeightStore.setState({ state: { preferredUnit: "kg", entries: [], updatedAt: null, version: 0 }, isHydrated: false, isLoading: false, isSaving: false, error: null }); }

export function testWeightUnitConversionAndPrecision(): void {
  assertEqual(parseWeightToGrams("70.125", "kg"), 70125, "kg input preserves gram precision"); assertEqual(parseWeightToGrams("154.6", "lb"), 70125, "pound input converts deterministically to integer grams"); assert(Math.abs(gramsToUnit(70125, "lb") - 154.599) < 0.01, "stored grams convert back to pounds within display precision"); assertEqual(parseWeightToGrams("1.2345", "kg"), null, "unsupported excess input precision is rejected");
}

export async function testWeightOrderingTrendEditDeleteAndRestart(): Promise<void> {
  reset(); const older = await repository.createWeightEntry({ grams: 70000, date: "2026-09-01" }); const latest = await repository.createWeightEntry({ grams: 70500, date: "2026-09-10" }); await repository.createWeightEntry({ grams: 69000, date: "2026-08-20" });
  assertEqual(weightHistory((await repository.getWeightState()).entries)[0].id, latest.id, "history orders by local date descending"); assertEqual(latestWeight((await repository.getWeightState()).entries)?.grams, 70500, "latest weight derives from dated records"); assertEqual(weightChangeGrams((await repository.getWeightState()).entries), 500, "change is a neutral signed difference from the previous record");
  await repository.updateWeightEntry(older.id, { grams: 71000, date: "2026-09-15", note: "corrected" }); assertEqual(latestWeight((await repository.getWeightState()).entries)?.id, older.id, "editing a date recalculates the latest entry"); assertEqual(weightChangeGrams((await repository.getWeightState()).entries), 500, "trend recalculates after editing the latest entry");
  await repository.deleteWeightEntry(older.id); assertEqual(latestWeight((await repository.getWeightState()).entries)?.id, latest.id, "deleting the latest entry promotes the next real record"); assertEqual(weightChangeGrams((await repository.getWeightState()).entries), 1500, "change recalculates after deleting the latest entry");
  await repository.setWeightUnit("lb"); await useWeightStore.getState().hydrate(); assertEqual(useWeightStore.getState().state.preferredUnit, "lb", "unit selection survives restart hydration"); assertEqual(useWeightStore.getState().state.entries.filter((entry) => !entry.deletedAt).length, 2, "weight history survives restart hydration");
}

export async function testWeightValidationAndEmptyState(): Promise<void> {
  reset(); assertEqual(latestWeight((await repository.getWeightState()).entries), null, "empty history has no invented current weight"); let failure: unknown; try { await repository.createWeightEntry({ grams: 0, date: "2026-09-01" }); } catch (error) { failure = error; } assert(failure instanceof DurableMutationError, "zero weight is rejected"); failure = undefined; try { await repository.createWeightEntry({ grams: 70000, date: "not-a-date" }); } catch (error) { failure = error; } assert(failure instanceof DurableMutationError, "invalid dates are rejected");
}
