export type ReminderTone = "gentle" | "practical" | "encouraging";
export type ReminderDeliveryState =
  | "not-scheduled"
  | "scheduling"
  | "scheduled"
  | "cancellation-pending"
  | "failed";

export interface ReminderSourceRef {
  type: "brain-dump";
  id: string;
}

export interface Reminder {
  id: string;
  title: string;
  scheduledAt?: string; // Absolute timestamp instant with an offset.
  enabled: boolean;
  tone: ReminderTone;
  completedAt?: string;
  archivedAt?: string;
  deliveryState: ReminderDeliveryState;
  osNotificationId?: string;
  deliveryError?: string;
  deliveryUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
  sourceRef?: ReminderSourceRef;
  /** Legacy stable conversion reference retained for compatibility. */
  sourceBrainDumpId?: string;
  version: number;
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
  enabled?: boolean;
  tone?: ReminderTone;
  sourceRef?: ReminderSourceRef;
  sourceBrainDumpId?: string;
}

export interface UpdateReminderInput {
  title: string;
  scheduledAt?: string;
  enabled: boolean;
  tone: ReminderTone;
}
