/**
 * FocusTaskCard
 *
 * A card that emphasizes one task in Focus Mode.
 * Large touch target, clear completion action, no clutter.
 */

import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { createThemedValue } from "@/theme/usePalette";
import { Spacing, Typography } from "@/src/theme/tokens";
import { StyleSheet, Text, View } from "react-native";

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface FocusTaskCardProps {
  task: Task;
  onComplete: () => void;
  onTaskPress?: () => void;
}

export function FocusTaskCard({
  task,
  onComplete,
  onTaskPress,
}: FocusTaskCardProps) {
  const styles = useStyles();

  return (
    <Card padding="lg" pressable={!!onTaskPress} onPress={onTaskPress}>
      <View style={styles.container}>
        <Text
          style={[styles.title, task.completed && styles.titleCompleted]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        <Button
          onPress={onComplete}
          variant={task.completed ? "secondary" : "primary"}
          size="lg"
          accessibilityLabel={
            task.completed ? "Mark as incomplete" : "Mark as complete"
          }
          accessibilityHint={
            task.completed
              ? "Mark this task as not done"
              : "Mark this task as done"
          }
        >
          {task.completed ? "Undo" : "Complete"}
        </Button>
      </View>
    </Card>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  title: {
    ...Typography.heading,
    color: palette.textPrimary,
    lineHeight: 28,
  },
  titleCompleted: {
    color: palette.textSecondary,
    textDecorationLine: "line-through",
  },
}));
