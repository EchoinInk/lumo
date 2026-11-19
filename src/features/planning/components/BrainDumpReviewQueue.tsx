import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui/Text";
import type {
  BrainDumpConversionTarget,
  BrainDumpEntry,
} from "@/src/features/brain-dump";
import type { BrainDumpQueueItem } from "@/src/features/planning/types/planning";
import { usePalette } from "@/theme/usePalette";
import { Spacing } from "@/src/theme/tokens";
import { StyleSheet, View } from "react-native";

interface BrainDumpReviewQueueProps {
  items: BrainDumpQueueItem[];
  entries: BrainDumpEntry[];
  onConvert: (entry: BrainDumpEntry, target: BrainDumpConversionTarget) => void;
  onSkip: (entryId: string) => void;
  onReviewAll?: () => void;
  compact?: boolean;
}

export function BrainDumpReviewQueue({
  items,
  entries,
  onConvert,
  onSkip,
  onReviewAll,
  compact = false,
}: BrainDumpReviewQueueProps) {
  const palette = usePalette();

  if (items.length === 0) {
    return (
      <Card variant="outlined" style={styles.card}>
        <Text variant="body" color={palette.textSecondary}>
          Your Brain Dump is clear for the moment.
        </Text>
      </Card>
    );
  }

  const entryMap = new Map(entries.map((entry) => [entry.id, entry]));
  const visibleItems = compact ? items.slice(0, 1) : items;

  return (
    <View style={styles.list}>
      {visibleItems.map((item) => {
        const entry = entryMap.get(item.sourceId);
        if (!entry) return null;

        return (
          <Card key={item.id} variant="outlined" style={styles.card}>
            <Text variant="caption" color={palette.primary}>
              {item.reason}
            </Text>
            <Text variant="body" style={styles.label}>
              {item.label}
            </Text>
            <View style={styles.actions}>
              <Button
                size="sm"
                variant="secondary"
                onPress={() => onConvert(entry, "task")}
                accessibilityRole="button"
                accessibilityLabel={`Convert ${item.label} to task`}
                accessibilityHint="Turns this thought into a task"
              >
                Task
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onPress={() => onConvert(entry, "reminder")}
                accessibilityRole="button"
                accessibilityLabel={`Convert ${item.label} to reminder`}
                accessibilityHint="Turns this thought into a reminder"
              >
                Reminder
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onPress={() => onConvert(entry, "routine_idea")}
                accessibilityRole="button"
                accessibilityLabel={`Save ${item.label} as routine idea`}
                accessibilityHint="Saves this as a routine idea for later"
              >
                Routine
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onPress={() => onSkip(entry.id)}
                accessibilityRole="button"
                accessibilityLabel={`Park ${item.label}`}
                accessibilityHint="Archives this thought without converting it"
              >
                Park
              </Button>
            </View>
          </Card>
        );
      })}

      {onReviewAll && items.length > (compact ? 1 : 0) && (
        <Button
          variant="ghost"
          onPress={onReviewAll}
          accessibilityRole="button"
          accessibilityLabel="Review Brain Dump queue"
          accessibilityHint="Opens the full Brain Dump review"
        >
          Review queue
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.md,
  },
  card: {
    gap: Spacing.sm,
  },
  label: {
    fontWeight: "600",
    lineHeight: 24,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
