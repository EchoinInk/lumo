import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Screen } from "@/src/components/ui/Screen";
import { useEnvironmentalSoftening } from "@/src/features/calmMode/hooks/useEnvironmentalSoftening";
import { useCognitiveLoad } from "@/src/features/focus/hooks/useCognitiveLoad";
import { useFocusMode } from "@/src/features/focus/hooks/useFocusMode";
import { Spacing } from "@/src/theme/tokens";
import { useLocalDay } from "@/src/hooks/useLocalDay";
import { addLocalDays } from "@/src/utils/dateTime";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { EmptyTasks } from "../components/EmptyTasks";
import { TaskFilterPills } from "../components/TaskFilterPills";
import { TaskRow } from "../components/TaskRow";
import { TaskSection } from "../components/TaskSection";
import { useTasks } from "../hooks/useTasks";
import { TaskFilter } from "../types/task";
import { filterTasks } from "../utils/taskHelpers";

/**
 * Tasks Screen
 *
 * Fully interactive task management screen.
 * Users can add, toggle, and delete tasks with instant UI updates.
 */
export default function TasksScreen() {
  const today = useLocalDay();
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Focus Mode hooks
  const { activeFocusTaskId, enableFocusMode, setActiveFocusTask } =
    useFocusMode();
  const { shouldShowSecondaryActions, shouldShowMetadata } = useCognitiveLoad();

  // Calm Mode hooks
  const { shouldReduceDecorativeElements, shouldLowerVisualNoise } =
    useEnvironmentalSoftening();

  const {
    tasks,
    activeCount,
    completedCount,
    createTask,
    toggleTask,
    deleteTask,
    updateTask,
  } = useTasks();

  const filteredTasks = React.useMemo(() => {
    return filterTasks(tasks, filter);
  }, [tasks, filter]);

  const handleAddTask = async () => {
    const title = newTaskTitle.trim();
    if (!title) return;

    await createTask({ title, priority: "medium" });
    setNewTaskTitle("");
    setIsAdding(false);
  };

  const handleToggleTask = async (id: string) => {
    await toggleTask(id);
  };

  const handleDeleteTask = async (id: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    Alert.alert(
      "Delete this?",
      "This removes it from Lumo. You can park it instead if you may want it later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Park instead",
          onPress: () => {
            const tomorrow = addLocalDays(today, 1);
            updateTask(id, { dueDate: tomorrow });
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTask(id),
        },
      ],
    );
  };

  const handleFocusTask = (taskId: string) => {
    setActiveFocusTask(taskId);
    enableFocusMode(taskId);
  };

  return (
    <Screen scrollable padded keyboardAvoiding>
      {/* Header Section */}
      <TaskSection
        title="Tasks"
        subtitle={`${activeCount} active, ${completedCount} completed`}
      >
        {/* Add Task Input */}
        {isAdding ? (
          <View style={styles.addTaskContainer}>
            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <Input
                  placeholder="What needs to be done?"
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                  onSubmitEditing={handleAddTask}
                  returnKeyType="done"
                  autoFocus
                />
              </View>
            </View>
            <View style={styles.addActions}>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => {
                  setIsAdding(false);
                  setNewTaskTitle("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onPress={handleAddTask}
                disabled={!newTaskTitle.trim()}
              >
                Add Task
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.actionButtons}>
            <Button
              variant="secondary"
              size="md"
              onPress={() => setIsAdding(true)}
              accessibilityLabel="Add a new task"
            >
              + Add Task
            </Button>
            <Button
              variant="ghost"
              size="md"
              onPress={() =>
                router.push({
                  pathname: "/brain-dump" as const,
                } as any)
              }
              accessibilityLabel="Open Brain Dump"
            >
              Brain Dump
            </Button>
          </View>
        )}

        {/* Filter Pills */}
        <View style={styles.filterContainer}>
          <TaskFilterPills selectedFilter={filter} onFilterChange={setFilter} />
        </View>

        {/* Task List */}
        {filteredTasks.length > 0 ? (
          <View style={styles.taskList}>
            {filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
                onFocus={handleFocusTask}
                isFocusTask={task.id === activeFocusTaskId}
                showSecondaryActions={
                  shouldShowSecondaryActions && !shouldReduceDecorativeElements
                }
                showMetadata={shouldShowMetadata && !shouldLowerVisualNoise}
              />
            ))}
          </View>
        ) : (
          <EmptyTasks filter={filter} />
        )}
      </TaskSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addTaskContainer: {
    marginBottom: Spacing.md,
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  inputWrapper: {
    flex: 1,
  },
  addActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterContainer: {
    marginTop: Spacing.md,
  },
  taskList: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
