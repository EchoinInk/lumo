/** Compatibility adapter. Budget category ownership lives in features/budget. */
import * as categories from "@/features/budget/services/budgetCategoryRepository";
import * as transactions from "@/features/budget/services/budgetTransactionRepository";
import { calculateBudgetTotals } from "@/features/budget/services/budgetSummary";
import { toLocalDateKey } from "@/utils/dateTime";
import type { Budget, Transaction } from "@/store/useBudgetStore";
import type { AsyncResult } from "@/types/result";
import { err, ok } from "@/types/result";

const toLegacy = (value: Awaited<ReturnType<typeof categories.getBudgetCategories>>[number]): Budget => ({
  id: value.id, category: value.name, limit: value.plannedAmountMinor / 100,
  period: value.period, createdAt: value.createdAt, updatedAt: value.updatedAt,
  deletedAt: value.deletedAt, version: value.version,
});
const transactionToLegacy = (value: Awaited<ReturnType<typeof transactions.getBudgetTransactions>>[number]): Transaction => ({
  id: value.id, amount: value.amountMinor / 100, category: value.categoryNameSnapshot ?? "Income",
  description: value.title, type: value.type, date: value.date, createdAt: value.createdAt,
  updatedAt: value.updatedAt, deletedAt: value.deletedAt, version: value.version,
});
const transactionInput = async (value: Omit<Transaction, "id" | "createdAt" | "updatedAt"> | Partial<Transaction>, current?: Awaited<ReturnType<typeof transactions.getBudgetTransactions>>[number]) => {
  const type = value.type ?? current?.type ?? "expense";
  const categoryName = value.category ?? current?.categoryNameSnapshot ?? "";
  const category = type === "expense" ? (await categories.getBudgetCategories()).find((item) => item.name === categoryName) : undefined;
  return { type, amountMinor: value.amount === undefined ? current?.amountMinor ?? 0 : Math.round(value.amount * 100), categoryId: category?.id ?? current?.categoryId ?? null, title: value.description ?? current?.title ?? categoryName, date: value.date ?? current?.date ?? "" };
};

export class BudgetRepository {
  async getAllTransactions(): AsyncResult<Transaction[]> { try { return ok((await transactions.getBudgetTransactions()).map(transactionToLegacy)); } catch (error) { return err(error instanceof Error ? error.message : "Transaction read failed."); } }
  async getTransactionById(id: string): AsyncResult<Transaction | null> { try { const value = (await transactions.getBudgetTransactions()).find((item) => item.id === id); return ok(value ? transactionToLegacy(value) : null); } catch (error) { return err(error instanceof Error ? error.message : "Transaction read failed."); } }
  async createTransaction(value: Omit<Transaction, "id" | "createdAt" | "updatedAt">): AsyncResult<Transaction> { try { return ok(transactionToLegacy(await transactions.createBudgetTransaction(await transactionInput(value)))); } catch (error) { return err(error instanceof Error ? error.message : "Transaction create failed."); } }
  async updateTransaction(id: string, value: Partial<Transaction>): AsyncResult<Transaction> { try { const current = (await transactions.getBudgetTransactions()).find((item) => item.id === id); if (!current) return err("Transaction not found."); return ok(transactionToLegacy(await transactions.updateBudgetTransaction(id, await transactionInput(value, current)))); } catch (error) { return err(error instanceof Error ? error.message : "Transaction update failed."); } }
  async deleteTransaction(id: string): AsyncResult<boolean> { try { await transactions.deleteBudgetTransaction(id); return ok(true); } catch (error) { return err(error instanceof Error ? error.message : "Transaction delete failed."); } }
  async getTransactionsByDateRange(start: string, end: string): AsyncResult<Transaction[]> { try { return ok((await transactions.getBudgetTransactions()).filter((item) => item.date >= start && item.date <= end).map(transactionToLegacy)); } catch (error) { return err(error instanceof Error ? error.message : "Transaction read failed."); } }
  async getTransactionsByCategory(category: string): AsyncResult<Transaction[]> { try { return ok((await transactions.getBudgetTransactions()).filter((item) => item.categoryNameSnapshot === category).map(transactionToLegacy)); } catch (error) { return err(error instanceof Error ? error.message : "Transaction read failed."); } }

  async getAllBudgets(): AsyncResult<Budget[]> { try { return ok((await categories.getBudgetCategories()).map(toLegacy)); } catch (error) { return err(error instanceof Error ? error.message : "Budget read failed."); } }
  async getBudgetById(id: string): AsyncResult<Budget | null> { const value = (await categories.getBudgetCategories()).find((item) => item.id === id); return ok(value ? toLegacy(value) : null); }
  async createBudget(value: Omit<Budget, "id" | "createdAt" | "updatedAt">): AsyncResult<Budget> { try { return ok(toLegacy(await categories.createBudgetCategory({ name: value.category, plannedAmountMinor: Math.round(value.limit * 100) }))); } catch (error) { return err(error instanceof Error ? error.message : "Budget create failed."); } }
  async updateBudget(id: string, value: Partial<Budget>): AsyncResult<Budget> { try { const current = (await categories.getBudgetCategories()).find((item) => item.id === id); if (!current) return err("Budget not found."); return ok(toLegacy(await categories.updateBudgetCategory(id, { name: value.category ?? current.name, plannedAmountMinor: value.limit === undefined ? current.plannedAmountMinor : Math.round(value.limit * 100) }))); } catch (error) { return err(error instanceof Error ? error.message : "Budget update failed."); } }
  async deleteBudget(id: string): AsyncResult<boolean> { try { await categories.deleteBudgetCategory(id); return ok(true); } catch (error) { return err(error instanceof Error ? error.message : "Budget delete failed."); } }
  async getBudgetSummary(_period: Budget["period"]): AsyncResult<{ totalBudget: number; totalSpent: number; remaining: number; percentageUsed: number }> { const values = await categories.getBudgetCategories(); const totals = calculateBudgetTotals(values, await transactions.getBudgetTransactions(), toLocalDateKey()); return ok({ totalBudget: totals.plannedMinor / 100, totalSpent: totals.expenseMinor / 100, remaining: totals.remainingMinor / 100, percentageUsed: totals.plannedMinor ? Math.round(totals.expenseMinor * 100 / totals.plannedMinor) : 0 }); }
  async checkBudgetStatus(category: string, _period: Budget["period"]): AsyncResult<{ budget: Budget | null; spent: number; remaining: number; isOverBudget: boolean; percentageUsed: number }> { const values = await categories.getBudgetCategories(); const value = values.find((item) => item.name === category); const budget = value ? toLegacy(value) : null; const total = value ? calculateBudgetTotals(values, await transactions.getBudgetTransactions(), toLocalDateKey()).categories.find((item) => item.categoryId === value.id) : undefined; const spent = (total?.expenseMinor ?? 0) / 100; const remaining = (total?.remainingMinor ?? 0) / 100; return ok({ budget, spent, remaining, isOverBudget: remaining < 0, percentageUsed: total?.plannedMinor ? Math.round(total.expenseMinor * 100 / total.plannedMinor) : 0 }); }
}

export const budgetRepository = new BudgetRepository();
