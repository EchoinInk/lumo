import type { BodyMeasurement, MeasurementType } from "../types/measurement";
export function measurementHistory(values: BodyMeasurement[]): BodyMeasurement[] { return values.filter((value) => !value.deletedAt).slice().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)); }
export function measurementHistoryForType(values: BodyMeasurement[], type: MeasurementType): BodyMeasurement[] { return measurementHistory(values).filter((value) => value.type === type); }
