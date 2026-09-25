import { create } from "zustand";
import * as habitLocalRepository from "../services/habitLocalRepository";
import { CreateHabitInput, Habit, UpdateHabitInput } from "../types/habit";

interface HabitState {
  habits: Habit[];
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface HabitActions {
  hydrate: () => Promise<void>;
  addHabit: (input: CreateHabitInput) => Promise<void>;
  updateHabit: (id: string, updates: UpdateHabitInput) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  completeHabit: (id: string, date: string) => Promise<void>;
  uncompleteHabit: (id: string, date: string) => Promise<void>;
  clearError: () => void;
}

type HabitStore = HabitState & HabitActions;

const initialState: HabitState = {
  habits: [],
  isHydrated: false,
  isLoading: false,
  error: null,
};

export const useHabitStore = create<HabitStore>((set) => ({
  ...initialState,

  hydrate: async () => {
    set({ isLoading: true, error: null });
    try {
      const habits = await habitLocalRepository.getHabits();
      set({ habits, isHydrated: true, isLoading: false });
    } catch (error) {
      console.error("[useHabitStore] Hydration failed:", error);
      set({
        error: "Habits need recovery before they can be used.",
        isHydrated: true,
        isLoading: false,
      });
      throw error;
    }
  },

  addHabit: async (input: CreateHabitInput) => {
    set({ isLoading: true, error: null });
    try {
      const newHabit = await habitLocalRepository.createHabit(input);
      set((state) => ({
        habits: [...state.habits, newHabit],
        isLoading: false,
      }));
    } catch (error) {
      console.error("[useHabitStore] Failed to add habit:", error);
      set({
        error: "Could not add your habit. Please try again.",
        isLoading: false,
      });
    }
  },

  updateHabit: async (id: string, updates: UpdateHabitInput) => {
    set({ isLoading: true, error: null });
    try {
      const updatedHabit = await habitLocalRepository.updateHabit(id, updates);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? updatedHabit : h)),
        isLoading: false,
      }));
    } catch (error) {
      console.error(`[useHabitStore] Failed to update habit ${id}:`, error);
      set({
        error: "Could not update your habit. Please try again.",
        isLoading: false,
      });
    }
  },

  deleteHabit: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await habitLocalRepository.deleteHabit(id);
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      console.error(`[useHabitStore] Failed to delete habit ${id}:`, error);
      set({
        error: "Could not delete your habit. Please try again.",
        isLoading: false,
      });
    }
  },

  completeHabit: async (id: string, date: string) => {
    set({ error: null });
    try {
      const updatedHabit = await habitLocalRepository.completeHabit(id, date);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? updatedHabit : h)),
      }));
    } catch (error) {
      console.error(`[useHabitStore] Failed to complete habit ${id}:`, error);
      set({ error: "Could not mark habit complete. Please try again." });
    }
  },

  uncompleteHabit: async (id: string, date: string) => {
    set({ error: null });
    try {
      const updatedHabit = await habitLocalRepository.uncompleteHabit(id, date);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? updatedHabit : h)),
      }));
    } catch (error) {
      console.error(`[useHabitStore] Failed to uncomplete habit ${id}:`, error);
      set({ error: "Could not update habit. Please try again." });
    }
  },

  clearError: () => set({ error: null }),
}));
