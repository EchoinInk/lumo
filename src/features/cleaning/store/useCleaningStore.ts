import { savedMutation, type DurableMutationResult } from "@/services/storage/durableMutation";
import { create } from "zustand";
import * as repository from "../services/cleaningLocalRepository";
import type { CleaningItem, CleaningItemInput } from "../types/cleaning";

interface CleaningStore {
  items: CleaningItem[];
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  createItem: (input: CleaningItemInput) => Promise<DurableMutationResult<CleaningItem>>;
  updateItem: (id: string, input: CleaningItemInput) => Promise<DurableMutationResult<CleaningItem>>;
  deleteItem: (id: string) => Promise<DurableMutationResult<void>>;
  setCompletion: (id: string, date: string, complete: boolean) => Promise<DurableMutationResult<CleaningItem>>;
  clearError: () => void;
}

export const useCleaningStore = create<CleaningStore>((set) => ({
  items: [],
  isHydrated: false,
  isLoading: false,
  error: null,
  hydrate: async () => {
    set({ isLoading: true, error: null });
    try {
      set({ items: await repository.getCleaningItems(), isHydrated: true, isLoading: false });
    } catch (error) {
      set({ isHydrated: true, isLoading: false, error: "Cleaning data needs recovery before it can be used." });
      throw error;
    }
  },
  createItem: async (input) => {
    set({ error: null });
    try {
      const item = await repository.createCleaningItem(input);
      set((state) => ({ items: [...state.items, item] }));
      return savedMutation(item);
    } catch (error) {
      set({ error: "Could not save that cleaning item. Please try again." });
      throw error;
    }
  },
  updateItem: async (id, input) => {
    set({ error: null });
    try {
      const item = await repository.updateCleaningItem(id, input);
      set((state) => ({ items: state.items.map((value) => value.id === id ? item : value) }));
      return savedMutation(item);
    } catch (error) {
      set({ error: "Could not save your cleaning changes. Please try again." });
      throw error;
    }
  },
  deleteItem: async (id) => {
    set({ error: null });
    try {
      await repository.deleteCleaningItem(id);
      set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
      return savedMutation(undefined);
    } catch (error) {
      set({ error: "Could not delete that cleaning item. Please try again." });
      throw error;
    }
  },
  setCompletion: async (id, date, complete) => {
    set({ error: null });
    try {
      const item = await repository.setCleaningCompletion(id, date, complete);
      set((state) => ({ items: state.items.map((value) => value.id === id ? item : value) }));
      return savedMutation(item);
    } catch (error) {
      set({ error: "Could not save that completion. Please try again." });
      throw error;
    }
  },
  clearError: () => set({ error: null }),
}));
