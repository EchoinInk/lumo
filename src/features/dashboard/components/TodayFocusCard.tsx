import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui/Text";
import { Task } from "@/src/features/tasks/types/task";
import { usePalette, createThemedValue } from "@/theme/usePalette";
import { Radius, Spacing } from "@/src/theme/tokens";
import { CheckCircle2, Circle } from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface TodayFocusCardProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onAddPress: () => void;
  emptyMessage?: string;
}

const usePriorityColors = createThemedValue((palette): Record<string, string> => ({
  high: palette.pink,
  medium: palette.warning,
  low: palette.blue,
}));

export function TodayFocusCard({
  tasks,
  onToggle,
  onAddPress,
  emptyMessage = "Nothing lined up here. You can add one small step when you're ready.",
}: TodayFocusCardProps) {
  const palette = usePalette();
  const styles = useStyles();
  const priorityColors = usePriorityColors();

  if (tasks.length === 0) {
    return (
      <Card variant="outlined" style={styles.emptyCard}>
        <Text
          variant="body"
          color={palette.textSecondary}
          style={styles.emptyText}
        >
          {emptyMessage}
        </Text>
        <TouchableOpacity
          onPress={onAddPress}
          activeOpacity={0.7}
          style={styles.linkButton}
          accessibilityRole="button"
          accessibilityLabel="Add a task"
          accessibilityHint="Opens Tasks so you can add one small step"
        >
          <Text variant="caption" color={palette.purple}>
            Add a task →
          </Text>
        </TouchableOpacity>
      </Card>
    );
  }

  return (
    <Card variant="elevated" style={styles.card}>
      <Text variant="subheading" style={styles.title}>
        One next step
      </Text>
      <Text variant="caption" color={palette.textSecondary} style={styles.subtitle}>
        Pick one small thing. That counts.
      </Text>

      <View style={styles.taskList}>
        {tasks.slice(0, 3).map((task) => {
          const isCompleted = task.completed;
          const priorityColor =
            priorityColors[task.priority] || palette.textSecondary;

          return (
            <TouchableOpacity
              key={task.id}
              style={styles.taskRow}
              onPress={() => onToggle(task.id)}
              activeOpacity={0.7}
              accessibilityLabel={`${isCompleted ? "Completed" : "Pending"} task: ${task.title}`}
              accessibilityRole="button"
              accessibilityHint="Toggles this task's completion state"
            >
              <View
                style={[
                  styles.checkbox,
                  isCompleted && styles.checkboxChecked,
                  !isCompleted &&
                    task.priority === "high" && {
                      borderColor: priorityColor,
                      backgroundColor: priorityColor + "10",
                    },
                ]}
              >
                {isCompleted ? (
                  <CheckCircle2 size={18} color={palette.textInverse} />
                ) : (
                  <Circle
                    size={18}
                    color={isCompleted ? palette.border : priorityColor}
                  />
                )}
              </View>

              <View style={styles.taskInfo}>
                <Text
                  variant="body"
                  style={[
                    styles.taskTitle,
                    isCompleted && styles.taskTitleCompleted,
                  ]}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {tasks.length > 3 && (
        <TouchableOpacity
          onPress={onAddPress}
          activeOpacity={0.7}
          style={styles.moreLink}
          accessibilityRole="button"
          accessibilityLabel={`View ${tasks.length - 3} more tasks`}
          accessibilityHint="Opens the Tasks screen"
        >
          <Text variant="caption" color={palette.textSecondary}>
            + {tasks.length - 3} more tasks
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  card: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
    fontWeight: "600",
  },
  subtitle: {
    marginBottom: Spacing.md,
  },
  taskList: {
    gap: Spacing.sm,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    minHeight: 44,
    paddingVertical: Spacing.sm,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: palette.success,
    borderColor: palette.success,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontWeight: "500",
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: palette.textTertiary,
  },
  moreLink: {
    marginTop: Spacing.sm,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  emptyCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyText: {
    textAlign: "center",
  },
  linkButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
  },
}));
