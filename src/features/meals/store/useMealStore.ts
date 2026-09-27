import { savedMutation, type DurableMutationResult } from "@/services/storage/durableMutation";
import { create } from "zustand";
import * as repository from "../services/mealLocalRepository";
import type { MealEntry, MealEntryInput } from "../types/meal";

interface MealStore {
  meals: MealEntry[];
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  createMeal: (input: MealEntryInput) => Promise<DurableMutationResult<MealEntry>>;
  updateMeal: (id: string, input: MealEntryInput) => Promise<DurableMutationResult<MealEntry>>;
  deleteMeal: (id: string) => Promise<DurableMutationResult<void>>;
  clearError: () => void;
}

export const useMealStore = create<MealStore>((set) => ({
  meals: [], isHydrated: false, isLoading: false, error: null,
  hydrate: async () => { set({ isLoading: true, error: null }); try { set({ meals: await repository.getMeals(), isHydrated: true, isLoading: false }); } catch (error) { set({ isHydrated: true, isLoading: false, error: "Meal data needs recovery before it can be used." }); throw error; } },
  createMeal: async (input) => { set({ error: null }); try { const meal = await repository.createMeal(input); set((state) => ({ meals: [...state.meals, meal] })); return savedMutation(meal); } catch (error) { set({ error: "Could not save that meal. Please try again." }); throw error; } },
  updateMeal: async (id, input) => { set({ error: null }); try { const meal = await repository.updateMeal(id, input); set((state) => ({ meals: state.meals.map((value) => value.id === id ? meal : value) })); return savedMutation(meal); } catch (error) { set({ error: "Could not save your meal changes. Please try again." }); throw error; } },
  deleteMeal: async (id) => { set({ error: null }); try { await repository.deleteMeal(id); set((state) => ({ meals: state.meals.filter((meal) => meal.id !== id) })); return savedMutation(undefined); } catch (error) { set({ error: "Could not delete that meal. Please try again." }); throw error; } },
  clearError: () => set({ error: null }),
}));
