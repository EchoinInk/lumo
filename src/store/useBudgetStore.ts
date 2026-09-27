/** Compatibility exports. Canonical budget state lives in features/budget. */
export { useBudgetCategoryStore as useBudgetStore } from "@/features/budget/store/useBudgetCategoryStore";
export interface Budget {
  id: string;
  category: string;
  limit: number;
  period: "weekly" | "monthly" | "yearly";
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  version?: number;
  pendingSync?: boolean;
}

/** Compatibility shape. Canonical transactions use integer minor units. */
export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description?: string;
  type: "income" | "expense";
  date: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  version?: number;
  pendingSync?: boolean;
}
