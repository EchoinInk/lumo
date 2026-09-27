import * as categories from "@/features/budget/services/budgetCategoryRepository";
import * as transactions from "@/features/budget/services/budgetTransactionRepository";
import * as payments from "@/features/payments/services/paymentRepository";
import { usePaymentStore } from "@/features/payments/store/usePaymentStore";
import { deleteKey, setString } from "@/services/storage/mmkv";
import { StorageKeys } from "@/services/storage/storageKeys";
import { assertEqual } from "../testUtils";

function reset(): void { deleteKey(StorageKeys.BUDGET_CATEGORIES); deleteKey(StorageKeys.BUDGET_TRANSACTIONS); deleteKey(StorageKeys.PAYMENTS); usePaymentStore.setState({ payments: [], isHydrated: false, isLoading: false, isSaving: false, error: null }); }

export async function testPaymentRepeatedPaidUndoAndRestart(): Promise<void> {
  reset(); const category = await categories.createBudgetCategory({ name: "Bills", plannedAmountMinor: 50000 }); const payment = await payments.createPayment({ title: "Internet", amountMinor: 6099, dueDate: "2026-09-20", categoryId: category.id });
  const first = await payments.markPaymentPaid(payment.id); const second = await payments.markPaymentPaid(payment.id); assertEqual(second.linkedExpenseId, first.linkedExpenseId, "repeated Mark paid reuses the same linked expense"); assertEqual((await transactions.getBudgetTransactions()).length, 1, "repeated Mark paid creates exactly one expense");
  await usePaymentStore.getState().hydrate(); assertEqual(usePaymentStore.getState().payments[0].status, "paid", "paid state survives hydration restart");
  await payments.undoPaymentPaid(payment.id); assertEqual((await transactions.getBudgetTransactions()).length, 0, "Undo paid removes the linked expense"); assertEqual((await payments.getPayments())[0].status, "unpaid", "Undo paid returns the bill to unpaid");
  await payments.markPaymentPaid(payment.id); assertEqual((await transactions.getBudgetTransactions()).length, 1, "payment can be paid again without duplicate history");
}

export async function testPaymentRecoveryAndLinkedExpenseMutationDeletion(): Promise<void> {
  reset(); const category = await categories.createBudgetCategory({ name: "Housing", plannedAmountMinor: 200000 }); const payment = await payments.createPayment({ title: "Rent", amountMinor: 120000, dueDate: "2026-10-01", categoryId: category.id });
  setString(StorageKeys.PAYMENTS, JSON.stringify({ schemaVersion: 1, data: [{ ...payment, status: "linking", paidAt: new Date().toISOString(), version: payment.version + 1 }] }));
  const recovered = await payments.getPayments(); assertEqual(recovered[0].status, "paid", "restart completes an interrupted link operation"); assertEqual((await transactions.getBudgetTransactions()).length, 1, "recovery creates one linked expense");
  const expense = (await transactions.getBudgetTransactions())[0]; await transactions.updateBudgetTransaction(expense.id, { type: "expense", amountMinor: 119900, categoryId: category.id, title: "Corrected rent", date: "2026-10-02" }); assertEqual((await payments.getPayments())[0].status, "paid", "safe linked-expense edits preserve paid state");
  await transactions.deleteBudgetTransaction(expense.id); const afterDelete = await payments.getPayments(); assertEqual(afterDelete[0].status, "unpaid", "deleting a linked expense explicitly reopens the payment"); assertEqual(afterDelete[0].linkedExpenseId, null, "reopened payment clears its stale link");
}

export async function testPaidPaymentEditAndDeleteReconcileBudget(): Promise<void> {
  reset(); const category = await categories.createBudgetCategory({ name: "Utilities", plannedAmountMinor: 30000 }); const payment = await payments.createPayment({ title: "Power", amountMinor: 8000, dueDate: "2026-09-04", categoryId: category.id }); await payments.markPaymentPaid(payment.id);
  await payments.updatePayment(payment.id, { title: "Power corrected", amountMinor: 8100, dueDate: "2026-09-05", categoryId: category.id }); const expense = (await transactions.getBudgetTransactions())[0]; assertEqual(expense.amountMinor, 8100, "editing a paid payment updates its single linked expense"); assertEqual(expense.date, "2026-09-05", "linked expense follows the corrected due date");
  await payments.deletePayment(payment.id); assertEqual((await transactions.getBudgetTransactions()).length, 0, "deleting a paid payment removes its linked spending"); assertEqual((await payments.getPayments()).length, 0, "deleted payment leaves the active list");
}
