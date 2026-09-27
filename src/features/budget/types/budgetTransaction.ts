export type BudgetTransactionType = "expense" | "income";

export interface BudgetTransaction {
  id: string;
  type: BudgetTransactionType;
  amountMinor: number;
  currencyCode: "NZD";
  categoryId: string | null;
  categoryNameSnapshot: string | null;
  title: string;
  date: string;
  sourcePaymentId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export interface BudgetTransactionInput {
  type: BudgetTransactionType;
  amountMinor: number;
  categoryId?: string | null;
  title: string;
  date: string;
}

export interface BudgetPeriodTotals {
  periodKey: string;
  startDate: string;
  endDateExclusive: string;
  plannedMinor: number;
  expenseMinor: number;
  incomeMinor: number;
  remainingMinor: number;
  categories: { categoryId: string; name: string; plannedMinor: number; expenseMinor: number; remainingMinor: number }[];
}
