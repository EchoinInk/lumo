import { planningStorageDefinition } from "@/src/services/storage/domainSchemas";
import { loadVersionedData, saveVersionedData } from "@/src/services/storage/versionedStorage";
import type { DailyPlanningSummary, PlanningEnergyLevel } from "../types/planning";
import { isLocalDateKey, toLocalDateKey } from "@/src/utils/dateTime";

const VALID_ENERGY_LEVELS = new Set<PlanningEnergyLevel>([
  "low",
  "medium",
  "steady",
]);

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
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
    energyLevel,
    morningCompleted: summary.morningCompleted === true,
    eveningCompleted: summary.eveningCompleted === true,
    parkedIds: sanitizeStringArray(summary.parkedIds),
    eveningCarriedIds: sanitizeStringArray(summary.eveningCarriedIds),
    eveningParkedIds: sanitizeStringArray(summary.eveningParkedIds),
    eveningBrainDumpVisited: summary.eveningBrainDumpVisited === true,
  };
}

export function loadDailyPlanningSummary(
  today = toLocalDateKey(),
): DailyPlanningSummary | null {
  const result = loadVersionedData(planningStorageDefinition);
  if (result.status === "empty") return null;
  if (result.data.date !== today) {
    return createEmptyDailySummary(today);
  }
  return result.data;
}

export function persistDailyPlanningSummary(
  summary: DailyPlanningSummary,
): void {
  saveVersionedData(planningStorageDefinition, summary);
}

export function createEmptyDailySummary(
  today = toLocalDateKey(),
): DailyPlanningSummary {
  return normalizeDailyPlanningSummary({ date: today });
}
