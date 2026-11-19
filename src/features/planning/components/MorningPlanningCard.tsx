import { Check } from "lucide-react-native";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui/Text";
import { ReducedMotionWrapper } from "@/src/features/calmMode/components/ReducedMotionWrapper";
import { MorningPlanningCompleteCard } from "@/src/features/planning/components/MorningPlanningCompleteCard";
import type {
  BrainDumpConversionTarget,
  BrainDumpEntry,
} from "@/src/features/brain-dump";
import { CarryOverReviewCard } from "@/src/features/planning/components/CarryOverReviewCard";
import { LowEnergyPlanCard } from "@/src/features/planning/components/LowEnergyPlanCard";
import { NextStepChooser } from "@/src/features/planning/components/NextStepChooser";
import type {
  CarryOverItem,
  LowEnergyOption,
  PlanningEnergyLevel,
  PlanningNextStep,
} from "@/src/features/planning/types/planning";
import { usePalette, createThemedValue } from "@/theme/usePalette";
import { Radius, Spacing } from "@/src/theme/tokens";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { BrainDumpReviewQueue } from "./BrainDumpReviewQueue";

interface MorningPlanningCardProps {
  compact?: boolean;
  morningComplete?: boolean;
  energyLevel?: PlanningEnergyLevel;
  carryOverCount?: number;
  brainDumpCount?: number;
  carryOverItems?: CarryOverItem[];
  brainDumpQueue?: import("@/src/features/planning/types/planning").BrainDumpQueueItem[];
  brainDumpEntries?: BrainDumpEntry[];
  nextStepOptions?: PlanningNextStep[];
  lowEnergyOptions?: LowEnergyOption[];
  selectedNextStep?: PlanningNextStep;
  onChooseEnergy?: (level: PlanningEnergyLevel) => void;
  onCarryOver?: (sourceId: string) => void;
  onPark?: (sourceId: string) => void;
  onConvertBrainDump?: (
    entry: BrainDumpEntry,
    target: BrainDumpConversionTarget,
  ) => void;
  onSkipBrainDump?: (entryId: string) => void;
  onSelectNextStep?: (stepId: string) => void;
  onStartNextStep?: (step: PlanningNextStep) => void;
  onPickAnotherNextStep?: () => void;
  onChooseLowEnergy?: (optionId: string) => void;
  onParkLowEnergy?: (
    sourceId: string,
    sourceType: LowEnergyOption["sourceType"],
  ) => void;
  onComplete?: () => void;
  onOpenPlanning?: () => void;
  onReviewBrainDump?: () => void;
  onBackToDashboard?: () => void;
  onOpenTodayFocus?: () => void;
  onAdjustPlan?: () => void;
}

const energyOptions: Array<{
  value: PlanningEnergyLevel;
  label: string;
  hint: string;
}> = [
  {
    value: "low",
    label: "Low",
    hint: "Tiny or quiet — a lighter plan still counts",
  },
  {
    value: "medium",
    label: "Medium",
    hint: "Some effort — choose one small step",
  },
  {
    value: "steady",
    label: "Steady",
    hint: "Ready to focus gently",
  },
];

