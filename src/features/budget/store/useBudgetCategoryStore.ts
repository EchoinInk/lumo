import { savedMutation, type DurableMutationResult } from "@/services/storage/durableMutation";
import { create } from "zustand";
import * as repository from "../services/budgetCategoryRepository";
import type { BudgetCategory, BudgetCategoryInput } from "../types/budgetCategory";

interface BudgetCategoryStore {
  categories: BudgetCategory[]; isHydrated: boolean; isLoading: boolean; error: string | null;
  hydrate: () => Promise<void>;
  createCategory: (input: BudgetCategoryInput) => Promise<DurableMutationResult<BudgetCategory>>;
  updateCategory: (id: string, input: BudgetCategoryInput) => Promise<DurableMutationResult<BudgetCategory>>;
  deleteCategory: (id: string) => Promise<DurableMutationResult<void>>;
  clearError: () => void;
}

export const useBudgetCategoryStore = create<BudgetCategoryStore>((set) => ({
  categories: [], isHydrated: false, isLoading: false, error: null,
  hydrate: async () => { set({ isLoading: true, error: null }); try { set({ categories: await repository.getBudgetCategories(), isHydrated: true, isLoading: false }); } catch (error) { set({ isHydrated: true, isLoading: false, error: "Budget data needs recovery before it can be used." }); throw error; } },
  createCategory: async (input) => { set({ error: null }); try { const category = await repository.createBudgetCategory(input); set((state) => ({ categories: [...state.categories, category] })); return savedMutation(category); } catch (error) { set({ error: "Could not save that budget category." }); throw error; } },
  updateCategory: async (id, input) => { set({ error: null }); try { const category = await repository.updateBudgetCategory(id, input); set((state) => ({ categories: state.categories.map((value) => value.id === id ? category : value) })); return savedMutation(category); } catch (error) { set({ error: "Could not save category changes." }); throw error; } },
  deleteCategory: async (id) => { set({ error: null }); try { await repository.deleteBudgetCategory(id); set((state) => ({ categories: state.categories.filter((value) => value.id !== id) })); return savedMutation(undefined); } catch (error) { set({ error: "Could not delete that category." }); throw error; } },
  clearError: () => set({ error: null }),
}));
