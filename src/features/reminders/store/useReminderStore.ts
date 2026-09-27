import { create } from "zustand";
import {
  defaultReminderSettings,
  loadReminders,
  loadReminderSettings,
  persistReminders,
  persistReminderSettings,
} from "../services/reminderStorage";
import type { CreateReminderInput, Reminder } from "../types/reminder";

type ReminderState = {
  reminders: Reminder[];
  settings: ReturnType<typeof loadReminderSettings>;
  hasHydrated: boolean;
  hydrationError: string | null;
};

type ReminderActions = {
  hydrate: () => void;
  addReminder: (input: CreateReminderInput) => Reminder | null;
  archiveReminder: (id: string) => void;
  updateSettings: (
    settings: Partial<ReturnType<typeof loadReminderSettings>>,
  ) => void;
};

function createId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useReminderStore = create<ReminderState & ReminderActions>(
  (set, get) => ({
    reminders: [],
    settings: defaultReminderSettings,
    hasHydrated: false,
    hydrationError: null,

    hydrate: () => {
      try {
        set({
          reminders: loadReminders(),
          settings: loadReminderSettings(),
          hasHydrated: true,
          hydrationError: null,
        });
      } catch (error) {
        set({ hasHydrated: true, hydrationError: "Reminder data needs recovery." });
        throw error;
      }
    },

    addReminder: (input) => {
      const title = input.title.trim();
      if (!title) return null;

      if (input.sourceBrainDumpId) {
        const existing = get().reminders.find(
          (reminder) =>
            !reminder.archivedAt &&
            reminder.sourceBrainDumpId === input.sourceBrainDumpId,
        );
        if (existing) return existing;
      }

      const now = new Date().toISOString();
      const reminder: Reminder = {
        id: createId(),
        title,
        scheduledAt: input.scheduledAt,
        tone: input.tone ?? get().settings.tone,
        createdAt: now,
        updatedAt: now,
        sourceBrainDumpId: input.sourceBrainDumpId,
      };

      const reminders = [reminder, ...get().reminders];
      persistReminders(reminders);
      set({ reminders });
      return reminder;
    },

    archiveReminder: (id) => {
      const now = new Date().toISOString();
      const reminders = get().reminders.map((reminder) =>
        reminder.id === id
          ? { ...reminder, archivedAt: now, updatedAt: now }
          : reminder,
      );
      set({ reminders });
      persistReminders(reminders);
    },

    updateSettings: (settings) => {
      const next = { ...get().settings, ...settings };
      set({ settings: next });
      persistReminderSettings(next);
    },
  }),
);
