export type ReminderTone = "gentle" | "practical" | "encouraging";

export interface Reminder {
  id: string;
  title: string;
  scheduledAt?: string; // Absolute timestamp instant with an offset.
  tone: ReminderTone;
  completedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  sourceBrainDumpId?: string;
}

export interface ReminderSettings {
  remindersEnabled: boolean;
  quietHoursStart: string; // Wall-clock time (HH:mm).
  quietHoursEnd: string; // Wall-clock time (HH:mm).
  hapticsEnabled: boolean;
  tone: ReminderTone;
}

export interface CreateReminderInput {
  title: string;
  scheduledAt?: string;
  tone?: ReminderTone;
  sourceBrainDumpId?: string;
}
