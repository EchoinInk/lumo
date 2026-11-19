import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui/Text";
import type {
  PlanningEnergyLevel,
  PlanningNextStep,
} from "@/src/features/planning/types/planning";
import { getPlanningNextStepDisplayLabel } from "@/src/features/planning/services/planningDisplay";
import { usePalette } from "@/theme/usePalette";
import { Spacing } from "@/src/theme/tokens";
import { StyleSheet, View } from "react-native";

export type PlanningDashboardState =
  | "not_planned"
  | "morning_complete"
  | "evening_available"
  | "evening_complete";

interface CalmDailySummaryProps {
  nextStep?: PlanningNextStep;
  energyLevel?: PlanningEnergyLevel;
  carryOverCount: number;
  brainDumpCount: number;
  morningComplete?: boolean;
  eveningCompleted?: boolean;
  showEveningReset?: boolean;
  onOpenPlanning: () => void;
  onEveningReset: () => void;
  onAdjustPlan?: () => void;
  onViewParked?: () => void;
}

function resolveDashboardState(
  morningComplete: boolean,
  eveningCompleted: boolean,
  showEveningReset: boolean,
): PlanningDashboardState {
  if (eveningCompleted) return "evening_complete";
  if (showEveningReset && morningComplete) return "evening_available";
  if (morningComplete) return "morning_complete";
  return "not_planned";
}

export function CalmDailySummary({
  nextStep,
  energyLevel,
  carryOverCount,
  brainDumpCount,
  morningComplete = false,
  eveningCompleted = false,
  showEveningReset = false,
  onOpenPlanning,
  onEveningReset,
  onAdjustPlan,
  onViewParked,
}: CalmDailySummaryProps) {
  const palette = usePalette();

  const state = resolveDashboardState(
    morningComplete,
    eveningCompleted,
    showEveningReset,
  );
  const nextStepLabel = getPlanningNextStepDisplayLabel(nextStep);

  const shapeLine = (() => {
    if (state === "evening_complete") {
      return "Today is closed gently.";
    }
    if (state === "morning_complete") {
      return nextStepLabel
        ? `Start with: ${nextStepLabel}`
        : "Start with one small thing";
    }
    if (nextStepLabel) {
      return `Start with: ${nextStepLabel}`;
    }
    return "Choose one gentle next step when ready.";
  })();

  const supportLine = (() => {
    if (state === "evening_complete") {
      return "Tomorrow can start small.";
    }
    if (state === "morning_complete") {
      return "You can adjust this later.";
    }
    if (state === "not_planned") {
      return "Where am I today? One small step is enough.";
    }
    return undefined;
  })();

  return (
    <Card
      variant="elevated"
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`Today's shape. ${shapeLine}`}
    >
      <Text variant="subheading" style={styles.title}>
        Today's shape
      </Text>

      <View style={styles.lines}>
        <Text variant="body" color={palette.textSecondary}>
          {shapeLine}
        </Text>
        {supportLine && (
          <Text variant="caption" color={palette.textTertiary}>
            {supportLine}
          </Text>
        )}
        {energyLevel && morningComplete && (
          <Text variant="caption" color={palette.textTertiary}>
            Energy: {energyLevel}
          </Text>
        )}
        {carryOverCount > 0 && (
          <Text variant="caption" color={palette.textTertiary}>
            {carryOverCount} thing{carryOverCount === 1 ? "" : "s"} carried
            gently
          </Text>
        )}
        {brainDumpCount > 0 && (
          <Text variant="caption" color={palette.textTertiary}>
            {brainDumpCount} thought{brainDumpCount === 1 ? "" : "s"} waiting
            in Brain Dump
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        {state === "not_planned" && (
          <Button
            size="sm"
            variant="secondary"
            onPress={onOpenPlanning}
            accessibilityRole="button"
            accessibilityLabel="Open morning planning"
            accessibilityHint="Opens the morning planning flow"
          >
            Open planning
          </Button>
        )}
        {state === "evening_available" && (
          <>
            <Button
              size="sm"
              variant="secondary"
              onPress={onEveningReset}
              accessibilityRole="button"
              accessibilityLabel="Evening reset"
              accessibilityHint="Opens the evening reset flow"
            >
              Evening reset
            </Button>
            {onAdjustPlan && (
              <Button
                size="sm"
                variant="ghost"
                onPress={onAdjustPlan}
                accessibilityRole="button"
                accessibilityLabel="Adjust plan"
                accessibilityHint="Reopens morning planning to make changes"
              >
                Adjust plan
              </Button>
            )}
          </>
        )}
        {state === "morning_complete" && onAdjustPlan && (
          <Button
            size="sm"
            variant="secondary"
            onPress={onAdjustPlan}
            accessibilityRole="button"
            accessibilityLabel="Adjust plan"
            accessibilityHint="Reopens morning planning to make changes"
          >
            Adjust plan
          </Button>
        )}
        {onViewParked && (
          <Button
            size="sm"
            variant="ghost"
            onPress={onViewParked}
            accessibilityRole="button"
            accessibilityLabel="View parked"
            accessibilityHint="Opens things saved for later"
          >
            View parked
          </Button>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  title: {
    fontWeight: "600",
  },
  lines: {
    gap: Spacing.xs,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
});
