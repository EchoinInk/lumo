/** Compatibility adapter. Budget category ownership lives in features/budget. */
import * as categories from "@/features/budget/services/budgetCategoryRepository";
import type { Budget, Transaction } from "@/store/useBudgetStore";
import type { AsyncResult } from "@/types/result";
import { err, ok } from "@/types/result";

const toLegacy = (value: Awaited<ReturnType<typeof categories.getBudgetCategories>>[number]): Budget => ({
  id: value.id, category: value.name, limit: value.plannedAmountMinor / 100,
  period: value.period, createdAt: value.createdAt, updatedAt: value.updatedAt,
  deletedAt: value.deletedAt, version: value.version,
});

export class BudgetRepository {
  async getAllTransactions(): AsyncResult<Transaction[]> { return ok([]); }
  async getTransactionById(_id: string): AsyncResult<Transaction | null> { return ok(null); }
  async createTransaction(_value: Omit<Transaction, "id" | "createdAt" | "updatedAt">): AsyncResult<Transaction> { return err("Transactions are deferred to WP4.7."); }
  async updateTransaction(_id: string, _value: Partial<Transaction>): AsyncResult<Transaction> { return err("Transactions are deferred to WP4.7."); }
  async deleteTransaction(_id: string): AsyncResult<boolean> { return err("Transactions are deferred to WP4.7."); }
  async getTransactionsByDateRange(_start: string, _end: string): AsyncResult<Transaction[]> { return ok([]); }
  async getTransactionsByCategory(_category: string): AsyncResult<Transaction[]> { return ok([]); }

  async getAllBudgets(): AsyncResult<Budget[]> { try { return ok((await categories.getBudgetCategories()).map(toLegacy)); } catch (error) { return err(error instanceof Error ? error.message : "Budget read failed."); } }
  async getBudgetById(id: string): AsyncResult<Budget | null> { const value = (await categories.getBudgetCategories()).find((item) => item.id === id); return ok(value ? toLegacy(value) : null); }
  async createBudget(value: Omit<Budget, "id" | "createdAt" | "updatedAt">): AsyncResult<Budget> { try { return ok(toLegacy(await categories.createBudgetCategory({ name: value.category, plannedAmountMinor: Math.round(value.limit * 100) }))); } catch (error) { return err(error instanceof Error ? error.message : "Budget create failed."); } }
  async updateBudget(id: string, value: Partial<Budget>): AsyncResult<Budget> { try { const current = (await categories.getBudgetCategories()).find((item) => item.id === id); if (!current) return err("Budget not found."); return ok(toLegacy(await categories.updateBudgetCategory(id, { name: value.category ?? current.name, plannedAmountMinor: value.limit === undefined ? current.plannedAmountMinor : Math.round(value.limit * 100) }))); } catch (error) { return err(error instanceof Error ? error.message : "Budget update failed."); } }
  async deleteBudget(id: string): AsyncResult<boolean> { try { await categories.deleteBudgetCategory(id); return ok(true); } catch (error) { return err(error instanceof Error ? error.message : "Budget delete failed."); } }
  async getBudgetSummary(_period: Budget["period"]): AsyncResult<{ totalBudget: number; totalSpent: number; remaining: number; percentageUsed: number }> { const values = await categories.getBudgetCategories(); const totalBudget = values.reduce((sum, item) => sum + item.plannedAmountMinor, 0) / 100; return ok({ totalBudget, totalSpent: 0, remaining: totalBudget, percentageUsed: 0 }); }
  async checkBudgetStatus(category: string, _period: Budget["period"]): AsyncResult<{ budget: Budget | null; spent: number; remaining: number; isOverBudget: boolean; percentageUsed: number }> { const value = (await categories.getBudgetCategories()).find((item) => item.name === category); const budget = value ? toLegacy(value) : null; return ok({ budget, spent: 0, remaining: budget?.limit ?? 0, isOverBudget: false, percentageUsed: 0 }); }
}

export const budgetRepository = new BudgetRepository();
