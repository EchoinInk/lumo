import type { RepositoryContext } from "@/features/auth/types/auth.types";
import { deleteKey } from "@/services/storage/mmkv";
import { taskStorageDefinition } from "@/services/storage/domainSchemas";
import { StorageKeys } from "@/services/storage/storageKeys";
import { getEntityStorageKey } from "@/services/storage/storagePartition";
import {
  loadVersionedData,
  saveVersionedData,
  type VersionedStorageDefinition,
} from "@/services/storage/versionedStorage";
import { CreateTaskInput, Task, UpdateTaskInput } from "../types/task";
import { ITaskRepository } from "./taskRepository.types";

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

  // ── ITaskRepository ──────────────────────────────────────────────────────

  /**
   * Get all non-deleted tasks from storage.
   * Filters out soft-deleted tasks (where deletedAt is set).
   */
  async getTasks(): Promise<Task[]> {
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
    return this.loadTasks();
  }

  /**
   * Get a task by ID. Returns null when not found.
   */
  async getById(id: string): Promise<Task | null> {
    const tasks = this.loadTasks();
    return tasks.find((t) => t.id === id) ?? null;
  }

  /**
   * Create a new task and persist it.
   * Pure local persistence — no sync logic.
   */
  async createTask(input: CreateTaskInput): Promise<Task> {
    const tasks = this.loadTasks();
    const now = this.now();

    const newTask: Task = {
      ...input,
      id: this.generateId(),
      completed: false,
      createdAt: now,
      updatedAt: now,
      syncStatus: "pending",
      version: 1,
      pendingSync: true,
    };

    this.persistTasks([...tasks, newTask]);
    return newTask;
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
    const tasks = this.loadTasks();
    const index = tasks.findIndex((t) => t.id === id);

    if (index === -1) {
      throw new Error(`[TaskLocalRepository] Task ${id} not found`);
    }

    const current = tasks[index];
    const updated: Task = {
      ...current,
      ...input,
      updatedAt: this.now(),
      syncStatus: "pending",
      version: (current.version ?? 0) + 1,
      pendingSync: true,
    };

    const next = [...tasks];
    next[index] = updated;
    this.persistTasks(next);

    return updated;
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
    const tasks = this.loadTasks();
    const index = tasks.findIndex((t) => t.id === id);

    if (index === -1) return;

    const next = [...tasks];
    next[index] = {
      ...next[index],
      deletedAt: this.now(),
      updatedAt: this.now(),
      syncStatus: "pending",
      version: (next[index].version ?? 0) + 1,
      pendingSync: true,
    };
    this.persistTasks(next);
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
    const tasks = this.loadTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    this.persistTasks(filtered);
  }

  /**
   * Toggle task completion status.
   * Throws a normalised Error when the task is not found.
   * Pure local persistence — no sync logic.
   */
  async toggleTask(id: string): Promise<Task> {
    const tasks = this.loadTasks();
    const index = tasks.findIndex((t) => t.id === id);

    if (index === -1) {
      throw new Error(`[TaskLocalRepository] Task ${id} not found`);
    }

    const current = tasks[index];
    const updated: Task = {
      ...current,
      completed: !current.completed,
      updatedAt: this.now(),
      syncStatus: "pending",
      version: (current.version ?? 0) + 1,
      pendingSync: true,
    };

    const next = [...tasks];
    next[index] = updated;
    this.persistTasks(next);

    return updated;
  }

  /**
   * Mark a task as successfully synced.
   * Clears pendingSync, sets syncStatus to 'synced', and stamps lastSyncedAt.
   * Called by the sync processor after remote confirmation.
   * Silently succeeds when the task does not exist.
   */
  async markSynced(id: string): Promise<void> {
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
  }

  /**
   * Persist visible tasks from store state without creating duplicate IDs.
   */
  async persistVisibleTasks(visibleTasks: Task[]): Promise<void> {
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
  }

  /**
   * Clear all tasks from storage.
   * Useful for testing or user-initiated data reset.
   */
  async clearAll(): Promise<void> {
    deleteKey(this.getStorageKey());
  }
}

// Export singleton instance
export const taskLocalRepository = new TaskLocalRepository();
