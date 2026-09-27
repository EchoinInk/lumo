import type { WeightUnit } from "../types/weight";
const DECIMAL = /^(\d+)(?:\.(\d{1,3}))?$/;
export function parseWeightToGrams(value: string, unit: WeightUnit): number | null {
  const match = DECIMAL.exec(value.trim()); if (!match) return null;
  const thousandths = Number(match[1]) * 1000 + Number((match[2] ?? "").padEnd(3, "0"));
  const grams = unit === "kg" ? thousandths : Math.round(thousandths * 45359237 / 100000000);
  return Number.isSafeInteger(grams) && grams > 0 ? grams : null;
}
export function gramsToUnit(grams: number, unit: WeightUnit): number { return unit === "kg" ? grams / 1000 : grams * 100000 / 45359237; }
export function formatWeight(grams: number, unit: WeightUnit): string { return `${gramsToUnit(grams, unit).toFixed(1)} ${unit}`; }
