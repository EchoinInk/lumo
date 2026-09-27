import type { RepositoryContext } from "@/features/auth/types/auth.types";
import { deleteKey } from "@/services/storage/mmkv";
import { taskStorageDefinition } from "@/services/storage/domainSchemas";
import { StorageKeys } from "@/services/storage/storageKeys";
import { getEntityStorageKey } from "@/services/storage/storagePartition";
import {
  DurableMutationError,
  type DurableMutationOperation,
  SerializedMutationQueue,
} from "@/services/storage/durableMutation";
import {
  loadVersionedData,
  saveVersionedData,
  type VersionedStorageDefinition,
} from "@/services/storage/versionedStorage";
import { CreateTaskInput, Task, UpdateTaskInput } from "../types/task";
import {
  normalizeCreateTaskInput,
  normalizeUpdateTaskInput,
  TaskScheduleValidationError,
} from "../utils/taskValidation";
import { ITaskRepository } from "./taskRepository.types";
import { toLocalDateKey } from "@/src/utils/dateTime";
import { getNextOccurrenceAfter } from "../utils/recurrence";

/**
 * Task Local Repository
 *
 * MMKV-backed local implementation of the task repository.
 * Handles all task data persistence with a clean async API surface.
 *
 * Responsibilities:
 * - Read/write tasks from MMKV storage
 * - Serialize/deserialize task data
 * - Generate IDs and timestamps
 * - Isolate persistence logic from UI
 * - Support ownership-safe storage partitioning via RepositoryContext
 *
 * Error contract:
 * - No raw JS exceptions escape this class
 * - Storage errors are caught and re-thrown as normalised Error instances
 * - Not-found errors use a consistent message format: "Task <id> not found"
 *
 * Ownership:
 * - When RepositoryContext is provided, uses partitioned storage keys
 * - When RepositoryContext is not provided, uses legacy StorageKeys.TASKS
 * - This allows gradual migration without breaking existing code
 */
export class TaskLocalRepository implements ITaskRepository {
  private readonly STORAGE_KEY = StorageKeys.TASKS;
  private repositoryContext?: RepositoryContext;
  private readonly mutations = new SerializedMutationQueue();

  /**
   * Set the repository context for ownership-safe storage.
   * Call this before repository operations to enable partitioned storage.
   */
  setRepositoryContext(context: RepositoryContext): void {
    this.repositoryContext = context;
  }

  /**
   * Get the storage key for tasks, respecting repository context if set.
   */
  private getStorageKey(): string {
    if (this.repositoryContext) {
      return getEntityStorageKey("tasks", this.repositoryContext);
    }
    return this.STORAGE_KEY;
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private getStorageDefinition(): VersionedStorageDefinition<Task[]> {
    return {
      ...taskStorageDefinition,
      key: this.getStorageKey(),
    };
  }

  /** Load and validate all tasks. Invalid raw data remains untouched. */
  private loadTasks(): Task[] {
    return loadVersionedData(this.getStorageDefinition()).data;
  }

  /**
   * Persist the full task list to MMKV.
   * Throws a normalised Error on write failure (callers decide how to surface it).
   */
  private persistTasks(tasks: Task[]): void {
    try {
      saveVersionedData(this.getStorageDefinition(), tasks);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `[TaskLocalRepository] Failed to persist tasks: ${message}`,
      );
    }
  }

  /** Return the current ISO timestamp. */
  private now(): string {
    return new Date().toISOString();
  }

