import { DurableMutationError, SerializedMutationQueue, type DurableMutationOperation } from "@/services/storage/durableMutation";
import { paymentStorageDefinition } from "@/services/storage/domainSchemas";
import { loadVersionedData, saveVersionedData } from "@/services/storage/versionedStorage";
import { isLocalDateKey } from "@/utils/dateTime";
import { getBudgetCategories } from "@/features/budget/services/budgetCategoryRepository";
import { createBudgetTransaction, deleteBudgetTransaction, findPaymentExpense, updateBudgetTransaction } from "@/features/budget/services/budgetTransactionRepository";
import type { Payment, PaymentInput } from "../types/payment";

const queue = new SerializedMutationQueue();
const loadAll = () => loadVersionedData(paymentStorageDefinition).data;
const saveAll = (values: Payment[]) => saveVersionedData(paymentStorageDefinition, values);
const expenseId = (paymentId: string) => `payment_expense_${paymentId}`;

function fail(operation: DurableMutationOperation, kind: "not-found" | "invalid-input" | "write-failed", message: string, cause?: unknown): never {
  throw new DurableMutationError("payments", operation, kind, message, cause);
}
async function validate(input: PaymentInput, operation: DurableMutationOperation): Promise<PaymentInput & { title: string; categoryNameSnapshot: string }> {
  const title = input.title.trim();
  if (!title) fail(operation, "invalid-input", "Enter a payee or title.");
  if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) fail(operation, "invalid-input", "Amount must be greater than zero.");
  if (!isLocalDateKey(input.dueDate)) fail(operation, "invalid-input", "Enter a valid due date.");
  const category = (await getBudgetCategories()).find((value) => value.id === input.categoryId);
  if (!category) fail(operation, "invalid-input", "Choose an active budget category.");
  return { ...input, title, categoryNameSnapshot: category.name };
}
function replace(values: Payment[], payment: Payment): void {
  const index = values.findIndex((value) => value.id === payment.id);
  if (index < 0) values.push(payment); else values[index] = payment;
  saveAll(values);
}
async function ensureExpense(payment: Payment) {
  const input = { type: "expense" as const, amountMinor: payment.amountMinor, categoryId: payment.categoryId, title: payment.title, date: payment.dueDate };
  const existing = await findPaymentExpense(payment.id);
  return existing ? updateBudgetTransaction(existing.id, input) : createBudgetTransaction(input, { id: expenseId(payment.id), sourcePaymentId: payment.id });
}

async function reconcileOne(payment: Payment): Promise<Payment> {
  if (payment.status === "linking") {
    const expense = await ensureExpense(payment); const values = loadAll(); const current = values.find((value) => value.id === payment.id) ?? payment;
    const resolved = { ...current, status: "paid" as const, linkedExpenseId: expense.id, paidAt: current.paidAt ?? new Date().toISOString(), updatedAt: new Date().toISOString(), version: current.version + 1 };
    replace(values, resolved); return resolved;
  }
  if (payment.status === "undoing") {
    const expense = await findPaymentExpense(payment.id); if (expense) await deleteBudgetTransaction(expense.id);
    const values = loadAll(); const current = values.find((value) => value.id === payment.id) ?? payment;
    const resolved = { ...current, status: "unpaid" as const, linkedExpenseId: null, paidAt: null, updatedAt: new Date().toISOString(), version: current.version + 1 };
    replace(values, resolved); return resolved;
  }
  if (payment.status === "paid" && !(await findPaymentExpense(payment.id))) {
    const values = loadAll(); const resolved = { ...payment, status: "unpaid" as const, linkedExpenseId: null, paidAt: null, updatedAt: new Date().toISOString(), version: payment.version + 1 };
    replace(values, resolved); return resolved;
  }
  return payment;
}

export async function getPayments(): Promise<Payment[]> {
  await queue.waitForIdle();
  const active = loadAll().filter((value) => !value.deletedAt); const reconciled: Payment[] = [];
  for (const payment of active) reconciled.push(await reconcileOne(payment));
  return reconciled;
}
export async function createPayment(input: PaymentInput): Promise<Payment> {
  return queue.run(async () => { try { const valid = await validate(input, "create"); const now = new Date().toISOString(); const value: Payment = { ...valid, id: `payment_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`, currencyCode: "NZD", status: "unpaid", linkedExpenseId: null, paidAt: null, createdAt: now, updatedAt: now, deletedAt: null, version: 1 }; saveAll([...loadAll(), value]); return value; } catch (cause) { if (cause instanceof DurableMutationError) throw cause; return fail("create", "write-failed", "Payment could not be saved.", cause); } });
}
export async function updatePayment(id: string, input: PaymentInput): Promise<Payment> {
  return queue.run(async () => { try { const valid = await validate(input, "update"); const values = loadAll(); const index = values.findIndex((value) => value.id === id && !value.deletedAt); if (index < 0) fail("update", "not-found", "That payment no longer exists."); const wasPaid = values[index].status === "paid" || values[index].status === "linking"; let value: Payment = { ...values[index], ...valid, status: wasPaid ? "linking" : "unpaid", updatedAt: new Date().toISOString(), version: values[index].version + 1 }; values[index] = value; saveAll(values); if (wasPaid) value = await reconcileOne(value); return value; } catch (cause) { if (cause instanceof DurableMutationError) throw cause; return fail("update", "write-failed", "Payment changes could not be saved.", cause); } });
}
export async function deletePayment(id: string): Promise<void> {
  return queue.run(async () => { try { const values = loadAll(); const index = values.findIndex((value) => value.id === id && !value.deletedAt); if (index < 0) return; if (values[index].status !== "unpaid") await undoPaidInternal(values[index]); const latest = loadAll(); const current = latest.find((value) => value.id === id); if (!current) return; const now = new Date().toISOString(); replace(latest, { ...current, deletedAt: now, updatedAt: now, version: current.version + 1 }); } catch (cause) { if (cause instanceof DurableMutationError) throw cause; return fail("delete", "write-failed", "Payment could not be deleted.", cause); } });
}
export async function markPaymentPaid(id: string): Promise<Payment> {
  return queue.run(async () => { try { const values = loadAll(); const index = values.findIndex((value) => value.id === id && !value.deletedAt); if (index < 0) fail("update", "not-found", "That payment no longer exists."); if (values[index].status === "paid" && await findPaymentExpense(id)) return values[index]; const pending: Payment = { ...values[index], status: "linking", paidAt: values[index].paidAt ?? new Date().toISOString(), updatedAt: new Date().toISOString(), version: values[index].version + 1 }; values[index] = pending; saveAll(values); return reconcileOne(pending); } catch (cause) { if (cause instanceof DurableMutationError) throw cause; return fail("update", "write-failed", "Paid state could not be saved safely. Retry to recover.", cause); } });
}
async function undoPaidInternal(payment: Payment): Promise<Payment> {
  const values = loadAll(); const current = values.find((value) => value.id === payment.id) ?? payment;
  const pending: Payment = { ...current, status: "undoing", updatedAt: new Date().toISOString(), version: current.version + 1 }; replace(values, pending); return reconcileOne(pending);
}
export async function undoPaymentPaid(id: string): Promise<Payment> {
  return queue.run(async () => { try { const payment = loadAll().find((value) => value.id === id && !value.deletedAt); if (!payment) fail("update", "not-found", "That payment no longer exists."); if (payment.status === "unpaid") return payment; return undoPaidInternal(payment); } catch (cause) { if (cause instanceof DurableMutationError) throw cause; return fail("update", "write-failed", "Undo could not be completed safely. Retry to recover.", cause); } });
}
