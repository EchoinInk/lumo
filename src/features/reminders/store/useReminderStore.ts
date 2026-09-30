import { savedMutation, type DurableMutationResult } from "@/src/services/storage/durableMutation";
import { create } from "zustand";
import { defaultReminderSettings, loadReminderSettings, persistReminderSettings } from "../services/reminderStorage";
import * as repository from "../services/reminderRepository";
import type { CreateReminderInput, Reminder, ReminderSettings, UpdateReminderInput } from "../types/reminder";

type ReminderState = { reminders: Reminder[]; settings: ReminderSettings; hasHydrated: boolean; isLoading: boolean; isSaving: boolean; hydrationError: string | null; error: string | null };
type ReminderActions = {
  hydrate: () => Promise<void>;
  addReminder: (input: CreateReminderInput) => Promise<DurableMutationResult<Reminder>>;
  updateReminder: (id: string, input: UpdateReminderInput) => Promise<DurableMutationResult<Reminder>>;
  setCompleted: (id: string, completed: boolean) => Promise<DurableMutationResult<Reminder>>;
  deleteReminder: (id: string) => Promise<DurableMutationResult<void>>;
  archiveReminder: (id: string) => Promise<DurableMutationResult<void>>;
  updateSettings: (settings: Partial<ReminderSettings>) => Promise<DurableMutationResult<ReminderSettings>>;
  clearError: () => void;
};

export const useReminderStore = create<ReminderState & ReminderActions>((set, get) => ({
  reminders: [], settings: defaultReminderSettings, hasHydrated: false, isLoading: false, isSaving: false, hydrationError: null, error: null,
  hydrate: async () => {
    set({ isLoading: true, hydrationError: null });
    try {
      set({ reminders: await repository.getReminders(), settings: loadReminderSettings(), hasHydrated: true, isLoading: false });
    } catch (error) {
      set({ hasHydrated: true, isLoading: false, hydrationError: "Reminder data needs recovery." });
      throw error;
    }
  },
  addReminder: async (input) => {
    set({ isSaving: true, error: null });
    try {
      const reminder = await repository.createReminder({ ...input, tone: input.tone ?? get().settings.tone });
      set((state) => ({ reminders: state.reminders.some((value) => value.id === reminder.id) ? state.reminders : [reminder, ...state.reminders], isSaving: false }));
      return savedMutation(reminder);
    } catch (error) {
      set({ isSaving: false, error: error instanceof Error ? error.message : "Could not save that reminder." });
      throw error;
    }
  },
  updateReminder: async (id, input) => {
    set({ isSaving: true, error: null });
    try {
      const reminder = await repository.updateReminder(id, input);
      set((state) => ({ reminders: state.reminders.map((value) => value.id === id ? reminder : value), isSaving: false }));
      return savedMutation(reminder);
    } catch (error) {
      set({ isSaving: false, error: error instanceof Error ? error.message : "Could not save your reminder changes." });
      throw error;
    }
  },
  setCompleted: async (id, completed) => {
    set({ isSaving: true, error: null });
    try {
      const reminder = await repository.setReminderCompleted(id, completed);
      set((state) => ({ reminders: state.reminders.map((value) => value.id === id ? reminder : value), isSaving: false }));
      return savedMutation(reminder);
    } catch (error) {
      set({ isSaving: false, error: error instanceof Error ? error.message : "Could not save reminder completion." });
      throw error;
    }
  },
  deleteReminder: async (id) => {
    set({ isSaving: true, error: null });
    try {
      await repository.deleteReminder(id);
      set((state) => ({ reminders: state.reminders.filter((value) => value.id !== id), isSaving: false }));
      return savedMutation(undefined);
    } catch (error) {
      set({ isSaving: false, error: error instanceof Error ? error.message : "Could not delete that reminder." });
      throw error;
    }
  },
  archiveReminder: (id) => get().deleteReminder(id),
  updateSettings: async (updates) => {
    set({ isSaving: true, error: null });
    try {
      const next = { ...get().settings, ...updates };
      persistReminderSettings(next);
      set({ settings: next, isSaving: false });
      return savedMutation(next);
    } catch (error) {
      set({ isSaving: false, error: "Could not save reminder settings." });
      throw error;
    }
  },
  clearError: () => set({ error: null }),
}));
