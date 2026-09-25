import { useEffect } from "react";
import { useTaskStore } from "../store/useTaskStore";
import { CreateTaskInput, UpdateTaskInput } from "../types/task";

/**
 * Task Hook
 *
 * Thin hook abstraction for screens and components.
 * Connects the store to UI with derived selectors.
 * Handles hydration lifecycle from local storage.
 *
 * Persistence verification:
 * - Tasks are stored in MMKV under StorageKeys.TASKS
 * - All mutations (add/toggle/update/delete) persist immediately
 * - Hydration loads tasks on first mount
 * - Corrupted storage returns empty array (graceful fallback)
 */
export function useTasks() {
  const {
    tasks,
    hasHydrated,
    hydrationError,
    mutationError,
    hydrateTasks,
    addTask,
    toggleTask,
    deleteTask,
    updateTask,
    clearMutationError,
  } = useTaskStore();

  // Hydrate from local storage on first mount
  useEffect(() => {
    if (!hasHydrated) {
      hydrateTasks().catch((err) => {
        console.error("[useTasks] Failed to hydrate tasks:", err);
      });
    }
  }, [hasHydrated, hydrateTasks]);

  // Derived selectors
  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);
  const activeCount = activeTasks.length;
  const completedCount = completedTasks.length;
  const totalCount = tasks.length;
  const completionPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Wrapped actions with error handling
  const handleCreateTask = async (input: CreateTaskInput) => {
    try {
      return await addTask(input);
    } catch (err) {
      console.error("[useTasks] Failed to create task:", err);
      throw err;
    }
  };

  const handleToggleTask = async (id: string) => {
    try {
      return await toggleTask(id);
    } catch (err) {
      console.error("[useTasks] Failed to toggle task:", err);
      throw err;
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      return await deleteTask(id);
    } catch (err) {
      console.error("[useTasks] Failed to delete task:", err);
      throw err;
    }
  };

  const handleUpdateTask = async (id: string, input: UpdateTaskInput) => {
    try {
      return await updateTask(id, input);
    } catch (err) {
      console.error("[useTasks] Failed to update task:", err);
      throw err;
    }
  };

  return {
    // State
    tasks,
    hasHydrated,
    isLoading: !hasHydrated,
    error: hydrationError,
    mutationError,
    clearError: clearMutationError,

    // Derived data
    activeTasks,
    completedTasks,
    activeCount,
    completedCount,
    totalCount,
    completionPercentage,

    // Actions (wrapped with error handling)
    createTask: handleCreateTask,
    toggleTask: handleToggleTask,
    deleteTask: handleDeleteTask,
    updateTask: handleUpdateTask,
  };
}