  /** Generate a collision-resistant ID. */
  private generateId(): string {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private mutate<T>(
    operation: DurableMutationOperation,
    mutation: () => T,
  ): Promise<T> {
    return this.mutations.run(() => {
      try {
        return mutation();
      } catch (cause) {
        if (cause instanceof DurableMutationError) throw cause;
        if (cause instanceof TaskScheduleValidationError) {
          throw new DurableMutationError(
            "tasks",
            operation,
            "invalid-input",
            cause.message,
            cause,
          );
        }
        throw new DurableMutationError(
          "tasks",
          operation,
          "write-failed",
          `Tasks could not be ${operation === "delete" ? "deleted" : "saved"}.`,
          cause,
        );
      }
    });
  }

  // ── ITaskRepository ──────────────────────────────────────────────────────

  /**
   * Get all non-deleted tasks from storage.
   * Filters out soft-deleted tasks (where deletedAt is set).
   */
  async getTasks(): Promise<Task[]> {
    await this.mutations.waitForIdle();
    const tasks = this.loadTasks();
    return tasks.filter((t) => !t.deletedAt);
  }

  /** IRepository.getAll — alias for getTasks (excludes soft-deleted). */
  async getAll(): Promise<Task[]> {
    return this.getTasks();
  }

  /**
   * Get all tasks including soft-deleted ones.
   * Used for sync operations and admin purposes.
   */
  async getAllTasksIncludingDeleted(): Promise<Task[]> {
    await this.mutations.waitForIdle();
    return this.loadTasks();
  }

  /**
   * Get a task by ID. Returns null when not found.
   */
  async getById(id: string): Promise<Task | null> {
    await this.mutations.waitForIdle();
    const tasks = this.loadTasks();
    return tasks.find((t) => t.id === id) ?? null;
  }

  /**
   * Create a new task and persist it.
   * Pure local persistence — no sync logic.
   */
  async createTask(input: CreateTaskInput): Promise<Task> {
    return this.mutate("create", () => {
      const tasks = this.loadTasks();
      const now = this.now();
      const normalizedInput = normalizeCreateTaskInput(input);

      if (normalizedInput.sourceBrainDumpId) {
        const existing = tasks.find(
          (task) =>
            !task.deletedAt &&
            task.sourceBrainDumpId === normalizedInput.sourceBrainDumpId,
        );
        if (existing) return existing;
      }
      if (normalizedInput.sourceOperationId) {
        const existing = tasks.find(
          (task) =>
            !task.deletedAt &&
            task.sourceOperationId === normalizedInput.sourceOperationId,
        );
        if (existing) return existing;
      }

      const id = this.generateId();
      const newTask: Task = {
        ...normalizedInput,
        id,
        completed: false,
        createdAt: now,
        updatedAt: now,
        syncStatus: "pending",
        version: 1,
        pendingSync: true,
        ...(normalizedInput.recurrence && normalizedInput.recurrence.type !== "none"
          ? {
              seriesId: id,
              occurrenceIndex: 0,
              recurrenceAnchorDate: normalizedInput.dueDate,
            }
          : {}),
      };

      this.persistTasks([...tasks, newTask]);
      return newTask;
    });
  }

  /** IRepository.create — delegates to createTask. */
  async create(
    input: Omit<
      Task,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "version"
      | "lastSyncedAt"
      | "pendingSync"
    >,
  ): Promise<Task> {
    return this.createTask(input as CreateTaskInput);
  }

  /**
   * Update an existing task by ID.
   * Throws a normalised Error when the task is not found.
   * Pure local persistence — no sync logic.
   */
  async updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    return this.mutate("update", () => {
      const tasks = this.loadTasks();
      const index = tasks.findIndex((t) => t.id === id);

      if (index === -1) {
        throw new DurableMutationError(
          "tasks",
          "update",
          "not-found",
          `Task ${id} was not found.`,
        );
      }
      if (tasks[index].deletedAt) {
        throw new DurableMutationError(
          "tasks",
          "update",
          "conflict",
          `Task ${id} was deleted before it could be updated.`,
        );
      }

      const current = tasks[index];
      const normalizedInput = normalizeUpdateTaskInput(input, current);
      const updated: Task = {
        ...current,
        ...normalizedInput,
        updatedAt: this.now(),
        syncStatus: "pending",
        version: (current.version ?? 0) + 1,
        pendingSync: true,
      };

      const next = [...tasks];
      next[index] = updated;
      this.persistTasks(next);
      return updated;
    });
  }

  /** IRepository.update — delegates to updateTask. */
  async update(id: string, input: Partial<Task>): Promise<Task> {
    return this.updateTask(id, input as UpdateTaskInput);
  }

  /**
   * Soft delete a task by ID.
   * Sets deletedAt timestamp instead of removing from storage.
   * Pure local persistence — no sync logic.
   * Silently succeeds when the task does not exist (idempotent).
   */
  async deleteTask(id: string): Promise<void> {
    return this.mutate("delete", () => {
      const tasks = this.loadTasks();
      const index = tasks.findIndex((t) => t.id === id);

      if (index === -1 || tasks[index].deletedAt) return;

      const now = this.now();
      const next = [...tasks];
      next[index] = {
        ...next[index],
        deletedAt: now,
        updatedAt: now,
        syncStatus: "pending",
        version: (next[index].version ?? 0) + 1,
        pendingSync: true,
      };
      this.persistTasks(next);
    });
  }

  /** IRepository.delete — delegates to deleteTask (soft delete). */
  async delete(id: string): Promise<void> {
    return this.deleteTask(id);
  }

  /**
   * Hard delete a task by ID.
   * Actually removes from storage. Use with caution.
   */
  async hardDeleteTask(id: string): Promise<void> {
    return this.mutate("delete", () => {
      const tasks = this.loadTasks();
      const filtered = tasks.filter((t) => t.id !== id);
      this.persistTasks(filtered);
    });
  }

