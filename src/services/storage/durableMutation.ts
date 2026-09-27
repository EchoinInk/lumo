export type DurableMutationDomain = "tasks" | "habits" | "cleaning" | "meals";

export type DurableMutationOperation =
  | "create"
  | "update"
  | "delete"
  | "complete"
  | "uncomplete"
  | "toggle"
  | "replace"
  | "clear";

export type DurableMutationFailureKind =
  | "not-found"
  | "conflict"
  | "invalid-input"
  | "write-failed";

/** A mutation only returns this value after its local write has completed. */
export interface DurableMutationResult<T> {
  status: "saved";
  value: T;
}

export class DurableMutationError extends Error {
  constructor(
    public readonly domain: DurableMutationDomain,
    public readonly operation: DurableMutationOperation,
    public readonly kind: DurableMutationFailureKind,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "DurableMutationError";
  }
}

export function savedMutation<T>(value: T): DurableMutationResult<T> {
  return { status: "saved", value };
}

/**
 * A small promise queue for read-modify-write storage operations. Rejections do
 * not poison the queue, so a failed write can be retried by the next mutation.
 */
export class SerializedMutationQueue {
  private tail: Promise<void> = Promise.resolve();

  run<T>(operation: () => T | Promise<T>): Promise<T> {
    const result = this.tail.then(operation);
    this.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  waitForIdle(): Promise<void> {
    return this.tail;
  }
}

/** Synchronous guard used by forms so two taps cannot start two submissions. */
export class MutationSubmissionGuard {
  private active = false;

  begin(): boolean {
    if (this.active) return false;
    this.active = true;
    return true;
  }

  end(): void {
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }
}
