import { brainDumpStorageDefinition } from "@/src/services/storage/domainSchemas";
import { loadVersionedData, saveVersionedData } from "@/src/services/storage/versionedStorage";
import type {
  BrainDumpConversionTarget,
  BrainDumpEntry,
  BrainDumpStatus,
} from "../types/brainDump";

const VALID_STATUSES = new Set<BrainDumpStatus>([
  "open",
  "converted",
  "archived",
]);

const VALID_TARGETS = new Set<BrainDumpConversionTarget>([
  "task",
  "reminder",
  "routine_idea",
  "archived_note",
]);

function isIsoString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function sanitizeBrainDumpEntry(raw: unknown): BrainDumpEntry | null {
  if (!raw || typeof raw !== "object") return null;

  const entry = raw as Partial<BrainDumpEntry>;
  const text = typeof entry.text === "string" ? entry.text.trim() : "";
  if (!text || !isIsoString(entry.id)) return null;

  const status = VALID_STATUSES.has(entry.status as BrainDumpStatus)
    ? (entry.status as BrainDumpStatus)
    : "open";

  const convertedTo =
    entry.convertedTo && VALID_TARGETS.has(entry.convertedTo)
      ? entry.convertedTo
      : undefined;

  const now = new Date().toISOString();

  return {
    id: entry.id,
    text,
    status,
    createdAt: isIsoString(entry.createdAt) ? entry.createdAt : now,
    updatedAt: isIsoString(entry.updatedAt) ? entry.updatedAt : now,
    convertedAt: isIsoString(entry.convertedAt) ? entry.convertedAt : undefined,
    convertedTo,
    linkedEntityId: isIsoString(entry.linkedEntityId)
      ? entry.linkedEntityId
      : undefined,
    conversionId: isIsoString(entry.conversionId) ? entry.conversionId : undefined,
    pendingConversionTarget:
      entry.pendingConversionTarget && VALID_TARGETS.has(entry.pendingConversionTarget)
        ? entry.pendingConversionTarget
        : undefined,
  };
}

export function sanitizeBrainDumpEntries(raw: unknown): BrainDumpEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => sanitizeBrainDumpEntry(entry))
    .filter((entry): entry is BrainDumpEntry => entry !== null);
}

export function loadBrainDumpEntries(): BrainDumpEntry[] {
  return loadVersionedData(brainDumpStorageDefinition).data;
}

export function persistBrainDumpEntries(entries: BrainDumpEntry[]): void {
  saveVersionedData(brainDumpStorageDefinition, entries);
}
