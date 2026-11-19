import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui/Text";
import type { FocusSuggestion } from "@/src/features/dashboard/utils/focusSuggestions";
import { usePalette } from "@/theme/usePalette";
import { Spacing } from "@/src/theme/tokens";
import { Play, CheckCircle2 } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { GentleSnoozeActions } from "./GentleSnoozeActions";

interface NextStepCardProps {
  suggestion: FocusSuggestion;
  onStart: (taskId: string) => void;
  onDone: (taskId: string) => void;
  onSnooze: (taskId: string) => void;
  onLater: (taskId: string) => void;
}

export function NextStepCard({
  suggestion,
  onStart,
  onDone,
  onSnooze,
  onLater,
}: NextStepCardProps) {
  const palette = usePalette();

  const { task, reason } = suggestion;

  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.header}>
        <Text variant="caption" color={palette.primary} style={styles.reason}>
          {reason}
        </Text>
        <Text variant="body" style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>
      </View>

      <View style={styles.primaryActions}>
        <Button
          size="sm"
          onPress={() => onStart(task.id)}
          leftIcon={<Play size={16} color={palette.textInverse} />}
          accessibilityLabel={`Start ${task.title}`}
          accessibilityHint="Starts Focus Mode for this task"
        >
          Start
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => onDone(task.id)}
          leftIcon={<CheckCircle2 size={16} color={palette.textInverse} />}
          accessibilityLabel={`Mark ${task.title} done`}
          accessibilityHint="Marks this task as done"
        >
          Done
        </Button>
      </View>

      <GentleSnoozeActions
        onSnooze={() => onSnooze(task.id)}
        onLater={() => onLater(task.id)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  header: {
    gap: Spacing.xs,
  },
  reason: {
    fontWeight: "600",
  },
  title: {
    fontWeight: "600",
  },
  primaryActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
});
