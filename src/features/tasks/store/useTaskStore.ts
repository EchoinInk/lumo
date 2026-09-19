import { create } from "zustand";
import { taskLocalRepository } from "../services/taskLocalRepository";
import { CreateTaskInput, Task, UpdateTaskInput } from "../types/task";

type TaskState = {
  tasks: Task[];
  hasHydrated: boolean;
};

type TaskActions = {
  // Hydration
  hydrateTasks: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;

  // Mutations (UI updates immediately, persists in background)
  addTask: (input: CreateTaskInput) => Task;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void; // Soft delete
  updateTask: (id: string, input: UpdateTaskInput) => void;

  // Direct state manipulation (for hydration/seed)
  setTasks: (tasks: Task[]) => void;
};

type TaskStore = TaskState & TaskActions;

/**
 * Task Store
 *
 * Local-first persisted Zustand store for task state management.
 * - UI updates instantly (never blocked)
 * - Persistence happens in background via taskLocalRepository
 * - Sync is handled by repository (canonical entrypoint)
 * - Hydrates from MMKV on initialization
 * - Starts empty when storage is empty
 * - Soft delete architecture (deletedAt timestamp)
 *
 * Architecture:
 *   UI → Store → Repository → Queue → Processor → Adapter → Backend
 *
 * Canonical flow:
 *   taskSyncRepository.createTask() handles local + sync
 */
export const useTaskStore = create<TaskStore>((set, get) => ({
  // ── Initial State ────────────────────────────────────────────────────────
  tasks: [],
  hasHydrated: false,

  // ── Hydration ────────────────────────────────────────────────────────────
  hydrateTasks: async () => {
    const storedTasks = await taskLocalRepository.getTasks();

    if (storedTasks.length > 0) {
      set({ tasks: storedTasks, hasHydrated: true });
      return;
    }

    set({ tasks: [], hasHydrated: true });
  },

  setHasHydrated: (value) => set({ hasHydrated: value }),

  setTasks: (tasks) => set({ tasks }),

  // ── Mutations (Instant UI + Background Persistence) ─────────────────────

  addTask: (input) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 11)}`,
      title: input.title,
      description: input.description,
      completed: false,
      priority: input.priority,
      energyRequired: input.energyRequired,
      recurrence: input.recurrence,
      dueDate: input.dueDate,
      createdAt: now,
      updatedAt: now,
      version: 1,
      pendingSync: true,
      syncStatus: "pending",
    };

    // Update UI immediately
    set((state) => ({
      tasks: [newTask, ...state.tasks],
    }));

    taskLocalRepository.persistVisibleTasks(get().tasks).catch((err) => {
      console.error("[TaskStore] Failed to persist new task:", err);
    });

    return newTask;
  },

  toggleTask: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      completed: !task.completed,
      updatedAt: new Date().toISOString(),
      version: (task.version ?? 0) + 1,
      pendingSync: true,
      syncStatus: "pending",
    };

    // Update UI immediately
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
    }));

    taskLocalRepository.persistVisibleTasks(get().tasks).catch((err) => {
      console.error("[TaskStore] Failed to persist task toggle:", err);
    });
  },

  deleteTask: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const now = new Date().toISOString();
    const softDeletedTask: Task = {
      ...task,
      deletedAt: now,
      updatedAt: now,
      version: (task.version ?? 0) + 1,
      pendingSync: true,
      syncStatus: "pending",
    };

    // Update UI immediately (filter out soft-deleted from visible tasks)
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));

    taskLocalRepository.persistVisibleTasks(get().tasks).catch((err) => {
      console.error("[TaskStore] Failed to persist task deletion:", err);
    });
  },

  updateTask: (id, input) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      ...input,
      updatedAt: new Date().toISOString(),
      version: (task.version ?? 0) + 1,
      pendingSync: true,
      syncStatus: "pending",
    };

    // Update UI immediately
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
    }));

    taskLocalRepository.persistVisibleTasks(get().tasks).catch((err) => {
      console.error("[TaskStore] Failed to persist task update:", err);
    });
  },
}));