  /**
   * Toggle task completion status.
   * Throws a normalised Error when the task is not found.
   * Pure local persistence — no sync logic.
   */
  async toggleTask(id: string): Promise<Task> {
    return this.setTaskCompletion(id, undefined);
  }

  async setTaskCompletion(
    id: string,
    completed?: boolean,
    localDate: string = toLocalDateKey(),
  ): Promise<Task> {
    return this.mutate("toggle", () => {
      const tasks = this.loadTasks();
      const index = tasks.findIndex((t) => t.id === id);

      if (index === -1 || tasks[index].deletedAt) {
        throw new DurableMutationError(
          "tasks",
          "toggle",
          index === -1 ? "not-found" : "conflict",
          `Task ${id} is no longer available.`,
        );
      }

      const current = tasks[index];
      const nextCompleted = completed ?? !current.completed;
      if (current.completed === nextCompleted) return current;
      const now = this.now();
      const updated: Task = {
        ...current,
        completed: nextCompleted,
        completedAt: nextCompleted ? now : undefined,
        updatedAt: now,
        syncStatus: "pending",
        version: (current.version ?? 0) + 1,
        pendingSync: true,
      };

      const next = [...tasks];
      next[index] = updated;

      if (
        nextCompleted &&
        current.recurrence &&
        current.recurrence.type !== "none" &&
        !current.nextOccurrenceId
      ) {
        const existingSuccessor = tasks.find(
          (task) => task.previousOccurrenceId === current.id,
        );
        if (existingSuccessor) {
          next[index] = { ...updated, nextOccurrenceId: existingSuccessor.id };
        } else {
          const baseDate = current.dueDate ?? localDate;
          const anchorDate = current.recurrenceAnchorDate ?? baseDate;
          const dueDate = getNextOccurrenceAfter(
            baseDate,
            current.recurrence,
            localDate,
            anchorDate,
          );
          if (dueDate) {
            const successorId = this.generateId();
            next[index] = { ...updated, nextOccurrenceId: successorId };
            next.push({
              ...current,
              id: successorId,
              completed: false,
              completedAt: undefined,
              dueDate,
              seriesId: current.seriesId ?? current.id,
              occurrenceIndex: (current.occurrenceIndex ?? 0) + 1,
              recurrenceAnchorDate: anchorDate,
              previousOccurrenceId: current.id,
              nextOccurrenceId: undefined,
              createdAt: now,
              updatedAt: now,
              version: 1,
              syncStatus: "pending",
              pendingSync: true,
              lastSyncedAt: undefined,
              deletedAt: null,
            });
          }
        }
      }
      this.persistTasks(next);
      return next[index];
    });
  }

  /**
   * Mark a task as successfully synced.
   * Clears pendingSync, sets syncStatus to 'synced', and stamps lastSyncedAt.
   * Called by the sync processor after remote confirmation.
   * Silently succeeds when the task does not exist.
   */
  async markSynced(id: string): Promise<void> {
    return this.mutate("update", () => {
      const tasks = this.loadTasks();
      const index = tasks.findIndex((t) => t.id === id);
      if (index === -1) return;

      const next = [...tasks];
      next[index] = {
        ...next[index],
        pendingSync: false,
        syncStatus: "synced",
        lastSyncedAt: this.now(),
      };
      this.persistTasks(next);
    });
  }

  /**
   * Persist visible tasks from store state without creating duplicate IDs.
   */
  async persistVisibleTasks(visibleTasks: Task[]): Promise<void> {
    return this.mutate("replace", () => {
      const all = this.loadTasks();
      const visibleById = new Map(visibleTasks.map((task) => [task.id, task]));
      const now = this.now();
      const handled = new Set<string>();
      const result: Task[] = [];

      for (const stored of all) {
        const visible = visibleById.get(stored.id);
        if (visible) {
          result.push(visible);
          handled.add(stored.id);
          continue;
        }

        if (!stored.deletedAt) {
          result.push({
            ...stored,
            deletedAt: now,
            updatedAt: now,
            version: (stored.version ?? 0) + 1,
            pendingSync: true,
            syncStatus: "pending",
          });
          handled.add(stored.id);
          continue;
        }

        result.push(stored);
        handled.add(stored.id);
      }

      for (const task of visibleTasks) {
        if (!handled.has(task.id)) {
          result.push(task);
        }
      }

      this.persistTasks(result);
    });
  }

  /**
   * Clear all tasks from storage.
   * Useful for testing or user-initiated data reset.
   */
  async clearAll(): Promise<void> {
    return this.mutate("clear", () => deleteKey(this.getStorageKey()));
  }
}

// Export singleton instance
export const taskLocalRepository = new TaskLocalRepository();
