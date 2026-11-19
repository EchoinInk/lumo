/**
 * Onboarding Step 1: Struggle Areas
 * "What feels hardest right now?"
 */

import { Text } from "@/src/components/ui/Text";
import { ChoiceChip } from "@/src/features/onboarding/components/ChoiceChip";
import { OnboardingShell } from "@/src/features/onboarding/components/OnboardingShell";
import { useOnboarding } from "@/src/features/onboarding/hooks/useOnboarding";
import {
    STRUGGLE_AREA_LABELS,
    StruggleArea,
} from "@/src/features/onboarding/types/onboarding";
import { usePalette } from "@/theme/usePalette";
import { Spacing } from "@/src/theme/tokens";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

const STRUGGLE_OPTIONS: StruggleArea[] = [
  "remembering_tasks",
  "building_routines",
  "meal_planning",
  "budgeting",
  "staying_consistent",
  "feeling_overwhelmed",
];

export default function OnboardingStep1Screen() {
  const palette = usePalette();

  const { preferences, setStruggleAreas } = useOnboarding();

  const toggleStruggle = (value: StruggleArea) => {
    const current = preferences.struggleAreas;
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setStruggleAreas(updated);
  };

  const handleNext = () => {
    router.push({ pathname: "/onboarding/planning" as const } as any);
  };

  return (
    <OnboardingShell
      title="What feels hardest right now?"
      subtitle="Choose what resonates. You can always change this later."
      currentStep={1}
      totalSteps={4}
      onNext={handleNext}
      canProceed={true}
    >
      <ScrollView
        contentContainerStyle={styles.optionsContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.optionsList}>
          {STRUGGLE_OPTIONS.map((option) => (
            <ChoiceChip
              key={option}
              label={STRUGGLE_AREA_LABELS[option]}
              selected={preferences.struggleAreas.includes(option)}
              onPress={() => toggleStruggle(option)}
            />
          ))}
        </View>

        {preferences.struggleAreas.length > 0 && (
          <Text
            variant="caption"
            color={palette.textSecondary}
            style={styles.selectionHint}
          >
            Selected {preferences.struggleAreas.length} option
            {preferences.struggleAreas.length !== 1 ? "s" : ""}
          </Text>
        )}
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    paddingBottom: Spacing.lg,
  },
  optionsList: {
    gap: Spacing.sm,
  },
  selectionHint: {
    marginTop: Spacing.md,
    textAlign: "center",
  },
});
