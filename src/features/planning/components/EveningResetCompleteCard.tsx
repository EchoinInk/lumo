import { MiriState } from "@/components/feedback/MiriState";
import { Bookmark, CornerUpRight } from "lucide-react-native";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui/Text";
import { PlanningGentleFade } from "@/src/features/planning/components/PlanningGentleFade";
import { usePalette } from "@/theme/usePalette";
import { Spacing } from "@/src/theme/tokens";
import { StyleSheet, View } from "react-native";

interface EveningResetCompleteCardProps {
  carriedCount: number;
  parkedCount: number;
  brainDumpVisited: boolean;
  onBackToDashboard: () => void;
  onAdjustReset?: () => void;
}

export function EveningResetCompleteCard({
  carriedCount,
  parkedCount,
  brainDumpVisited,
  onBackToDashboard,
  onAdjustReset,
}: EveningResetCompleteCardProps) {
  const palette = usePalette();

  return (
    <PlanningGentleFade>
      <Card variant="plain" style={[styles.card, { backgroundColor: palette.resetPanel }]}>
        {!palette.quiet && <MiriState state="resting" size={72} decorative />}
        <Text variant="subheading" style={styles.title}>
          Today is closed gently.
        </Text>
        <Text variant="body" color={palette.textSecondary}>
          Tomorrow can start small. You're allowed to stop here.
        </Text>

        <View style={styles.details}>
          {carriedCount > 0 && (
            <View style={styles.countRow}>
              <CornerUpRight size={17} color={palette.textSecondary} />
              <Text style={{ flexShrink: 1 }} variant="caption" color={palette.textTertiary}>
                {carriedCount} thing{carriedCount === 1 ? "" : "s"} carried to tomorrow
              </Text>
            </View>
          )}
          {parkedCount > 0 && (
            <View style={styles.countRow}>
              <Bookmark size={17} color={palette.textSecondary} />
              <Text style={{ flexShrink: 1 }} variant="caption" color={palette.textTertiary}>
                {parkedCount} thing{parkedCount === 1 ? "" : "s"} parked for later
              </Text>
            </View>
          )}
          {brainDumpVisited && (
            <Text variant="caption" color={palette.textTertiary}>
              Brain Dump is ready if anything else comes up
            </Text>
          )}
          {carriedCount === 0 && parkedCount === 0 && !brainDumpVisited && (
            <Text variant="caption" color={palette.textTertiary}>
              Anything unfinished has somewhere to land.
            </Text>
          )}
        </View>
      </Card>
      <View style={styles.actions}>
        <Button
          onPress={onBackToDashboard}
          accessibilityRole="button"
          accessibilityLabel="Back to Dashboard"
          accessibilityHint="Returns to the Dashboard"
        >
          Back to Dashboard
        </Button>
        {onAdjustReset && (
          <Button
            variant="secondary"
            onPress={onAdjustReset}
            accessibilityRole="button"
            accessibilityLabel="Adjust reset"
            accessibilityHint="Reopens evening reset to change what carries forward"
          >
            Adjust reset
          </Button>
        )}
      </View>
    </PlanningGentleFade>
  );
}

const styles = StyleSheet.create({
  countRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  title: {
    fontWeight: "600",
  },
  details: {
    gap: Spacing.xs,
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
