import { QuickCaptureSheet } from "@/src/components/capture/QuickCaptureSheet";
import { LoadingState, RetryView } from "@/src/components/feedback";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Text } from "@/src/components/ui/Text";
import { RoutineBundleCard } from "@/src/features/routines/components/RoutineBundleCard";
import {
  createRoutineBundleApplyGuard,
  createTasksFromBundle,
  starterRoutineBundles,
  type RoutineBundle,
} from "@/src/features/routines";
import { TaskFormModal } from "@/src/features/tasks/components/TaskFormModal";
import { useTasks } from "@/src/features/tasks/hooks/useTasks";
import { useTaskStore } from "@/src/features/tasks/store/useTaskStore";
import {
  CreateTaskInput,
  Task,
  TaskPriority,
} from "@/src/features/tasks/types/task";
import { summarizeRecurrence } from "@/src/features/tasks/utils/recurrence";
import {
  filterTasksByDate,
  isTaskOverdue,
  type TaskDateFilter,
} from "@/src/features/tasks/utils/taskHelpers";
import { useLocalDay } from "@/src/hooks/useLocalDay";
import { Colors, Radius, Shadows, Spacing } from "@/src/theme/tokens";
import { addLocalDays, formatLocalDate, isLocalDateKey } from "@/src/utils/dateTime";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  CheckCircle2,
  Circle,
  Clock,
  Lightbulb,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const filters: { key: TaskDateFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "done", label: "Done" },
];

