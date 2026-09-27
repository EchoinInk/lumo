import {
  planningParkingStorageDefinition,
  planningStorageDefinition,
} from "@/src/services/storage/domainSchemas";
import { loadVersionedData, saveVersionedData } from "@/src/services/storage/versionedStorage";
import type {
  DailyPlanningSummary,
  PlanningEnergyLevel,
  PlanningFlowMode,
  PlanningParkedItem,
  PlanningParkingState,
  PlanningSourceRef,
  PlanningSourceType,
} from "../types/planning";
import { isLocalDateKey, toLocalDateKey } from "@/src/utils/dateTime";

const VALID_ENERGY_LEVELS = new Set<PlanningEnergyLevel>([
  "low",
  "medium",
  "steady",
]);
const VALID_SOURCE_TYPES = new Set<PlanningSourceType>([
  "task",
  "reminder",
  "routine",
  "brainDump",
]);
const VALID_FLOW_MODES = new Set<PlanningFlowMode>(["morning", "evening"]);

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function sanitizeSourceRef(value: unknown): PlanningSourceRef | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Partial<PlanningSourceRef>;
  if (
    candidate.sourceType &&
    VALID_SOURCE_TYPES.has(candidate.sourceType) &&
    typeof candidate.sourceId === "string"
  ) {
    return {
      sourceType: candidate.sourceType,
      sourceId: candidate.sourceId,
    };
  }
  return undefined;
}

function parkedKey(ref: PlanningSourceRef): string {
  return `${ref.sourceType}:${ref.sourceId}`;
}

export function normalizeDailyPlanningSummary(
  summary: Partial<DailyPlanningSummary>,
): DailyPlanningSummary {
  const energyLevel =
    summary.energyLevel &&
    VALID_ENERGY_LEVELS.has(summary.energyLevel as PlanningEnergyLevel)
      ? summary.energyLevel
      : undefined;

  return {
    date: isLocalDateKey(summary.date) ? summary.date : toLocalDateKey(),
    selectedFocusIds: sanitizeStringArray(summary.selectedFocusIds),
    carryOverIds: sanitizeStringArray(summary.carryOverIds),
    brainDumpQueueIds: sanitizeStringArray(summary.brainDumpQueueIds),
    nextStepId:
      typeof summary.nextStepId === "string" ? summary.nextStepId : undefined,
    nextStepRef: sanitizeSourceRef(summary.nextStepRef),
    energyLevel,
    morningCompleted: summary.morningCompleted === true,
    eveningCompleted: summary.eveningCompleted === true,
    parkedIds: sanitizeStringArray(summary.parkedIds),
    eveningCarriedIds: sanitizeStringArray(summary.eveningCarriedIds),
    eveningParkedIds: sanitizeStringArray(summary.eveningParkedIds),
    eveningBrainDumpVisited: summary.eveningBrainDumpVisited === true,
  };
}

export function normalizePlanningParkingState(
  parking: Partial<PlanningParkingState>,
): PlanningParkingState {
  const deduped = new Map<string, PlanningParkedItem>();
  const items = Array.isArray(parking.parkedItems) ? parking.parkedItems : [];

  for (const item of items) {
    const ref = sanitizeSourceRef(item);
    if (!ref || typeof item?.parkedAt !== "string") continue;
    const parkedFrom =
      item.parkedFrom && VALID_FLOW_MODES.has(item.parkedFrom)
        ? item.parkedFrom
        : "morning";
    const normalized: PlanningParkedItem = {
      id: parkedKey(ref),
      sourceType: ref.sourceType,
      sourceId: ref.sourceId,
      parkedAt: item.parkedAt,
      parkedFrom,
      originalDueDate:
        typeof item.originalDueDate === "string" || item.originalDueDate === null
          ? item.originalDueDate
          : undefined,
    };
    deduped.set(normalized.id, normalized);
  }

  return { parkedItems: Array.from(deduped.values()) };
}

function legacyParkingFromSummary(
  summary: DailyPlanningSummary | null,
): PlanningParkingState {
  if (!summary) return createEmptyPlanningParkingState();
  const now = new Date().toISOString();
  const items = new Map<string, PlanningParkedItem>();
  for (const sourceId of summary.parkedIds) {
    const ref = { sourceType: "task" as const, sourceId };
    items.set(parkedKey(ref), {
      id: parkedKey(ref),
      ...ref,
      parkedAt: now,
      parkedFrom: "morning",
    });
  }
  for (const sourceId of summary.eveningParkedIds) {
    const ref = { sourceType: "task" as const, sourceId };
    items.set(parkedKey(ref), {
      id: parkedKey(ref),
      ...ref,
      parkedAt: now,
      parkedFrom: "evening",
    });
  }
  return { parkedItems: Array.from(items.values()) };
}

function mergeParkingState(
  current: PlanningParkingState,
  legacy: PlanningParkingState,
): PlanningParkingState {
  const items = new Map<string, PlanningParkedItem>();
  for (const item of current.parkedItems) items.set(item.id, item);
  for (const item of legacy.parkedItems) {
    if (!items.has(item.id)) items.set(item.id, item);
  }
  return { parkedItems: Array.from(items.values()) };
}

function loadStoredDailyPlanningSummary(): DailyPlanningSummary | null {
  const result = loadVersionedData(planningStorageDefinition);
  if (result.status === "empty") return null;
  return result.data;
}

export function loadDailyPlanningSummary(
  today = toLocalDateKey(),
): DailyPlanningSummary | null {
  const summary = loadStoredDailyPlanningSummary();
  if (!summary) return null;
  if (summary.date !== today) {
    return createEmptyDailySummary(today);
  }
  return summary;
}

export function persistDailyPlanningSummary(
  summary: DailyPlanningSummary,
): void {
  saveVersionedData(planningStorageDefinition, summary);
}

export function loadPlanningParkingState(): PlanningParkingState {
  const result = loadVersionedData(planningParkingStorageDefinition);
  return result.data;
}

export function persistPlanningParkingState(
  parking: PlanningParkingState,
): void {
  saveVersionedData(planningParkingStorageDefinition, parking);
}

export function createEmptyPlanningParkingState(): PlanningParkingState {
  return { parkedItems: [] };
}

export function loadPlanningState(today = toLocalDateKey()): {
  summary: DailyPlanningSummary;
  parking: PlanningParkingState;
} {
  const storedSummary = loadStoredDailyPlanningSummary();
  const summary =
    storedSummary?.date === today
      ? storedSummary
      : createEmptyDailySummary(today);
  const currentParking = loadPlanningParkingState();
  const legacyParking = legacyParkingFromSummary(storedSummary);
  const parking = mergeParkingState(currentParking, legacyParking);

  if (parking.parkedItems.length !== currentParking.parkedItems.length) {
    persistPlanningParkingState(parking);
  }

  return { summary, parking };
}

export function createEmptyDailySummary(
  today = toLocalDateKey(),
): DailyPlanningSummary {
  return normalizeDailyPlanningSummary({ date: today });
}

export function planningSourceKey(ref: PlanningSourceRef): string {
  return parkedKey(ref);
}
