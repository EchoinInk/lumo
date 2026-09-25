import { create } from "zustand";
import type { LocalDateKey } from "@/src/utils/dateTime";
import {
  createEmptyDailySummary,
  createEmptyPlanningParkingState,
  loadPlanningState,
  persistDailyPlanningSummary,
  persistPlanningParkingState,
  planningSourceKey,
} from "../services/planningStorage";
import type {
  DailyPlanningSummary,
  PlanningFlowMode,
  PlanningParkedItem,
  PlanningParkingState,
  PlanningSourceRef,
} from "../types/planning";

type PlanningState = {
  summary: DailyPlanningSummary;
  parking: PlanningParkingState;
  hasHydrated: boolean;
  hydrationError: string | null;
};

type ParkOptions = {
  parkedFrom: PlanningFlowMode;
  originalDueDate?: string;
};

type PlanningActions = {
  hydratePlanning: (today: LocalDateKey) => void;
  updateSummary: (
    updater: (summary: DailyPlanningSummary) => DailyPlanningSummary,
  ) => void;
  parkSource: (ref: PlanningSourceRef, options: ParkOptions) => PlanningParkedItem;
  unparkSource: (ref: PlanningSourceRef) => void;
  removeParkedSource: (ref: PlanningSourceRef) => void;
};

type PlanningStore = PlanningState & PlanningActions;

function sameSource(a: PlanningSourceRef, b: PlanningSourceRef): boolean {
  return a.sourceType === b.sourceType && a.sourceId === b.sourceId;
}

function withoutSource(
  parking: PlanningParkingState,
  ref: PlanningSourceRef,
): PlanningParkingState {
  return {
    parkedItems: parking.parkedItems.filter((item) => !sameSource(item, ref)),
  };
}

export const usePlanningStore = create<PlanningStore>((set, get) => ({
  summary: createEmptyDailySummary(),
  parking: createEmptyPlanningParkingState(),
  hasHydrated: false,
  hydrationError: null,

  hydratePlanning: (today) => {
    const state = get();
    if (state.hasHydrated && state.summary.date === today) return;

    try {
      const next = loadPlanningState(today);
      set({
        summary: next.summary,
        parking: next.parking,
        hasHydrated: true,
        hydrationError: null,
      });
    } catch (error) {
      set({
        hasHydrated: true,
        hydrationError: "Daily planning needs recovery before it can be used.",
      });
      throw error;
    }
  },

  updateSummary: (updater) => {
    set((state) => {
      const next = updater(state.summary);
      persistDailyPlanningSummary(next);
      return { summary: next };
    });
  },

  parkSource: (ref, options) => {
    const parkedAt = new Date().toISOString();
    const item: PlanningParkedItem = {
      id: planningSourceKey(ref),
      sourceType: ref.sourceType,
      sourceId: ref.sourceId,
      parkedAt,
      parkedFrom: options.parkedFrom,
      originalDueDate: options.originalDueDate,
    };

    set((state) => {
      const parking = {
        parkedItems: [
          item,
          ...withoutSource(state.parking, ref).parkedItems,
        ],
      };
      persistPlanningParkingState(parking);
      return { parking };
    });

    return item;
  },

  unparkSource: (ref) => {
    set((state) => {
      const parking = withoutSource(state.parking, ref);
      persistPlanningParkingState(parking);
      return { parking };
    });
  },

  removeParkedSource: (ref) => {
    get().unparkSource(ref);
  },
}));
