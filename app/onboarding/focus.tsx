/**
 * Onboarding Step 3: Focus Areas
 * "What should Lumo help with first?"
 */

import { Text } from "@/src/components/ui/Text";
import { ChoiceChip } from "@/src/features/onboarding/components/ChoiceChip";
import { OnboardingShell } from "@/src/features/onboarding/components/OnboardingShell";
import { useOnboarding } from "@/src/features/onboarding/hooks/useOnboarding";
import {
    FOCUS_AREA_LABELS,
    FocusArea,
} from "@/src/features/onboarding/types/onboarding";
import { Colors, Spacing } from "@/src/theme/tokens";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

const FOCUS_OPTIONS: FocusArea[] = [
  "tasks",
  "habits",
  "meals",
  "wellness",
  "fitness",
  "budget",
];

export default function OnboardingStep3Screen() {
  const { preferences, setFocusAreas } = useOnboarding();

  const toggleFocus = (value: FocusArea) => {
    const current = preferences.focusAreas;
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFocusAreas(updated);
  };

  const handleNext = () => {
    router.push({ pathname: "/onboarding/complete" as const } as any);
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/onboarding/planning" as any);
  };

  return (
    <OnboardingShell
      title="What should Lumo help with first?"
      subtitle="Pick 1-2 areas to start. You can explore everything later."
      currentStep={3}
      totalSteps={4}
      onNext={handleNext}
      onBack={handleBack}
      canProceed={preferences.focusAreas.length > 0}
    >
      <ScrollView
        contentContainerStyle={styles.optionsContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.optionsList}>
          {FOCUS_OPTIONS.map((option) => (
            <ChoiceChip
              key={option}
              label={FOCUS_AREA_LABELS[option]}
              selected={preferences.focusAreas.includes(option)}
              onPress={() => toggleFocus(option)}
            />
          ))}
        </View>

        {preferences.focusAreas.length > 0 && (
          <Text
            variant="caption"
            color={Colors.textSecondary}
            style={styles.selectionHint}
          >
            Selected {preferences.focusAreas.length} area
            {preferences.focusAreas.length !== 1 ? "s" : ""}
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
