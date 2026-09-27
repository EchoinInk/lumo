import { savedMutation, type DurableMutationResult } from "@/services/storage/durableMutation";
import { useBudgetTransactionStore } from "@/features/budget/store/useBudgetTransactionStore";
import { create } from "zustand";
import * as repository from "../services/paymentRepository";
import type { Payment, PaymentInput } from "../types/payment";
interface Store { payments: Payment[]; isHydrated: boolean; isLoading: boolean; isSaving: boolean; error: string | null; hydrate: () => Promise<void>; createPayment: (input: PaymentInput) => Promise<DurableMutationResult<Payment>>; updatePayment: (id: string, input: PaymentInput) => Promise<DurableMutationResult<Payment>>; deletePayment: (id: string) => Promise<DurableMutationResult<void>>; markPaid: (id: string) => Promise<DurableMutationResult<Payment>>; undoPaid: (id: string) => Promise<DurableMutationResult<Payment>>; clearError: () => void; }
export const usePaymentStore = create<Store>((set) => {
  const mutation = async (work: () => Promise<Payment>) => { set({ isSaving: true, error: null }); try { const value = await work(); set((state) => ({ payments: state.payments.map((item) => item.id === value.id ? value : item), isSaving: false })); await useBudgetTransactionStore.getState().refresh(); return savedMutation(value); } catch (error) { set({ isSaving: false, error: "Could not save that payment. Retry to safely finish the operation." }); throw error; } };
  return { payments: [], isHydrated: false, isLoading: false, isSaving: false, error: null,
    hydrate: async () => { set({ isLoading: true, error: null }); try { set({ payments: await repository.getPayments(), isHydrated: true, isLoading: false }); await useBudgetTransactionStore.getState().refresh(); } catch (error) { set({ isHydrated: true, isLoading: false, error: "Payment data needs recovery before it can be used." }); throw error; } },
    createPayment: async (input) => { set({ isSaving: true, error: null }); try { const value = await repository.createPayment(input); set((state) => ({ payments: [...state.payments, value], isSaving: false })); return savedMutation(value); } catch (error) { set({ isSaving: false, error: "Could not save that payment." }); throw error; } },
    updatePayment: (id, input) => mutation(() => repository.updatePayment(id, input)), deletePayment: async (id) => { set({ isSaving: true, error: null }); try { await repository.deletePayment(id); set((state) => ({ payments: state.payments.filter((item) => item.id !== id), isSaving: false })); await useBudgetTransactionStore.getState().refresh(); return savedMutation(undefined); } catch (error) { set({ isSaving: false, error: "Could not delete that payment." }); throw error; } },
    markPaid: (id) => mutation(() => repository.markPaymentPaid(id)), undoPaid: (id) => mutation(() => repository.undoPaymentPaid(id)), clearError: () => set({ error: null }),
  };
});
