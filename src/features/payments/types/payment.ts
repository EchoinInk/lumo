export type PaymentStatus = "unpaid" | "linking" | "paid" | "undoing";

export interface Payment {
  id: string;
  title: string;
  amountMinor: number;
  currencyCode: "NZD";
  dueDate: string;
  categoryId: string;
  categoryNameSnapshot: string;
  status: PaymentStatus;
  linkedExpenseId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export interface PaymentInput {
  title: string;
  amountMinor: number;
  dueDate: string;
  categoryId: string;
}
