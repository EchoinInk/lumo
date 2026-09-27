export type BudgetPeriod = "monthly";

export interface BudgetCategory {
  id: string;
  name: string;
  plannedAmountMinor: number;
  currencyCode: "NZD";
  period: BudgetPeriod;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  version: number;
}

export interface BudgetCategoryInput {
  name: string;
  plannedAmountMinor: number;
}
