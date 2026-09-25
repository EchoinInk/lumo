import { Screen } from "@/src/components/ui/Screen";
import { ScreenBackButton } from "@/src/components/ui/ScreenBackButton";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Button } from "@/src/components/ui/Button";
import { EveningResetCard } from "@/src/features/planning/components/EveningResetCard";
import { useDailyPlanningFlow } from "@/src/features/planning/hooks/useDailyPlanningFlow";
import { Spacing } from "@/src/theme/tokens";
import { router } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";

export function EveningPlanningScreen() {
  const flow = useDailyPlanningFlow("evening");

  const handleFinish = useCallback(() => {
    flow.completeEveningReset();
  }, [flow]);

  const handleAdjustReset = useCallback(() => {
    flow.resetEveningReset();
  }, [flow]);

  const handleBackToDashboard = useCallback(() => {
    router.back();
  }, []);

  const handleAddToBrainDump = useCallback(() => {
    flow.markEveningBrainDumpVisited();
    router.push({ pathname: "/brain-dump" as const } as any);
  }, [flow]);

  return (
    <Screen scrollable padded>
      <ScreenBackButton fallbackPath="/(tabs)" />
      <SectionHeader
        title="Evening reset"
        subtitle={
          flow.summary.eveningCompleted
            ? "Today is closed gently"
            : "Close the loop without making it a project"
        }
      />
      <EveningResetCard
        carryOverItems={flow.carryOverItems}
        eveningCompleted={flow.summary.eveningCompleted}
        carriedCount={flow.summary.eveningCarriedIds.length}
        parkedCount={flow.eveningParkedItems.length}
        brainDumpVisited={flow.summary.eveningBrainDumpVisited}
        onCarryToTomorrow={flow.carryToTomorrow}
        onPark={flow.parkItem}
        onAddToBrainDump={handleAddToBrainDump}
        onFinishReset={handleFinish}
        onBackToDashboard={handleBackToDashboard}
        onAdjustReset={handleAdjustReset}
      />
    </Screen>
  );
}

export function PlanningHubScreen() {
  return (
    <Screen scrollable padded>
      <SectionHeader
        title="Daily planning"
        subtitle="Shape your day gently"
      />
      <View style={styles.actions}>
        <Button
          onPress={() =>
            router.push({ pathname: "/planning/morning" as const } as any)
          }
          accessibilityRole="button"
          accessibilityLabel="Morning planning"
          accessibilityHint="Opens the morning planning flow"
        >
          Morning planning
        </Button>
        <Button
          variant="secondary"
          onPress={() =>
            router.push({ pathname: "/planning/evening" as const } as any)
          }
          accessibilityRole="button"
          accessibilityLabel="Evening reset"
          accessibilityHint="Opens the evening reset flow"
        >
          Evening reset
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: Spacing.md,
  },
});
