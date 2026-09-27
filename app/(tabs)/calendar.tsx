import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Text } from "@/src/components/ui/Text";
import { getTasksForCalendarDate } from "@/src/features/calendar/utils/calendarTasks";
import { useTasks } from "@/src/features/tasks";
import { TaskFormModal } from "@/src/features/tasks/components/TaskFormModal";
import type { CreateTaskInput, Task } from "@/src/features/tasks/types/task";
import { useLocalDay } from "@/src/hooks/useLocalDay";
import { Colors, Radius, Spacing } from "@/src/theme/tokens";
import {
  addLocalDays,
  formatLocalDate,
  weekdayIndexForLocalDate,
  type LocalDateKey,
} from "@/src/utils/dateTime";
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

function buildVisibleWeek(anchor: LocalDateKey, todayKey: LocalDateKey) {
  const day = weekdayIndexForLocalDate(anchor);
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = addLocalDays(anchor, mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const dateKey = addLocalDays(start, index);
    return {
      day: formatLocalDate(dateKey, { weekday: "short" }).slice(0, 1),
      date: String(Number(dateKey.slice(8, 10))),
      dateKey,
      isToday: dateKey === todayKey,
    };
  });
}

export default function CalendarScreen() {
  const todayKey = useLocalDay();
  const [weekAnchor, setWeekAnchor] = useState<LocalDateKey>(todayKey);
  const weekDays = buildVisibleWeek(weekAnchor, todayKey);
  const [selectedDate, setSelectedDate] = useState<LocalDateKey>(todayKey);
  const previousToday = useRef(todayKey);
  const [isTaskFormVisible, setIsTaskFormVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const { tasks, createTask, updateTask, toggleTask, deleteTask, mutationError } = useTasks();

  useEffect(() => {
    if (previousToday.current !== todayKey) {
      if (selectedDate === previousToday.current) {
        setSelectedDate(todayKey);
        setWeekAnchor(todayKey);
      }
      previousToday.current = todayKey;
    }
  }, [selectedDate, todayKey]);
  const selectedTasks = getTasksForCalendarDate(tasks, selectedDate);
  const selectedLabel =
    selectedDate === todayKey
      ? "Today's schedule"
      : formatLocalDate(selectedDate, {
          weekday: "long",
          month: "short",
          day: "numeric",
        });
  const shiftWeek = (days: number) => {
    setWeekAnchor((current) => {
      const next = addLocalDays(current, days);
      const nextWeek = buildVisibleWeek(next, todayKey);
      setSelectedDate(nextWeek[0]?.dateKey ?? next);
      return next;
    });
  };
  const openCreateTask = () => {
    setSelectedTask(undefined);
    setIsTaskFormVisible(true);
  };
  const openEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskFormVisible(true);
  };
  const handleTaskSubmit = async (input: CreateTaskInput) => {
    if (selectedTask) {
      await updateTask(selectedTask.id, input);
    } else {
      await createTask(input);
    }
  };
  const confirmDeleteTask = (task: Task) => {
    Alert.alert("Delete this task?", "This removes it from Tasks and Calendar.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void deleteTask(task.id).catch(() => undefined),
      },
    ]);
  };

  return (
    <Screen scrollable padded>
      <SectionHeader
        title="Schedule"
        subtitle="A calm view of your day"
        rightElement={
          <View style={styles.headerControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => shiftWeek(-7)}
              accessibilityRole="button"
              accessibilityLabel="Previous week"
              accessibilityHint="Shows the previous week"
            >
              <ChevronLeft size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => shiftWeek(7)}
              accessibilityRole="button"
              accessibilityLabel="Next week"
              accessibilityHint="Shows the next week"
            >
              <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={() => {
                setWeekAnchor(todayKey);
                setSelectedDate(todayKey);
              }}
              accessibilityRole="button"
              accessibilityLabel="Go to today"
              accessibilityHint="Selects today in the current calendar"
            >
              <CalendarIcon size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        }
      />

      <Card variant="elevated" style={styles.weekStrip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekStripContent}
        >
          {weekDays.map((item) => {
            const isSelected = selectedDate === item.dateKey;
            return (
              <TouchableOpacity
                key={item.dateKey}
                onPress={() => setSelectedDate(item.dateKey)}
                style={[
                  styles.dayItem,
                  item.isToday && styles.dayItemToday,
                  isSelected && styles.dayItemSelected,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${item.day} ${item.date}`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  variant="caption"
                  color={
                    item.isToday || isSelected
                      ? Colors.textInverse
                      : Colors.textSecondary
                  }
                >
                  {item.day}
                </Text>
                <Text
                  variant="body"
                  color={
                    item.isToday || isSelected
                      ? Colors.textInverse
                      : Colors.textPrimary
                  }
                  style={styles.dayDate}
                >
                  {item.date}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Card>

      <SectionHeader title={selectedLabel} />
      {mutationError && (
        <Card variant="outlined" style={styles.errorCard}>
          <Text variant="small" color={Colors.danger} accessibilityRole="alert">
            {mutationError}
          </Text>
        </Card>
      )}
      <Button
        size="sm"
        onPress={openCreateTask}
        style={styles.addTaskButton}
        accessibilityLabel={`Add task for ${selectedLabel}`}
      >
        <Plus size={16} color={Colors.textInverse} />
        Add task
      </Button>
      {selectedTasks.length > 0 ? (
        <View style={styles.taskList}>
          {selectedTasks.map((task) => (
            <Card key={task.id} variant="outlined" style={styles.taskCard}>
              <TouchableOpacity
                onPress={() => void toggleTask(task.id).catch(() => undefined)}
                style={styles.taskCompletion}
                accessibilityRole="button"
                accessibilityLabel={`${task.completed ? "Mark pending" : "Complete"}: ${task.title}`}
              >
                <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
                  {task.completed && <Check size={15} color={Colors.textInverse} />}
                </View>
                <View style={styles.taskDetails}>
                  <Text variant="body" style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                    {task.title}
                  </Text>
                  <Text variant="caption" color={Colors.textTertiary}>
                    {task.dueTime ? `At ${task.dueTime}` : "Any time"}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={styles.taskActions}>
                <TouchableOpacity
                  onPress={() => openEditTask(task)}
                  style={styles.taskAction}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit task: ${task.title}`}
                >
                  <Pencil size={17} color={Colors.textTertiary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => confirmDeleteTask(task)}
                  style={styles.taskAction}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete task: ${task.title}`}
                >
                  <Trash2 size={17} color={Colors.textTertiary} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <Card variant="outlined" style={styles.emptyCard}>
          <Text variant="body" color={Colors.textSecondary}>
            Nothing needs your attention here yet.
          </Text>
          <Text variant="caption" color={Colors.textTertiary}>
            Tasks with this date will appear here.
          </Text>
        </Card>
      )}
      <TaskFormModal
        visible={isTaskFormVisible}
        mode={selectedTask ? "edit" : "create"}
        initialTask={selectedTask}
        initialDueDate={selectedTask ? undefined : selectedDate}
        onSubmit={handleTaskSubmit}
        onClose={() => {
          setIsTaskFormVisible(false);
          setSelectedTask(undefined);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  controlButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.lavender,
    borderRadius: Radius.md,
    marginLeft: Spacing.xs,
  },
  weekStrip: {
    marginBottom: Spacing.xl,
    padding: Spacing.md,
  },
  weekStripContent: {
    gap: Spacing.sm,
  },
  dayItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
    minWidth: 48,
    minHeight: 44,
  },
  dayItemToday: {
    backgroundColor: Colors.pink,
  },
  dayItemSelected: {
    backgroundColor: Colors.primary,
  },
  dayDate: {
    marginTop: Spacing.xs,
    fontWeight: "600",
  },
  emptyCard: {
    gap: Spacing.xs,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  taskList: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  taskCard: {
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  taskCompletion: { flex: 1, flexDirection: "row", alignItems: "center", gap: Spacing.md, minHeight: 44 },
  taskDetails: { flex: 1, gap: Spacing.xs },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  checkboxCompleted: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  taskTitle: {
    fontWeight: "600",
  },
  taskTitleCompleted: { textDecorationLine: "line-through", color: Colors.textTertiary },
  taskActions: { flexDirection: "row", gap: Spacing.xs },
  taskAction: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  addTaskButton: { alignSelf: "flex-start", marginBottom: Spacing.md },
  errorCard: { padding: Spacing.md, marginBottom: Spacing.md, borderColor: Colors.danger },
});
