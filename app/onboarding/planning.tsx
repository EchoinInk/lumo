/**
 * Onboarding Step 2: Planning Style
 * "How do you prefer to plan?"
 */

import { Text } from "@/src/components/ui/Text";
import { ChoiceChip } from "@/src/features/onboarding/components/ChoiceChip";
import { OnboardingShell } from "@/src/features/onboarding/components/OnboardingShell";
import { useOnboarding } from "@/src/features/onboarding/hooks/useOnboarding";
import {
    PLANNING_STYLE_LABELS,
    PlanningStyle,
} from "@/src/features/onboarding/types/onboarding";
import { Colors, Spacing } from "@/src/theme/tokens";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

const PLANNING_OPTIONS: PlanningStyle[] = [
  "minimal",
  "visual",
  "structured",
  "flexible",
];

export default function OnboardingStep2Screen() {
  const { preferences, setPlanningStyle } = useOnboarding();

  const handleNext = () => {
    router.push({ pathname: "/onboarding/focus" as const } as any);
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/onboarding" as any);
  };

  return (
    <OnboardingShell
      title="How do you prefer to plan?"
      subtitle="This helps Lumo show you the right tools."
      currentStep={2}
      totalSteps={4}
      onNext={handleNext}
      onBack={handleBack}
      canProceed={preferences.planningStyle !== null}
    >
      <ScrollView
        contentContainerStyle={styles.optionsContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.optionsList}>
          {PLANNING_OPTIONS.map((option) => (
            <ChoiceChip
              key={option}
              label={PLANNING_STYLE_LABELS[option]}
              selected={preferences.planningStyle === option}
              onPress={() => setPlanningStyle(option)}
            />
          ))}
        </View>

        {preferences.planningStyle && (
          <Text
            variant="caption"
            color={Colors.textSecondary}
            style={styles.selectionHint}
          >
            Selected: {PLANNING_STYLE_LABELS[preferences.planningStyle]}
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
