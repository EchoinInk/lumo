export interface Workout { id: string; activity: string; date: string; durationMinutes: number; calorieEstimate: number | null; createdAt: string; updatedAt: string; deletedAt: string | null; version: number; }
export interface WorkoutInput { activity: string; date: string; durationMinutes: number; calorieEstimate?: number | null; }