function PlanningEnergyPicker({
  value,
  onChange,
}: {
  value?: PlanningEnergyLevel;
  onChange: (level: PlanningEnergyLevel) => void;
}) {
  const palette = usePalette();
  const styles = useStyles();

  return (
    <View style={styles.energySection}>
      <Text variant="label" color={palette.textSecondary}>
        How is your energy today?
      </Text>
      <View style={styles.energyOptions} accessibilityRole="radiogroup" accessibilityLabel="Energy level">
        {energyOptions.map((option) => {
          const isSelected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.energyOption, isSelected && styles.energySelected]}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityLabel={`${option.label} energy`}
              accessibilityHint={option.hint}
              accessibilityState={{ checked: isSelected }}
              aria-checked={isSelected}
            >
              {isSelected && <Check size={16} color={palette.selectedText} accessibilityElementsHidden />}
              <Text
                variant="caption"
                color={isSelected ? palette.selectedText : palette.textSecondary}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {value && (
        <Text variant="caption" color={palette.textTertiary}>
          {energyOptions.find((option) => option.value === value)?.hint}
        </Text>
      )}
    </View>
  );
}

export function MorningPlanningCard({
  compact = false,
  morningComplete = false,
  energyLevel,
  carryOverCount = 0,
  brainDumpCount = 0,
  carryOverItems = [],
  brainDumpQueue = [],
  brainDumpEntries = [],
  nextStepOptions = [],
  lowEnergyOptions = [],
  selectedNextStep,
  onChooseEnergy = () => {},
  onCarryOver = () => {},
  onPark = () => {},
  onConvertBrainDump = () => {},
  onSkipBrainDump = () => {},
  onSelectNextStep = () => {},
  onStartNextStep = () => {},
  onPickAnotherNextStep = () => {},
  onChooseLowEnergy = () => {},
  onParkLowEnergy = () => {},
  onComplete,
  onOpenPlanning,
  onReviewBrainDump,
  onBackToDashboard,
  onOpenTodayFocus,
  onAdjustPlan,
}: MorningPlanningCardProps) {
  const palette = usePalette();
  const styles = useStyles();

  if (compact) {
    if (morningComplete) {
      return null;
    }

    return (
      <ReducedMotionWrapper>
        <Card variant="outlined" style={styles.compactCard}>
          <Text variant="body" color={palette.textSecondary}>
            Shape your day with one gentle next step.
          </Text>
          <Button
            size="sm"
            variant="secondary"
            onPress={onOpenPlanning}
            accessibilityRole="button"
            accessibilityLabel="Open morning planning"
            accessibilityHint="Opens the full morning planning flow"
          >
            Open planning
          </Button>
        </Card>
      </ReducedMotionWrapper>
    );
  }

  if (morningComplete && onBackToDashboard) {
    return (
      <MorningPlanningCompleteCard
        energyLevel={energyLevel}
        nextStep={selectedNextStep}
        carryOverCount={carryOverCount}
        brainDumpCount={brainDumpCount}
        onBackToDashboard={onBackToDashboard}
        onOpenTodayFocus={onOpenTodayFocus}
        onAdjustPlan={onAdjustPlan}
      />
    );
  }

  return (
    <ReducedMotionWrapper>
      <Card variant="plain" style={styles.card}>
        <Text variant="body" color={palette.textSecondary}>
          {energyLevel === "low"
            ? "Let's keep today light."
            : energyLevel === "steady"
              ? "Choose one step that feels steady today."
              : "Gently shape what today needs."}
        </Text>

        <PlanningEnergyPicker value={energyLevel} onChange={onChooseEnergy} />

        {!energyLevel ? null : energyLevel === "low" ? (
          <>
            <LowEnergyPlanCard
              embedded
              options={lowEnergyOptions}
              selectedSource={selectedNextStep}
              onChoose={onChooseLowEnergy}
              onPark={onParkLowEnergy}
            />
            {selectedNextStep && (
              <Button
                onPress={onComplete}
                accessibilityRole="button"
                accessibilityLabel="Complete planning"
                accessibilityHint="Confirms your morning plan"
              >
                Complete planning
              </Button>
            )}
          </>
        ) : (
          <>
            <Text variant="label" color={palette.textSecondary}>
              Gentle carry-over
            </Text>
            <CarryOverReviewCard
              items={carryOverItems}
              onCarryOver={onCarryOver}
              onPark={onPark}
            />

            {brainDumpQueue.length > 0 && (
              <>
                <Text variant="label" color={palette.textSecondary}>
                  Brain Dump review
                </Text>
                <BrainDumpReviewQueue
                  items={brainDumpQueue}
                  entries={brainDumpEntries}
                  onConvert={onConvertBrainDump}
                  onSkip={onSkipBrainDump}
                  onReviewAll={onReviewBrainDump}
                />
              </>
            )}

            <Text variant="label" color={palette.textSecondary}>
              Choose one next step
            </Text>
            <NextStepChooser
              options={nextStepOptions}
              selectedId={selectedNextStep?.id}
              energyLevel={energyLevel}
              onSelect={onSelectNextStep}
              onStart={(step) => {
                onSelectNextStep(step.id);
                onStartNextStep(step);
              }}
              onPickAnother={onPickAnotherNextStep}
            />

            {selectedNextStep && (
              <Button
                onPress={onComplete}
                accessibilityRole="button"
                accessibilityLabel="Complete planning"
                accessibilityHint="Confirms your morning plan"
              >
                Complete planning
              </Button>
            )}
          </>
        )}
      </Card>
    </ReducedMotionWrapper>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  card: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  compactCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  energySection: {
    gap: Spacing.sm,
  },
  energyOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  energyOption: {
    flexGrow: 1,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: palette.controlOutline,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: palette.card,
  },
  energySelected: {
    backgroundColor: palette.selectedFill,
    borderColor: palette.selectedEdge,
  },
}));
