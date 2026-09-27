import type { BudgetCategory } from "../types/budgetCategory";
import type { BudgetPeriodTotals, BudgetTransaction } from "../types/budgetTransaction";

export function monthPeriod(dateKey: string): { periodKey: string; startDate: string; endDateExclusive: string } {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(dateKey);
  if (!match) throw new Error("Invalid local date key.");
  const year = Number(match[1]); const month = Number(match[2]);
  if (month < 1 || month > 12) throw new Error("Invalid local date key.");
  const nextYear = month === 12 ? year + 1 : year; const nextMonth = month === 12 ? 1 : month + 1;
  return { periodKey: `${match[1]}-${match[2]}`, startDate: `${match[1]}-${match[2]}-01`, endDateExclusive: `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01` };
}

export function calculateBudgetTotals(categories: BudgetCategory[], transactions: BudgetTransaction[], dateKey: string): BudgetPeriodTotals {
  const period = monthPeriod(dateKey);
  const active = transactions.filter((value) => !value.deletedAt && value.date >= period.startDate && value.date < period.endDateExclusive);
  const expenseMinor = active.filter((value) => value.type === "expense").reduce((sum, value) => sum + value.amountMinor, 0);
  const incomeMinor = active.filter((value) => value.type === "income").reduce((sum, value) => sum + value.amountMinor, 0);
  const plannedMinor = categories.reduce((sum, value) => sum + value.plannedAmountMinor, 0);
  return { ...period, plannedMinor, expenseMinor, incomeMinor, remainingMinor: plannedMinor - expenseMinor,
    categories: categories.map((category) => { const spent = active.filter((value) => value.type === "expense" && value.categoryId === category.id).reduce((sum, value) => sum + value.amountMinor, 0); return { categoryId: category.id, name: category.name, plannedMinor: category.plannedAmountMinor, expenseMinor: spent, remainingMinor: category.plannedAmountMinor - spent }; }),
  };
}
