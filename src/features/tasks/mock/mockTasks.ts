import { Task } from "../types/task";
import { toLocalDateKey } from "@/src/utils/dateTime";

const today = toLocalDateKey();

/**
 * Neurodivergent-Friendly Task Seed Data
 *
 * Calm, realistic task examples designed for neurodivergent users.
 * Focuses on:
 * - Small, manageable chunks
 * - Self-care and wellness
 * - Clear, actionable language
 * - Low-pressure descriptions
 * - Sensory-friendly activities
 */
export const mockTasks: Task[] = [
  // Today's tasks - high priority
  {
    id: "1",
    title: "Prepare medication refill",
    description: "Call pharmacy for refill, 5 minutes",
    completed: false,
    priority: "high",
    dueDate: today,
    createdAt: "2026-05-20T08:00:00Z",
    updatedAt: "2026-05-20T08:00:00Z",
  },
  {
    id: "2",
    title: "15 minute room reset",
    description: "Pick up visible items, no deep cleaning",
    completed: false,
    priority: "high",
    dueDate: today,
    createdAt: "2026-05-20T09:00:00Z",
    updatedAt: "2026-05-20T09:00:00Z",
  },
  {
    id: "3",
    title: "Reply to landlord email",
    description: "Keep response brief, ask for help if needed",
    completed: false,
    priority: "high",
    dueDate: today,
    createdAt: "2026-05-20T10:00:00Z",
    updatedAt: "2026-05-20T10:00:00Z",
  },

  // Today's tasks - medium priority
  {
    id: "4",
    title: "Hydration check",
    description: "Drink one glass of water now",
    completed: false,
    priority: "medium",
    dueDate: today,
    createdAt: "2026-05-20T11:00:00Z",
    updatedAt: "2026-05-20T11:00:00Z",
  },
  {
    id: "5",
    title: "Morning reset",
    description: "Stretch, wash face, change clothes",
    completed: false,
    priority: "medium",
    dueDate: today,
    createdAt: "2026-05-20T07:00:00Z",
    updatedAt: "2026-05-20T07:00:00Z",
  },

  // Today's tasks - low priority
  {
    id: "6",
    title: "Take 3 deep breaths",
    description: "Pause and breathe, no rush",
    completed: false,
    priority: "low",
    dueDate: today,
    createdAt: "2026-05-20T13:00:00Z",
    updatedAt: "2026-05-20T13:00:00Z",
  },
  {
    id: "7",
    title: "Listen to calming music",
    description: "5 minutes, headphones on",
    completed: false,
    priority: "low",
    dueDate: today,
    createdAt: "2026-05-20T14:00:00Z",
    updatedAt: "2026-05-20T14:00:00Z",
  },

  // Completed tasks
  {
    id: "8",
    title: "Grocery list",
    description: "Write down 3 essential items",
    completed: true,
    priority: "medium",
    dueDate: "2026-05-19",
    createdAt: "2026-05-18T16:00:00Z",
    updatedAt: "2026-05-19T10:30:00Z",
  },
  {
    id: "9",
    title: "Evening walk",
    description: "10 minutes around the block",
    completed: true,
    priority: "low",
    dueDate: "2026-05-18",
    createdAt: "2026-05-17T18:00:00Z",
    updatedAt: "2026-05-18T19:00:00Z",
  },
  {
    id: "10",
    title: "Take vitamins",
    description: "With food, set reminder for tomorrow",
    completed: true,
    priority: "high",
    dueDate: "2026-05-18",
    createdAt: "2026-05-17T08:00:00Z",
    updatedAt: "2026-05-18T08:30:00Z",
  },
];
