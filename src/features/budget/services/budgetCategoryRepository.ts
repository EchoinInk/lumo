import { DurableMutationError, SerializedMutationQueue, type DurableMutationOperation } from "@/services/storage/durableMutation";
import { budgetCategoryStorageDefinition } from "@/services/storage/domainSchemas";
import { loadVersionedData, saveVersionedData } from "@/services/storage/versionedStorage";
import type { BudgetCategory, BudgetCategoryInput } from "../types/budgetCategory";

const queue = new SerializedMutationQueue();
const loadAll = () => loadVersionedData(budgetCategoryStorageDefinition).data;
const saveAll = (values: BudgetCategory[]) => saveVersionedData(budgetCategoryStorageDefinition, values);

function validate(input: BudgetCategoryInput, operation: DurableMutationOperation): BudgetCategoryInput {
  const name = input.name.trim();
  if (!name) throw new DurableMutationError("budget-categories", operation, "invalid-input", "Enter a category name.");
  if (!Number.isSafeInteger(input.plannedAmountMinor) || input.plannedAmountMinor <= 0) {
    throw new DurableMutationError("budget-categories", operation, "invalid-input", "Planned amount must be greater than zero.");
  }
  return { name, plannedAmountMinor: input.plannedAmountMinor };
}

function mutate<T>(operation: DurableMutationOperation, work: () => T): Promise<T> {
  return queue.run(() => {
    try { return work(); }
    catch (cause) {
      if (cause instanceof DurableMutationError) throw cause;
      throw new DurableMutationError("budget-categories", operation, "write-failed", "Budget changes could not be saved.", cause);
    }
  });
}

export async function getBudgetCategories(): Promise<BudgetCategory[]> {
  await queue.waitForIdle();
  return loadAll().filter((category) => !category.deletedAt);
}

export function createBudgetCategory(input: BudgetCategoryInput): Promise<BudgetCategory> {
  return mutate("create", () => {
    const valid = validate(input, "create"); const now = new Date().toISOString();
    const category: BudgetCategory = { ...valid, id: `budget_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`, currencyCode: "NZD", period: "monthly", createdAt: now, updatedAt: now, deletedAt: null, version: 1 };
    saveAll([...loadAll(), category]); return category;
  });
}

export function updateBudgetCategory(id: string, input: BudgetCategoryInput): Promise<BudgetCategory> {
  return mutate("update", () => {
    const valid = validate(input, "update"); const values = loadAll(); const index = values.findIndex((value) => value.id === id && !value.deletedAt);
    if (index < 0) throw new DurableMutationError("budget-categories", "update", "not-found", "That category no longer exists.");
    values[index] = { ...values[index], ...valid, updatedAt: new Date().toISOString(), version: values[index].version + 1 };
    saveAll(values); return values[index];
  });
}

export function deleteBudgetCategory(id: string): Promise<void> {
  return mutate("delete", () => {
    const values = loadAll(); const index = values.findIndex((value) => value.id === id && !value.deletedAt); if (index < 0) return;
    const now = new Date().toISOString(); values[index] = { ...values[index], deletedAt: now, updatedAt: now, version: values[index].version + 1 }; saveAll(values);
  });
}
