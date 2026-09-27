import * as categories from "@/features/budget/services/budgetCategoryRepository";
import { calculateBudgetTotals, monthPeriod } from "@/features/budget/services/budgetSummary";
import * as transactions from "@/features/budget/services/budgetTransactionRepository";
import { useBudgetTransactionStore } from "@/features/budget/store/useBudgetTransactionStore";
import { DurableMutationError } from "@/services/storage/durableMutation";
import { deleteKey } from "@/services/storage/mmkv";
import { StorageKeys } from "@/services/storage/storageKeys";
import { assert, assertEqual } from "../testUtils";

function reset(): void { deleteKey(StorageKeys.BUDGET_CATEGORIES); deleteKey(StorageKeys.BUDGET_TRANSACTIONS); useBudgetTransactionStore.setState({ transactions: [], isHydrated: false, isLoading: false, isSaving: false, error: null }); }

export async function testTransactionPrecisionCategoryAndPeriodReconciliation(): Promise<void> {
  reset(); const food = await categories.createBudgetCategory({ name: "Food", plannedAmountMinor: 10000 }); const bills = await categories.createBudgetCategory({ name: "Bills", plannedAmountMinor: 20000 });
  const first = await transactions.createBudgetTransaction({ type: "expense", amountMinor: 1234, categoryId: food.id, title: "Market", date: "2026-09-30" });
  await transactions.createBudgetTransaction({ type: "expense", amountMinor: 2500, categoryId: bills.id, title: "Power", date: "2026-10-01" });
  await transactions.createBudgetTransaction({ type: "income", amountMinor: 9999, title: "Manual income", date: "2026-09-15" });
  let total = calculateBudgetTotals(await categories.getBudgetCategories(), await transactions.getBudgetTransactions(), "2026-09-01");
  assertEqual(total.expenseMinor, 1234, "monthly totals use exact minor units and an exclusive next-month boundary"); assertEqual(total.incomeMinor, 9999, "manual income is derived from the ledger"); assertEqual(total.categories[0].expenseMinor, 1234, "expense reconciles to its category");
  await transactions.updateBudgetTransaction(first.id, { type: "expense", amountMinor: 2345, categoryId: bills.id, title: "Market moved", date: "2026-10-02" });
  total = calculateBudgetTotals(await categories.getBudgetCategories(), await transactions.getBudgetTransactions(), "2026-09-01"); assertEqual(total.expenseMinor, 0, "moving an expense between periods removes it from the old month immediately");
  const october = calculateBudgetTotals(await categories.getBudgetCategories(), await transactions.getBudgetTransactions(), "2026-10-20"); assertEqual(october.expenseMinor, 4845, "the destination month includes edited and existing expenses"); assertEqual(october.categories.find((value) => value.categoryId === bills.id)?.expenseMinor, 4845, "category reconciliation follows edits");
  await transactions.deleteBudgetTransaction(first.id); assertEqual(calculateBudgetTotals(await categories.getBudgetCategories(), await transactions.getBudgetTransactions(), "2026-10-20").expenseMinor, 2500, "delete reconciles totals immediately");
}

export async function testTransactionValidationZeroTotalsAndRestart(): Promise<void> {
  reset(); const category = await categories.createBudgetCategory({ name: "Home", plannedAmountMinor: 5000 });
  const zero = calculateBudgetTotals([category], [], "2026-12-20"); assertEqual(zero.expenseMinor, 0, "empty ledger has zero spending"); assertEqual(zero.remainingMinor, 5000, "empty ledger leaves the full planned amount"); assertEqual(monthPeriod("2026-12-31").endDateExclusive, "2027-01-01", "December period boundary crosses the year exactly");
  let failure: unknown; try { await transactions.createBudgetTransaction({ type: "expense", amountMinor: 1.5, categoryId: category.id, title: "Invalid", date: "2026-09-01" }); } catch (error) { failure = error; } assert(failure instanceof DurableMutationError, "fractional minor units are rejected");
  await transactions.createBudgetTransaction({ type: "expense", amountMinor: 101, categoryId: category.id, title: "Durable", date: "2026-09-01" }); await useBudgetTransactionStore.getState().hydrate(); assertEqual(useBudgetTransactionStore.getState().transactions[0].amountMinor, 101, "hydration restores the exact persisted ledger");
}

export async function testCategoryDeletionPreservesHistoricalSpendingSnapshot(): Promise<void> {
  reset(); const category = await categories.createBudgetCategory({ name: "Transport", plannedAmountMinor: 10000 }); const expense = await transactions.createBudgetTransaction({ type: "expense", amountMinor: 700, categoryId: category.id, title: "Bus", date: "2026-09-03" }); await categories.deleteBudgetCategory(category.id);
  assertEqual(expense.categoryNameSnapshot, "Transport", "expense owns a stable category name snapshot"); assertEqual((await transactions.getBudgetTransactions()).length, 1, "category deletion never deletes the ledger"); assertEqual(calculateBudgetTotals([], await transactions.getBudgetTransactions(), "2026-09-03").expenseMinor, 700, "historical spending remains in period totals after category deletion");
}
