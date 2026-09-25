import {
  savedMutation,
  type DurableMutationResult,
} from "@/services/storage/durableMutation";
import { create } from "zustand";
import { taskLocalRepository } from "../services/taskLocalRepository";
import { CreateTaskInput, Task, UpdateTaskInput } from "../types/task";

type TaskState = {
  tasks: Task[];
  hasHydrated: boolean;
  hydrationError: string | null;
  mutationError: string | null;
};

type TaskActions = {
  hydrateTasks: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
  addTask: (input: CreateTaskInput) => Promise<DurableMutationResult<Task>>;
  toggleTask: (id: string) => Promise<DurableMutationResult<Task>>;
  deleteTask: (id: string) => Promise<DurableMutationResult<void>>;
  updateTask: (
    id: string,
    input: UpdateTaskInput,
  ) => Promise<DurableMutationResult<Task>>;
  setTasks: (tasks: Task[]) => void;
  clearMutationError: () => void;
};

type TaskStore = TaskState & TaskActions;
const inFlightToggles = new Map<string, Promise<DurableMutationResult<Task>>>();

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  hasHydrated: false,
  hydrationError: null,
  mutationError: null,

  hydrateTasks: async () => {
    try {
      const storedTasks = await taskLocalRepository.getTasks();
      set({ tasks: storedTasks, hasHydrated: true, hydrationError: null });
    } catch (error) {
      set({
        hasHydrated: true,
        hydrationError: "Tasks need recovery before they can be used.",
      });
      throw error;
    }
  },

  setHasHydrated: (value) => set({ hasHydrated: value }),
  setTasks: (tasks) => set({ tasks }),
  clearMutationError: () => set({ mutationError: null }),

  addTask: async (input) => {
    set({ mutationError: null });
    try {
      const task = await taskLocalRepository.createTask(input);
      set((state) => ({ tasks: [task, ...state.tasks] }));
      return savedMutation(task);
    } catch (error) {
      set({ mutationError: "Couldn't save your task. Please try again." });
      throw error;
    }
  },

  toggleTask: (id) => {
    const existing = inFlightToggles.get(id);
    if (existing) return existing;

    set({ mutationError: null });
    const mutation = taskLocalRepository
      .toggleTask(id)
      .then((task) => {
        set((state) => ({
          tasks: state.tasks.map((item) => (item.id === id ? task : item)),
        }));
        return savedMutation(task);
      })
      .catch((error) => {
        set({ mutationError: "Couldn't update your task. Please try again." });
        throw error;
      })
      .finally(() => {
        inFlightToggles.delete(id);
      });
    inFlightToggles.set(id, mutation);
    return mutation;
  },

  deleteTask: async (id) => {
    set({ mutationError: null });
    try {
      await taskLocalRepository.deleteTask(id);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));
      return savedMutation(undefined);
    } catch (error) {
      set({ mutationError: "Couldn't remove your task. Please try again." });
      throw error;
    }
  },

  updateTask: async (id, input) => {
    set({ mutationError: null });
    try {
      const task = await taskLocalRepository.updateTask(id, input);
      set((state) => ({
        tasks: state.tasks.map((item) => (item.id === id ? task : item)),
      }));
      return savedMutation(task);
    } catch (error) {
      set({ mutationError: "Couldn't update your task. Please try again." });
      throw error;
    }
  },
}));
