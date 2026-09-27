import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui/Text";
import { UX } from "@/src/constants/ux";
import { Colors, Spacing } from "@/src/theme/tokens";
import { formatLocalDate } from "@/src/utils/dateTime";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Task, TaskPriority } from "../types/task";

interface TaskRowProps {
  task: Task;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPress?: (task: Task) => void;
  onFocus?: (id: string) => void;
  isFocusTask?: boolean;
  showSecondaryActions?: boolean;
  showMetadata?: boolean;
}

const priorityColors: Record<TaskPriority, string> = {
  high: Colors.dangerSoft,
  medium: Colors.warningSoft,
  low: Colors.infoSoft,
};

const priorityTextColors: Record<TaskPriority, string> = {
  high: Colors.danger,
  medium: Colors.warning,
  low: Colors.info,
};

export const TaskRow = React.memo<TaskRowProps>(
  ({
    task,
    onToggle,
    onDelete,
    onPress,
    onFocus,
    isFocusTask,
    showSecondaryActions = true,
    showMetadata = true,
  }) => {
    const handlePress = React.useCallback(() => {
      onPress?.(task);
    }, [onPress, task]);

    const handleToggle = React.useCallback(() => {
      onToggle?.(task.id);
    }, [onToggle, task.id]);

    const handleDelete = React.useCallback(() => {
      onDelete?.(task.id);
    }, [onDelete, task.id]);

    const handleFocus = React.useCallback(() => {
      onFocus?.(task.id);
    }, [onFocus, task.id]);

    return (
      <Card
        variant={isFocusTask ? "gradient" : "elevated"}
        padding="lg"
        pressable={Boolean(onPress)}
        onPress={handlePress}
        style={isFocusTask ? styles.focusTask : undefined}
      >
        <View style={styles.header}>
          <View style={styles.leftContent}>
            <TouchableOpacity
              onPress={handleToggle}
              style={styles.checkbox}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: task.completed }}
              accessibilityLabel={`Mark ${task.title} as ${task.completed ? "incomplete" : "complete"}`}
              accessibilityHint="Toggles this task's completion state"
            >
              <View
                style={[
                  styles.checkboxBox,
                  task.completed && styles.checkboxChecked,
                ]}
              >
                {task.completed && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
            <View style={styles.textContainer}>
              <Text
                variant="body"
                style={[
                  styles.title,
                  task.completed && styles.completedTitle,
                  isFocusTask && styles.focusTitle,
                ]}
              >
                {task.title}
              </Text>
              {showMetadata && task.description && (
                <Text
                  variant="caption"
                  color={Colors.textSecondary}
                  style={styles.description}
                  numberOfLines={1}
                >
                  {task.description}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.rightContent}>
            {showMetadata && (
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: priorityColors[task.priority] },
                ]}
              >
                <Text
                  variant="small"
                  style={[
                    styles.priorityText,
                    { color: priorityTextColors[task.priority] },
                  ]}
                >
                  {task.priority.charAt(0).toUpperCase() +
                    task.priority.slice(1)}
                </Text>
              </View>
            )}
            {showSecondaryActions && onFocus && !isFocusTask && (
              <TouchableOpacity
                onPress={handleFocus}
                style={styles.focusButton}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Focus on ${task.title}`}
                accessibilityHint="Starts Focus Mode with this task"
              >
                <Text style={styles.focusText}>Focus</Text>
              </TouchableOpacity>
            )}
            {showSecondaryActions && onDelete && (
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.deleteButton}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${task.title}`}
                accessibilityHint="Asks before deleting this task"
              >
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {showMetadata && (task.dueDate || task.dueTime) && (
          <Text
            variant="caption"
            color={Colors.textTertiary}
            style={styles.dueDate}
          >
            Due: {task.dueDate ? formatLocalDate(task.dueDate, {}) : "No date"}
            {task.dueTime ? ` at ${task.dueTime}` : ""}
          </Text>
        )}
      </Card>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.task.id === nextProps.task.id &&
      prevProps.task.title === nextProps.task.title &&
      prevProps.task.description === nextProps.task.description &&
      prevProps.task.completed === nextProps.task.completed &&
      prevProps.task.priority === nextProps.task.priority &&
      prevProps.task.dueDate === nextProps.task.dueDate &&
      prevProps.task.dueTime === nextProps.task.dueTime &&
      prevProps.task.energyRequired === nextProps.task.energyRequired &&
      prevProps.task.recurrence === nextProps.task.recurrence &&
      prevProps.isFocusTask === nextProps.isFocusTask &&
      prevProps.showSecondaryActions === nextProps.showSecondaryActions &&
      prevProps.showMetadata === nextProps.showMetadata
    );
  },
);

TaskRow.displayName = "TaskRow";

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: Spacing.md,
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  checkbox: {
    minWidth: UX.touchTarget,
    minHeight: UX.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -Spacing.xs,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: "bold",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    flex: 1,
  },
  completedTitle: {
    textDecorationLine: "line-through",
    color: Colors.textTertiary,
  },
  focusTitle: {
    fontWeight: "600",
  },
  description: {
    marginTop: Spacing.xs,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  priorityText: {
    fontWeight: "600",
  },
  focusButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    minHeight: UX.touchTarget,
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: Colors.lavender,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  focusText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
    width: UX.touchTarget,
    height: UX.touchTarget,
    borderRadius: 22,
    backgroundColor: Colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: "600",
  },
  dueDate: {
    marginTop: Spacing.sm,
    marginLeft: 36,
  },
  focusTask: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
});
