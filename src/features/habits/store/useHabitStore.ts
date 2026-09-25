import {
  savedMutation,
  type DurableMutationResult,
} from "@/services/storage/durableMutation";
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
  addHabit: (input: CreateHabitInput) => Promise<DurableMutationResult<Habit>>;
  updateHabit: (
    id: string,
    updates: UpdateHabitInput,
  ) => Promise<DurableMutationResult<Habit>>;
  deleteHabit: (id: string) => Promise<DurableMutationResult<void>>;
  completeHabit: (
    id: string,
    date: string,
  ) => Promise<DurableMutationResult<Habit>>;
  uncompleteHabit: (
    id: string,
    date: string,
  ) => Promise<DurableMutationResult<Habit>>;
  clearError: () => void;
}

type HabitStore = HabitState & HabitActions;
const completionMutations = new Map<
  string,
  Promise<DurableMutationResult<Habit>>
>();

export const useHabitStore = create<HabitStore>((set) => ({
  habits: [],
  isHydrated: false,
  isLoading: false,
  error: null,

  hydrate: async () => {
    set({ isLoading: true, error: null });
    try {
      const habits = await habitLocalRepository.getHabits();
      set({ habits, isHydrated: true, isLoading: false });
    } catch (error) {
      set({
        error: "Habits need recovery before they can be used.",
        isHydrated: true,
        isLoading: false,
      });
      throw error;
    }
  },

  addHabit: async (input) => {
    set({ error: null });
    try {
      const habit = await habitLocalRepository.createHabit(input);
      set((state) => ({ habits: [...state.habits, habit] }));
      return savedMutation(habit);
    } catch (error) {
      set({ error: "Could not add your habit. Please try again." });
      throw error;
    }
  },

  updateHabit: async (id, updates) => {
    set({ error: null });
    try {
      const habit = await habitLocalRepository.updateHabit(id, updates);
      set((state) => ({
        habits: state.habits.map((item) => (item.id === id ? habit : item)),
      }));
      return savedMutation(habit);
    } catch (error) {
      set({ error: "Could not update your habit. Please try again." });
      throw error;
    }
  },

  deleteHabit: async (id) => {
    set({ error: null });
    try {
      await habitLocalRepository.deleteHabit(id);
      set((state) => ({
        habits: state.habits.filter((habit) => habit.id !== id),
      }));
      return savedMutation(undefined);
    } catch (error) {
      set({ error: "Could not delete your habit. Please try again." });
      throw error;
    }
  },

  completeHabit: (id, date) => {
    const key = `${id}:${date}`;
    const existing = completionMutations.get(key);
    if (existing) return existing;

    set({ error: null });
    const mutation = habitLocalRepository
      .completeHabit(id, date)
      .then((habit) => {
        set((state) => ({
          habits: state.habits.map((item) => (item.id === id ? habit : item)),
        }));
        return savedMutation(habit);
      })
      .catch((error) => {
        set({ error: "Could not mark habit complete. Please try again." });
        throw error;
      })
      .finally(() => completionMutations.delete(key));
    completionMutations.set(key, mutation);
    return mutation;
  },

  uncompleteHabit: (id, date) => {
    const key = `${id}:${date}`;
    const existing = completionMutations.get(key);
    if (existing) return existing;

    set({ error: null });
    const mutation = habitLocalRepository
      .uncompleteHabit(id, date)
      .then((habit) => {
        set((state) => ({
          habits: state.habits.map((item) => (item.id === id ? habit : item)),
        }));
        return savedMutation(habit);
      })
      .catch((error) => {
        set({ error: "Could not update habit. Please try again." });
        throw error;
      })
      .finally(() => completionMutations.delete(key));
    completionMutations.set(key, mutation);
    return mutation;
  },

  clearError: () => set({ error: null }),
}));
