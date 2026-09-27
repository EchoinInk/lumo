import { Screen } from "@/src/components/ui/Screen";
import { ScreenBackButton } from "@/src/components/ui/ScreenBackButton";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import type {
  BrainDumpConversionTarget,
  BrainDumpEntry,
} from "@/src/features/brain-dump";
import { convertBrainDumpEntry, useBrainDump } from "@/src/features/brain-dump";
import { useFocusMode } from "@/src/features/focus/hooks/useFocusMode";
import { MorningPlanningCard } from "@/src/features/planning/components/MorningPlanningCard";
import { useDailyPlanningFlow } from "@/src/features/planning/hooks/useDailyPlanningFlow";
import type { PlanningNextStep } from "@/src/features/planning/types/planning";
import { useReminders } from "@/src/features/reminders";
import { useTasks } from "@/src/features/tasks";
import { router } from "expo-router";
import { useCallback } from "react";
import { Alert } from "react-native";

export function MorningPlanningScreen() {
  const flow = useDailyPlanningFlow("morning");
  const { createTask } = useTasks();
  const brainDump = useBrainDump();
  const { openEntries } = brainDump;
  const reminders = useReminders();
  const { enableFocusMode, setActiveFocusTask } = useFocusMode();

  const handleConvert = useCallback(
    async (entry: BrainDumpEntry, target: BrainDumpConversionTarget) => {
      try {
        await convertBrainDumpEntry(entry, target, {
          beginConversion: brainDump.beginConversion,
          completeConversion: brainDump.convertEntry,
          createTask,
          createReminder: reminders.addReminder,
        });
      } catch {
        Alert.alert(
          "Conversion wasn't completed",
          "Your note is still here. Please try converting it again.",
        );
      }
    },
    [brainDump.beginConversion, brainDump.convertEntry, createTask, reminders.addReminder],
  );

  const handleStart = useCallback(
    (step: PlanningNextStep) => {
      flow.chooseNextStep(step.id);
      if (step.sourceType === "task") {
        setActiveFocusTask(step.sourceId);
        enableFocusMode(step.sourceId);
      }
    },
    [flow, setActiveFocusTask, enableFocusMode],
  );

  const handlePickAnother = useCallback(() => {
    const currentIndex = flow.nextStepOptions.findIndex(
      (step) => step.id === flow.selectedNextStep?.id,
    );
    const next =
      flow.nextStepOptions[(currentIndex + 1) % flow.nextStepOptions.length];
    if (next) {
      flow.chooseNextStep(next.id);
    }
  }, [flow]);

  const handleChooseLowEnergy = useCallback(
    (optionId: string) => {
      flow.chooseNextStep(optionId);
    },
    [flow],
  );

  const handleComplete = useCallback(() => {
    flow.completeMorningPlan();
  }, [flow]);

  const handleBackToDashboard = useCallback(() => {
    router.back();
  }, []);

  const handleAdjustPlan = useCallback(() => {
    flow.resetMorningPlan();
  }, [flow]);

  return (
    <Screen scrollable padded>
      <ScreenBackButton fallbackPath="/(tabs)" />
      <SectionHeader
        title="Morning planning"
        subtitle={
          flow.morningComplete
            ? "Today has a gentle shape"
            : "One small step is enough"
        }
      />
      <MorningPlanningCard
        morningComplete={flow.morningComplete}
        energyLevel={flow.energyLevel}
        carryOverCount={flow.carryOverBacklogCount}
        brainDumpCount={flow.brainDumpBacklogCount}
        carryOverItems={flow.carryOverItems}
        brainDumpQueue={flow.brainDumpQueue}
        brainDumpEntries={openEntries}
        nextStepOptions={flow.nextStepOptions}
        lowEnergyOptions={flow.lowEnergyOptions}
        selectedNextStep={flow.selectedNextStep}
        onChooseEnergy={flow.chooseEnergyLevel}
        onCarryOver={flow.carryOverItem}
        onPark={flow.parkItem}
        onConvertBrainDump={handleConvert}
        onSkipBrainDump={(id) => flow.parkItem(id, "brainDump")}
        onSelectNextStep={flow.chooseNextStep}
        onStartNextStep={handleStart}
        onPickAnotherNextStep={handlePickAnother}
        onChooseLowEnergy={handleChooseLowEnergy}
        onParkLowEnergy={flow.parkItem}
        onComplete={handleComplete}
        onReviewBrainDump={() =>
          router.push({ pathname: "/brain-dump" as const } as any)
        }
        onBackToDashboard={handleBackToDashboard}
        onOpenTodayFocus={handleBackToDashboard}
        onAdjustPlan={handleAdjustPlan}
      />
    </Screen>
  );
}
