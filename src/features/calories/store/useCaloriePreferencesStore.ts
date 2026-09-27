import { savedMutation, type DurableMutationResult } from "@/services/storage/durableMutation";
import { create } from "zustand";
import * as repository from "../services/caloriePreferencesRepository";
import type { CaloriePreferences } from "../types/caloriePreferences";
interface Store { preferences: CaloriePreferences; isHydrated: boolean; isLoading: boolean; isSaving: boolean; error: string | null; hydrate: () => Promise<void>; setGoal: (goal: number | null) => Promise<DurableMutationResult<CaloriePreferences>>; clearError: () => void; }
const empty: CaloriePreferences = { dailyGoalKcal: null, updatedAt: null, version: 0 };
export const useCaloriePreferencesStore = create<Store>((set) => ({ preferences: empty, isHydrated: false, isLoading: false, isSaving: false, error: null,
  hydrate: async () => { set({ isLoading: true, error: null }); try { set({ preferences: await repository.getCaloriePreferences(), isHydrated: true, isLoading: false }); } catch (error) { set({ isHydrated: true, isLoading: false, error: "Calorie preferences need recovery before they can be used." }); throw error; } },
  setGoal: async (goal) => { set({ isSaving: true, error: null }); try { const value = await repository.saveCalorieGoal(goal); set({ preferences: value, isSaving: false }); return savedMutation(value); } catch (error) { set({ isSaving: false, error: "Could not save the calorie goal." }); throw error; } },
  clearError: () => set({ error: null }),
}));
