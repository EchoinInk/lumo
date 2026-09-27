import * as repository from "@/features/budget/services/budgetCategoryRepository";
import { useBudgetCategoryStore } from "@/features/budget/store/useBudgetCategoryStore";
import { parseNzdAmountToMinor } from "@/features/budget/services/budgetMoney";
import { DurableMutationError, MutationSubmissionGuard } from "@/services/storage/durableMutation";
import { deleteKey, setString } from "@/services/storage/mmkv";
import { StorageKeys } from "@/services/storage/storageKeys";
import { PersistenceLoadError } from "@/services/storage/versionedStorage";
import { assert, assertEqual } from "../testUtils";

function reset(): void {
  deleteKey(StorageKeys.BUDGET_CATEGORIES);
  useBudgetCategoryStore.setState({ categories: [], isHydrated: false, isLoading: false, error: null });
}

export async function testBudgetCategoryCrudStableIdentityAndRestart(): Promise<void> {
  reset();
  const created = await repository.createBudgetCategory({ name: "Groceries", plannedAmountMinor: 45000 });
  const updated = await repository.updateBudgetCategory(created.id, { name: "Food", plannedAmountMinor: 50000 });
  assertEqual(updated.id, created.id, "editing preserves stable category identity");
  assertEqual(updated.version, 2, "editing increments the record version");
  await useBudgetCategoryStore.getState().hydrate();
  assertEqual(useBudgetCategoryStore.getState().categories[0].name, "Food", "hydration restores the durable category");
  await repository.deleteBudgetCategory(created.id);
  assertEqual((await repository.getBudgetCategories()).length, 0, "soft-deleted categories leave the active list");
}

export async function testBudgetAmountValidationAndDuplicateSubmissionGuard(): Promise<void> {
  reset();
  for (const plannedAmountMinor of [0, -1, 1.5, Number.NaN]) {
    let failure: unknown;
    try { await repository.createBudgetCategory({ name: "Invalid", plannedAmountMinor }); } catch (error) { failure = error; }
    assert(failure instanceof DurableMutationError, "invalid planned amounts must be rejected");
  }
  let blankFailure: unknown;
  try { await repository.createBudgetCategory({ name: "  ", plannedAmountMinor: 100 }); } catch (error) { blankFailure = error; }
  assert(blankFailure instanceof DurableMutationError, "blank category names must be rejected");
  const guard = new MutationSubmissionGuard();
  assertEqual(guard.begin(), true, "first form submission starts");
  assertEqual(guard.begin(), false, "duplicate form submission is blocked");
  guard.end();
  assertEqual(parseNzdAmountToMinor("12.34"), 1234, "currency parsing stores exact integer minor units");
  assertEqual(parseNzdAmountToMinor("12.345"), null, "currency parsing rejects excess precision instead of rounding silently");
}

export async function testBudgetStoreWritesOnlyAfterPersistenceAndSurfacesFailure(): Promise<void> {
  reset();
  useBudgetCategoryStore.setState({ isHydrated: true });
  const storage = globalThis.localStorage; const original = storage.setItem.bind(storage);
  storage.setItem = () => { throw new Error("disk full"); };
  let failure: unknown;
  try { await useBudgetCategoryStore.getState().createCategory({ name: "Bills", plannedAmountMinor: 10000 }); } catch (error) { failure = error; }
  finally { storage.setItem = original; }
  assert(failure instanceof DurableMutationError, "failed budget writes reject through the durable boundary");
  assertEqual(useBudgetCategoryStore.getState().categories.length, 0, "failed writes never enter canonical memory");
  assert(Boolean(useBudgetCategoryStore.getState().error), "store exposes actionable save failure state");
}

export async function testMalformedBudgetStorageRequiresRecovery(): Promise<void> {
  reset();
  setString(StorageKeys.BUDGET_CATEGORIES, JSON.stringify({ schemaVersion: 1, data: [{ id: "broken" }] }));
  let failure: unknown;
  try { await repository.getBudgetCategories(); } catch (error) { failure = error; }
  assert(failure instanceof PersistenceLoadError, "malformed budget storage must enter recovery instead of being overwritten");
  deleteKey(StorageKeys.BUDGET_CATEGORIES);
}
