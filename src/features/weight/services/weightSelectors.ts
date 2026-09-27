import type { WeightEntry } from "../types/weight";
export function weightHistory(entries: WeightEntry[]): WeightEntry[] { return entries.filter((entry) => !entry.deletedAt).slice().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)); }
export function latestWeight(entries: WeightEntry[]): WeightEntry | null { return weightHistory(entries)[0] ?? null; }
export function weightChangeGrams(entries: WeightEntry[]): number | null { const history = weightHistory(entries); return history.length > 1 ? history[0].grams - history[1].grams : null; }
