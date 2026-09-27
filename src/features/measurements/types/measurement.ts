export const measurementTypes = ["waist", "hips", "chest", "neck", "upper-arm", "thigh"] as const;
export type MeasurementType = typeof measurementTypes[number];
export type MeasurementUnit = "cm" | "in";
export interface BodyMeasurement { id: string; type: MeasurementType; valueMilli: number; unit: MeasurementUnit; date: string; createdAt: string; updatedAt: string; deletedAt: string | null; version: number; }
export interface BodyMeasurementInput { type: MeasurementType; valueMilli: number; unit: MeasurementUnit; date: string; }
