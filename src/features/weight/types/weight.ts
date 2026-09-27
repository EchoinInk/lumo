export type WeightUnit = "kg" | "lb";
export interface WeightEntry { id: string; grams: number; date: string; note?: string; createdAt: string; updatedAt: string; deletedAt: string | null; version: number; }
export interface WeightEntryInput { grams: number; date: string; note?: string; }
export interface WeightState { preferredUnit: WeightUnit; entries: WeightEntry[]; updatedAt: string | null; version: number; }
