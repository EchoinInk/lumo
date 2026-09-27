import { savedMutation, type DurableMutationResult } from "@/services/storage/durableMutation";
import { create } from "zustand";
import * as repository from "../services/budgetTransactionRepository";
import type { BudgetTransaction, BudgetTransactionInput } from "../types/budgetTransaction";

interface Store { transactions: BudgetTransaction[]; isHydrated: boolean; isLoading: boolean; isSaving: boolean; error: string | null; hydrate: () => Promise<void>; refresh: () => Promise<void>; createTransaction: (input: BudgetTransactionInput) => Promise<DurableMutationResult<BudgetTransaction>>; updateTransaction: (id: string, input: BudgetTransactionInput) => Promise<DurableMutationResult<BudgetTransaction>>; deleteTransaction: (id: string) => Promise<DurableMutationResult<void>>; clearError: () => void; }
export const useBudgetTransactionStore = create<Store>((set) => ({
  transactions: [], isHydrated: false, isLoading: false, isSaving: false, error: null,
  hydrate: async () => { set({ isLoading: true, error: null }); try { set({ transactions: await repository.getBudgetTransactions(), isHydrated: true, isLoading: false }); } catch (error) { set({ isHydrated: true, isLoading: false, error: "Transaction data needs recovery before it can be used." }); throw error; } },
  refresh: async () => set({ transactions: await repository.getBudgetTransactions() }),
  createTransaction: async (input) => { set({ isSaving: true, error: null }); try { const value = await repository.createBudgetTransaction(input); set((state) => ({ transactions: [...state.transactions, value], isSaving: false })); return savedMutation(value); } catch (error) { set({ isSaving: false, error: "Could not save that transaction." }); throw error; } },
  updateTransaction: async (id, input) => { set({ isSaving: true, error: null }); try { const value = await repository.updateBudgetTransaction(id, input); set((state) => ({ transactions: state.transactions.map((item) => item.id === id ? value : item), isSaving: false })); return savedMutation(value); } catch (error) { set({ isSaving: false, error: "Could not save transaction changes." }); throw error; } },
  deleteTransaction: async (id) => { set({ isSaving: true, error: null }); try { await repository.deleteBudgetTransaction(id); set((state) => ({ transactions: state.transactions.filter((item) => item.id !== id), isSaving: false })); return savedMutation(undefined); } catch (error) { set({ isSaving: false, error: "Could not delete that transaction." }); throw error; } },
  clearError: () => set({ error: null }),
}));
