import type { RecurrencePattern } from "@/features/tasks/types/recurrence";

export interface CleaningItem {
  id: string;
  name: string;
  notes?: string;
  startDate: string;
  recurrence: RecurrencePattern;
  completedDates: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  version: number;
}

export interface CleaningItemInput {
  name: string;
  notes?: string;
  startDate: string;
  recurrence: RecurrencePattern;
}
