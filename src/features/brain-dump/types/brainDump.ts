export type BrainDumpStatus = "open" | "converted" | "archived";

export type BrainDumpConversionTarget =
  | "task"
  | "reminder"
  | "routine_idea"
  | "archived_note";

export interface BrainDumpEntry {
  id: string;
  text: string;
  status: BrainDumpStatus;
  createdAt: string;
  updatedAt: string;
  convertedAt?: string;
  convertedTo?: BrainDumpConversionTarget;
  linkedEntityId?: string;
  /** Stable idempotency key retained while a conversion is pending or complete. */
  conversionId?: string;
  pendingConversionTarget?: BrainDumpConversionTarget;
}

export interface CreateBrainDumpInput {
  text: string;
}
