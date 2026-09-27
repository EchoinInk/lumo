import { DurableMutationError, SerializedMutationQueue, type DurableMutationOperation } from "@/services/storage/durableMutation";
import { budgetTransactionStorageDefinition } from "@/services/storage/domainSchemas";
import { loadVersionedData, saveVersionedData } from "@/services/storage/versionedStorage";
import { isLocalDateKey } from "@/utils/dateTime";
import { getBudgetCategories } from "./budgetCategoryRepository";
import type { BudgetTransaction, BudgetTransactionInput } from "../types/budgetTransaction";

const queue = new SerializedMutationQueue();
const loadAll = () => loadVersionedData(budgetTransactionStorageDefinition).data;
const saveAll = (values: BudgetTransaction[]) => saveVersionedData(budgetTransactionStorageDefinition, values);

function fail(operation: DurableMutationOperation, kind: "not-found" | "invalid-input" | "write-failed", message: string, cause?: unknown): never {
  throw new DurableMutationError("budget-transactions", operation, kind, message, cause);
}

async function validate(input: BudgetTransactionInput, operation: DurableMutationOperation): Promise<BudgetTransactionInput & { categoryNameSnapshot: string | null }> {
  const title = input.title.trim();
  if (!title) fail(operation, "invalid-input", "Enter a title or description.");
  if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) fail(operation, "invalid-input", "Amount must be greater than zero.");
  if (!isLocalDateKey(input.date)) fail(operation, "invalid-input", "Enter a valid local date.");
  if (input.type === "expense") {
    const category = (await getBudgetCategories()).find((value) => value.id === input.categoryId);
    if (!category) fail(operation, "invalid-input", "Choose an active budget category.");
    return { ...input, title, categoryId: category.id, categoryNameSnapshot: category.name };
  }
  return { ...input, title, categoryId: null, categoryNameSnapshot: null };
}

export async function getBudgetTransactions(options: { includeDeleted?: boolean } = {}): Promise<BudgetTransaction[]> {
  await queue.waitForIdle();
  const values = loadAll();
  return options.includeDeleted ? values : values.filter((value) => !value.deletedAt);
}

export async function createBudgetTransaction(input: BudgetTransactionInput, options: { id?: string; sourcePaymentId?: string | null } = {}): Promise<BudgetTransaction> {
  return queue.run(async () => {
    try {
      const valid = await validate(input, "create");
      const values = loadAll();
      if (options.sourcePaymentId) {
        const existing = values.find((value) => value.sourcePaymentId === options.sourcePaymentId);
        if (existing && !existing.deletedAt) return existing;
      }
      const now = new Date().toISOString();
      const id = options.id ?? `transaction_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const existingIndex = values.findIndex((value) => value.id === id);
      const transaction: BudgetTransaction = {
        id, type: valid.type, amountMinor: valid.amountMinor, currencyCode: "NZD",
        categoryId: valid.categoryId ?? null, categoryNameSnapshot: valid.categoryNameSnapshot,
        title: valid.title, date: valid.date, sourcePaymentId: options.sourcePaymentId ?? null,
        createdAt: existingIndex >= 0 ? values[existingIndex].createdAt : now, updatedAt: now, deletedAt: null,
        version: existingIndex >= 0 ? values[existingIndex].version + 1 : 1,
      };
      if (existingIndex >= 0) values[existingIndex] = transaction; else values.push(transaction);
      saveAll(values);
      return transaction;
    } catch (cause) {
      if (cause instanceof DurableMutationError) throw cause;
      return fail("create", "write-failed", "Transaction could not be saved.", cause);
    }
  });
}

export async function updateBudgetTransaction(id: string, input: BudgetTransactionInput): Promise<BudgetTransaction> {
  return queue.run(async () => {
    try {
      const valid = await validate(input, "update");
      const values = loadAll();
      const index = values.findIndex((value) => value.id === id && !value.deletedAt);
      if (index < 0) fail("update", "not-found", "That transaction no longer exists.");
      values[index] = { ...values[index], ...valid, categoryId: valid.categoryId ?? null, updatedAt: new Date().toISOString(), version: values[index].version + 1 };
      saveAll(values);
      return values[index];
    } catch (cause) {
      if (cause instanceof DurableMutationError) throw cause;
      return fail("update", "write-failed", "Transaction changes could not be saved.", cause);
    }
  });
}

export async function deleteBudgetTransaction(id: string): Promise<void> {
  return queue.run(() => {
    try {
      const values = loadAll(); const index = values.findIndex((value) => value.id === id && !value.deletedAt);
      if (index < 0) return;
      const now = new Date().toISOString(); values[index] = { ...values[index], deletedAt: now, updatedAt: now, version: values[index].version + 1 };
      saveAll(values);
    } catch (cause) { return fail("delete", "write-failed", "Transaction could not be deleted.", cause); }
  });
}

export async function findPaymentExpense(paymentId: string): Promise<BudgetTransaction | null> {
  return (await getBudgetTransactions()).find((value) => value.sourcePaymentId === paymentId) ?? null;
}
