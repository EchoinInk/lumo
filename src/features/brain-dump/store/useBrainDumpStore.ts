import { create } from "zustand";
import {
  loadBrainDumpEntries,
  persistBrainDumpEntries,
} from "../services/brainDumpStorage";
import type {
  BrainDumpConversionTarget,
  BrainDumpEntry,
  BrainDumpStatus,
  CreateBrainDumpInput,
} from "../types/brainDump";

type BrainDumpState = {
  entries: BrainDumpEntry[];
  hasHydrated: boolean;
  hydrationError: string | null;
};

type BrainDumpActions = {
  hydrate: () => void;
  addEntry: (input: CreateBrainDumpInput) => BrainDumpEntry | null;
  convertEntry: (
    id: string,
    target: BrainDumpConversionTarget,
    linkedEntityId?: string,
  ) => void;
  archiveEntry: (id: string) => void;
  restoreEntry: (id: string) => void;
  deleteEntry: (id: string) => void;
  clearConverted: () => void;
};

type BrainDumpStore = BrainDumpState & BrainDumpActions;

function createId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function persist(entries: BrainDumpEntry[]): void {
  persistBrainDumpEntries(entries);
}

export const useBrainDumpStore = create<BrainDumpStore>((set, get) => ({
  entries: [],
  hasHydrated: false,
  hydrationError: null,

  hydrate: () => {
    try {
      set({ entries: loadBrainDumpEntries(), hasHydrated: true, hydrationError: null });
    } catch (error) {
      set({ hasHydrated: true, hydrationError: "Brain dump data needs recovery." });
      throw error;
    }
  },

  addEntry: (input) => {
    const text = input.text.trim();
    if (!text) return null;

    const now = new Date().toISOString();
    const entry: BrainDumpEntry = {
      id: createId(),
      text,
      status: "open",
      createdAt: now,
      updatedAt: now,
    };

    const entries = [entry, ...get().entries];
    set({ entries });
    persist(entries);
    return entry;
  },

  convertEntry: (id, target, linkedEntityId) => {
    const entry = get().entries.find((item) => item.id === id);
    if (!entry || entry.status !== "open") return;

    const now = new Date().toISOString();
    const status: BrainDumpStatus =
      target === "archived_note" ? "archived" : "converted";
    const entries = get().entries.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            status,
            convertedAt: now,
            convertedTo: target,
            linkedEntityId,
            updatedAt: now,
          }
        : entry,
    );
    set({ entries });
    persist(entries);
  },

  archiveEntry: (id) => {
    get().convertEntry(id, "archived_note");
  },

  restoreEntry: (id) => {
    const entry = get().entries.find((item) => item.id === id);
    if (!entry || entry.status === "open") return;

    const now = new Date().toISOString();
    const entries = get().entries.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            status: "open" as const,
            convertedAt: undefined,
            convertedTo: undefined,
            linkedEntityId: undefined,
            updatedAt: now,
          }
        : entry,
    );
    set({ entries });
    persist(entries);
  },

  deleteEntry: (id) => {
    const entries = get().entries.filter((entry) => entry.id !== id);
    set({ entries });
    persist(entries);
  },

  clearConverted: () => {
    const entries = get().entries.filter((entry) => entry.status === "open");
    set({ entries });
    persist(entries);
  },
}));
