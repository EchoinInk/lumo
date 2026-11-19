import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui/Text";
import { PlanningGentleFade } from "@/src/features/planning/components/PlanningGentleFade";
import { getPlanningNextStepDisplayLabel } from "@/src/features/planning/services/planningDisplay";
import type {
  PlanningEnergyLevel,
  PlanningNextStep,
} from "@/src/features/planning/types/planning";
import { usePalette } from "@/theme/usePalette";
import { Spacing } from "@/src/theme/tokens";
import { StyleSheet, View } from "react-native";

const energyLabels: Record<PlanningEnergyLevel, string> = {
  low: "Low",
  medium: "Medium",
  steady: "Steady",
};

interface MorningPlanningCompleteCardProps {
  energyLevel?: PlanningEnergyLevel;
  nextStep?: PlanningNextStep;
  carryOverCount: number;
  brainDumpCount: number;
  onBackToDashboard: () => void;
  onOpenTodayFocus?: () => void;
  onAdjustPlan?: () => void;
}

export function MorningPlanningCompleteCard({
  energyLevel,
  nextStep,
  carryOverCount,
  brainDumpCount,
  onBackToDashboard,
  onOpenTodayFocus,
  onAdjustPlan,
}: MorningPlanningCompleteCardProps) {
  const palette = usePalette();

  const nextStepLabel = getPlanningNextStepDisplayLabel(nextStep);

  return (
    <PlanningGentleFade>
      <Card variant="plain" style={styles.card}>
        <Text variant="subheading" style={styles.title}>
          Today has a gentle shape.
        </Text>
        <Text variant="body" color={palette.textSecondary}>
          Start with one small thing. You can adjust this later.
        </Text>

        <View style={styles.details}>
          {energyLevel && (
            <Text variant="caption" color={palette.textTertiary}>
              Energy: {energyLabels[energyLevel]}
            </Text>
          )}
          {nextStepLabel && (
            <Text variant="body" style={styles.nextStep}>
              Start with: {nextStepLabel}
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
          <Text variant="caption" color={palette.textTertiary}>
            The rest can stay parked.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            onPress={onBackToDashboard}
            accessibilityRole="button"
            accessibilityLabel="Back to Dashboard"
            accessibilityHint="Returns to the Dashboard"
          >
            Back to Dashboard
          </Button>
          {onOpenTodayFocus && (
            <Button
              variant="secondary"
              onPress={onOpenTodayFocus}
              accessibilityRole="button"
              accessibilityLabel="Open Today Focus"
              accessibilityHint="Returns to Dashboard Today Focus section"
            >
              Open Today Focus
            </Button>
          )}
          {onAdjustPlan && (
            <Button
              variant="secondary"
              onPress={onAdjustPlan}
              accessibilityRole="button"
              accessibilityLabel="Adjust today's plan"
              accessibilityHint="Reopens morning planning to make changes"
            >
              Adjust plan
            </Button>
          )}
        </View>
      </Card>
    </PlanningGentleFade>
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
  details: {
    gap: Spacing.xs,
  },
  nextStep: {
    fontWeight: "600",
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