export default function TasksScreen() {
  const [activeFilter, setActiveFilter] = useState<TaskDateFilter>("today");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isQuickCaptureVisible, setIsQuickCaptureVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const applyGuard = useRef(createRoutineBundleApplyGuard()).current;
  const releaseTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [applyingBundleIds, setApplyingBundleIds] = useState<string[]>([]);
  const [appliedBundleIds, setAppliedBundleIds] = useState<string[]>([]);
  const {
    tasks,
    toggleTask,
    deleteTask,
    updateTask,
    createTask,
    completedCount,
    totalCount,
    error,
    mutationError,
    isLoading,
    clearError,
  } = useTasks();

  useEffect(() => {
    return () => {
      releaseTimers.current.forEach(clearTimeout);
    };
  }, []);

  const handleRetryLoad = () => {
    clearError();
    useTaskStore.getState().hydrateTasks();
  };

  // Date helpers
  const today = useLocalDay();
  const tomorrow = addLocalDays(today, 1);

  const filteredTasks = filterTasksByDate(tasks, activeFilter, today);

  const handleAddPress = () => {
    setModalMode("create");
    setSelectedTask(undefined);
    setIsModalVisible(true);
  };

  const handleEditPress = (task: Task) => {
    setModalMode("edit");
    setSelectedTask(task);
    setIsModalVisible(true);
  };

  const confirmDeleteTask = (task: Task) => {
    Alert.alert(
      "Delete this?",
      "This removes it from Lumo. You can park it instead if you may want it later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Park instead",
          onPress: () => {
            void updateTask(task.id, { dueDate: tomorrow }).catch(() => undefined);
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deleteTask(task.id).catch(() => undefined);
          },
        },
      ],
    );
  };

  const handleModalSubmit = async (data: CreateTaskInput) => {
    if (modalMode === "edit" && selectedTask) {
      await updateTask(selectedTask.id, data);
      return;
    }
    await createTask(data);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedTask(undefined);
  };

  const handleUseBundle = async (bundle: RoutineBundle) => {
    if (!applyGuard.begin(bundle.id)) return;

    setApplyingBundleIds((current) =>
      current.includes(bundle.id) ? current : [...current, bundle.id],
    );
    try {
      for (const task of createTasksFromBundle(bundle)) {
        await createTask(task);
      }
      setAppliedBundleIds((current) =>
        current.includes(bundle.id) ? current : [...current, bundle.id],
      );
      releaseTimers.current.push(
        setTimeout(() => {
          applyGuard.release(bundle.id);
          setApplyingBundleIds((current) =>
            current.filter((bundleId) => bundleId !== bundle.id),
          );
          setAppliedBundleIds((current) =>
            current.filter((bundleId) => bundleId !== bundle.id),
          );
        }, 1200),
      );
    } catch {
      applyGuard.release(bundle.id);
      setApplyingBundleIds((current) =>
        current.filter((bundleId) => bundleId !== bundle.id),
      );
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return Colors.pink;
      case "medium":
        return Colors.warning;
      case "low":
        return Colors.blue;
      default:
        return Colors.textSecondary;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Screen scrollable padded>
        <LoadingState message="Loading your tasks..." />
      </Screen>
    );
  }

  // Error state
  if (error) {
    return (
      <Screen scrollable padded>
        <RetryView
          title="Something didn't load gently"
          description="Your tasks are still safe. Try again when you're ready."
          onRetry={handleRetryLoad}
        />
      </Screen>
    );
  }

  return (
    <Screen scrollable padded>
      {/* Header */}
      {mutationError && (
        <Card variant="outlined" style={styles.errorCard}>
          <Text variant="small" color={Colors.danger} accessibilityRole="alert">
            {mutationError}
          </Text>
        </Card>
      )}
      <SectionHeader
        title="Your Tasks"
        subtitle={`${completedCount} of ${totalCount} completed`}
      />

      <View style={styles.reliefActions}>
        <Button
          size="sm"
          onPress={() => setIsQuickCaptureVisible(true)}
          accessibilityLabel="Quick capture"
          accessibilityHint="Opens a lightweight capture sheet"
        >
          Quick Capture
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onPress={() => router.push({ pathname: "/brain-dump" as const } as any)}
          accessibilityLabel="Brain dump"
          accessibilityHint="Opens Brain Dump for uncategorized thoughts"
        >
          Brain Dump
        </Button>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            onPress={() => setActiveFilter(filter.key)}
            style={[
              styles.filterPill,
              activeFilter === filter.key && styles.filterPillActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Filter tasks by ${filter.label}`}
            accessibilityState={{ selected: activeFilter === filter.key }}
          >
            <Text
              variant="body"
              color={
                activeFilter === filter.key
                  ? Colors.textInverse
                  : Colors.textPrimary
              }
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Empty States */}
      {!isLoading && filteredTasks.length === 0 && (
        <Card variant="outlined" style={styles.emptyCard}>
          <Text
            variant="body"
            color={Colors.textSecondary}
            style={styles.emptyTitle}
          >
            {activeFilter === "done"
              ? "No completed tasks yet"
              : activeFilter === "upcoming"
                ? "No upcoming tasks"
                : activeFilter === "all"
                  ? "No tasks yet"
                  : "No tasks for today"}
          </Text>
          <Text variant="caption" color={Colors.textTertiary}>
            {activeFilter === "done"
              ? "Complete a task and it will appear here"
              : "Add a task to get started — small steps count"}
          </Text>
        </Card>
      )}

      {/* Task List */}
      <View style={styles.taskList}>
        {filteredTasks.map((task) => (
          <Card
            key={task.id}
            variant={task.completed ? "outlined" : "elevated"}
            style={[
              styles.taskCard,
              task.priority === "high" &&
                !task.completed &&
                styles.taskCardHigh,
            ]}
          >
            <View style={styles.taskRow}>
              <TouchableOpacity
                onPress={() => {
                  void toggleTask(task.id).catch(() => undefined);
                }}
                style={styles.taskContent}
                activeOpacity={0.7}
                accessibilityLabel={`${task.completed ? "Completed" : "Pending"} task: ${task.title}`}
                accessibilityRole="button"
              >
                <View
                  style={[
                    styles.checkbox,
                    task.completed && styles.checkboxChecked,
                    task.priority === "high" &&
                      !task.completed &&
                      styles.checkboxHigh,
                  ]}
                >
                  {task.completed ? (
                    <CheckCircle2 size={20} color={Colors.textInverse} />
                  ) : (
                    <Circle size={20} color={Colors.border} />
                  )}
                </View>

                <View style={styles.taskInfo}>
                  <Text
                    variant="body"
                    style={[
                      styles.taskTitle,
                      task.completed && styles.taskTitleCompleted,
                    ]}
                  >
                    {task.title}
                  </Text>

                  {task.description && (
                    <Text
                      variant="caption"
                      color={Colors.textTertiary}
                      style={styles.taskNotes}
                      numberOfLines={1}
                    >
                      {task.description}
                    </Text>
                  )}

                  <View style={styles.taskMeta}>
                    {(task.dueDate || task.dueTime) && (
                      <View style={styles.timeBadge}>
                        <Clock size={12} color={Colors.textTertiary} />
                        <Text variant="small" color={Colors.textTertiary}>
                          {task.dueDate === today
                            ? "Today"
                            : task.dueDate === tomorrow
                              ? "Tomorrow"
                              : isTaskOverdue(task, today)
                                ? `Overdue · ${formatLocalDate(task.dueDate!, {
                                  month: "short",
                                  day: "numeric",
                                })}`
                              : task.dueDate
                                ? isLocalDateKey(task.dueDate)
                                  ? formatLocalDate(task.dueDate, {
                                    month: "short",
                                    day: "numeric",
                                  })
                                  : task.dueDate
                                : ""}
                          {task.dueTime
                            ? (task.dueDate ? " at " : "") + task.dueTime
                            : ""}
                        </Text>
                      </View>
                    )}

                    <View
                      style={[
                        styles.priorityBadge,
                        {
                          backgroundColor:
                            getPriorityColor(task.priority) + "15",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.priorityDot,
                          { backgroundColor: getPriorityColor(task.priority) },
                        ]}
                      />
                      <Text
                        variant="small"
                        color={getPriorityColor(task.priority)}
                      >
                        {task.priority.charAt(0).toUpperCase() +
                          task.priority.slice(1)}
                      </Text>
                    </View>
                    {task.energyRequired && (
                      <View style={styles.energyBadge}>
                        <Text variant="small" color={Colors.textSecondary}>
                          {task.energyRequired} energy
                        </Text>
                      </View>
                    )}
                    {task.recurrence && (
                      <View style={styles.recurringBadge}>
                        <Text variant="small" color={Colors.purple}>
                          {summarizeRecurrence(task.recurrence)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={styles.taskActions}>
                {/* Edit Button */}
                <TouchableOpacity
                  onPress={() => handleEditPress(task)}
                  style={styles.actionButton}
                  activeOpacity={0.6}
                  accessibilityLabel={`Edit task: ${task.title}`}
                  accessibilityRole="button"
                >
                  <Pencil size={16} color={Colors.textTertiary} />
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity
                  onPress={() => confirmDeleteTask(task)}
                  style={styles.actionButton}
                  activeOpacity={0.6}
                  accessibilityLabel={`Delete task: ${task.title}`}
                  accessibilityHint="Asks before deleting this task"
                  accessibilityRole="button"
                >
                  <Trash2 size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ))}
      </View>

      {/* Break Tasks Down Support Card */}
      <Card variant="elevated" style={styles.supportCard}>
        <View style={styles.supportContent}>
          <View
            style={[
              styles.supportIcon,
              { backgroundColor: Colors.purple + "15" },
            ]}
          >
            <Lightbulb size={20} color={Colors.purple} />
          </View>
          <View style={styles.supportText}>
            <Text variant="body" style={styles.supportTitle}>
              Break tasks down
            </Text>
            <Text variant="caption" color={Colors.textSecondary}>
              Big tasks feel smaller when split into steps
            </Text>
          </View>
        </View>
      </Card>

      <SectionHeader
        title="Routine bundles"
        subtitle="Small editable starting points"
        rightElement={
          <Button
            size="sm"
            variant="ghost"
            onPress={() =>
              router.push({ pathname: "/routine-bundles" as const } as any)
            }
            accessibilityLabel="Open routine bundles"
            accessibilityHint="Opens the full routine bundles screen"
          >
            View all
          </Button>
        }
      />
      <View style={styles.bundleList}>
        {starterRoutineBundles.slice(0, 3).map((bundle) => (
            <RoutineBundleCard
              key={bundle.id}
              bundle={bundle}
              onUse={handleUseBundle}
              isApplying={applyingBundleIds.includes(bundle.id)}
              isApplied={appliedBundleIds.includes(bundle.id)}
            />
        ))}
      </View>

      {/* Add Task Button */}
      <TouchableOpacity
        style={styles.addButton}
        activeOpacity={0.8}
        onPress={handleAddPress}
        accessibilityLabel="Add new task"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[Colors.pink, Colors.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          <Plus size={24} color={Colors.textInverse} />
          <Text
            variant="subheading"
            color={Colors.textInverse}
            style={styles.addButtonText}
          >
            Add Task
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Task Form Modal */}
      <TaskFormModal
        visible={isModalVisible}
        mode={modalMode}
        initialTask={selectedTask}
        onSubmit={handleModalSubmit}
        onClose={handleModalClose}
      />

      <QuickCaptureSheet
        visible={isQuickCaptureVisible}
        onClose={() => setIsQuickCaptureVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingRight: Spacing.lg,
  },
  reliefActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  taskList: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  taskCard: {
    padding: Spacing.md,
  },
  taskCardHigh: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.pink,
  },
  taskContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkboxHigh: {
    borderColor: Colors.pink,
    backgroundColor: Colors.pink + "10",
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: Colors.textTertiary,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  recurringBadge: {
    backgroundColor: Colors.purple + "15",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  energyBadge: {
    backgroundColor: Colors.blue + "12",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  supportCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.md,
  },
  supportContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  supportIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  supportText: {
    flex: 1,
  },
  supportTitle: {
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  bundleList: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  addButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: Radius["2xl"],
    ...Shadows.glow,
  },
  addButtonText: {
    fontWeight: "600",
  },
  errorCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.warning + "10",
    borderColor: Colors.warning + "30",
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskActions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.sm,
  },
  taskNotes: {
    marginBottom: Spacing.xs,
  },
  emptyCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    alignItems: "center",
  },
  emptyTitle: {
    marginBottom: Spacing.xs,
  },
});
