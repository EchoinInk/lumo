export type HabitFrequency = "daily" | "weekly";

export type HabitColor =
  | "blue"
  | "green"
  | "yellow"
  | "orange"
  | "pink"
  | "purple"
  | "teal";

export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  targetDays?: string[]; // e.g., ["Mon", "Wed", "Fri"] for weekly habits
  streakCount: number;
  completedDates: string[]; // Local date keys (YYYY-MM-DD), never timestamp instants.
  color?: HabitColor;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  /** Soft delete timestamp for sync — null if not deleted */
  deletedAt?: string | null;
  /** Sync status: pending = local changes not synced, synced = confirmed on server, failed = sync failed */
  syncStatus?: "pending" | "synced" | "failed";
  /** Monotonically increasing version for conflict detection */
  version?: number;
  /** ISO timestamp of last successful sync for this entity */
  lastSyncedAt?: string;
  /** True when entity has unsynced local changes */
  pendingSync?: boolean;
}

export interface CreateHabitInput {
  title: string;
  description?: string;
  frequency: HabitFrequency;
  targetDays?: string[];
  color?: HabitColor;
  icon?: string;
}

export interface UpdateHabitInput {
  title?: string;
  description?: string;
  frequency?: HabitFrequency;
  targetDays?: string[];
  color?: HabitColor;
  icon?: string;
}
