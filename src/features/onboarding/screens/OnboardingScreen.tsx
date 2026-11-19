/**
 * OnboardingScreen Component
 *
 * Main onboarding screen orchestrating the flow.
 * Thin screen that delegates to components.
 */

import { FadeIn } from "@/components/animated/FadeIn";
import { FocusSelectionCard } from "@/components/onboarding/FocusSelectionCard";
import { OnboardingContainer } from "@/components/onboarding/OnboardingContainer";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { PreferenceSelector } from "@/components/onboarding/PreferenceSelector";
import { WelcomeHero } from "@/components/onboarding/WelcomeHero";
import { usePalette, createThemedValue } from "@/theme/usePalette";
import { ONBOARDING_STEPS } from "@/types/onboarding";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingFlow } from "../hooks/useOnboardingFlow";

export const OnboardingScreen: React.FC = () => {
  const palette = usePalette();
  const styles = useStyles();

  const router = useRouter();
  const {
    currentStep,
    struggleAreas,
    planningPreference,
    focusAreas,
    setStruggleAreas,
    setPlanningPreference,
    setFocusAreas,
    previousStep,
  } = useOnboardingFlow();

  const handleStepBack = () => {
    if (currentStep > 1) {
      previousStep();
    } else {
      router.back();
    }
  };

  const renderStepContent = () => {
    const step = ONBOARDING_STEPS[currentStep - 1];

    if (!step) return null;

    switch (step.id) {
      case 1:
        return (
          <FadeIn>
            <WelcomeHero
              title="What do you struggle with most?"
              subtitle="Select all that apply. This helps us personalize your experience."
            />
            <View style={styles.optionsContainer}>
              {step.options?.map((option) => (
                <FocusSelectionCard
                  key={option.id}
                  id={option.id}
                  label={option.label}
                  selected={struggleAreas.includes(option.id as any)}
                  onSelect={(id) => {
                    const updated = struggleAreas.includes(id as any)
                      ? struggleAreas.filter((a) => a !== id)
                      : [...struggleAreas, id as any];
                    setStruggleAreas(updated);
                  }}
                  multiSelect
                />
              ))}
            </View>
          </FadeIn>
        );

      case 2:
        return (
          <FadeIn>
            <WelcomeHero
              title="How do you prefer planning?"
              subtitle="Choose the style that feels most natural to you."
            />
            <PreferenceSelector
              options={step.options || []}
              selectedId={planningPreference}
              onSelect={(id) => setPlanningPreference(id as any)}
            />
          </FadeIn>
        );

      case 3:
        return (
          <FadeIn>
            <WelcomeHero
              title="Choose your focus areas"
              subtitle="Select what you want to track first. You can always add more later."
            />
            <View style={styles.optionsContainer}>
              {step.options?.map((option) => (
                <FocusSelectionCard
                  key={option.id}
                  id={option.id}
                  label={option.label}
                  selected={focusAreas.includes(option.id as any)}
                  onSelect={(id) => {
                    const updated = focusAreas.includes(id as any)
                      ? focusAreas.filter((a) => a !== id)
                      : [...focusAreas, id as any];
                    setFocusAreas(updated);
                  }}
                  multiSelect
                />
              ))}
            </View>
          </FadeIn>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true; // Optional
      case 2:
        return planningPreference.length > 0;
      case 3:
        return focusAreas.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep === 3) {
      // Complete onboarding
      setFocusAreas(focusAreas);
      router.replace({ pathname: "/(tabs)" as const } as any);
    } else {
      // Move to next step is handled by PreferenceSelector
    }
  };

  return (
    <OnboardingContainer step={currentStep} totalSteps={3}>
      <OnboardingProgress currentStep={currentStep} totalSteps={3} />
      {renderStepContent()}

      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={handleStepBack}
          >
            <Text style={[styles.buttonText, { color: palette.textSecondary }]}>
              Back
            </Text>
          </TouchableOpacity>
        )}

        {currentStep === 1 && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => setPlanningPreference(planningPreference)}
            disabled={!canProceed()}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        )}

        {currentStep === 3 && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
        )}
      </View>
    </OnboardingContainer>
  );
};

const useStyles = createThemedValue((palette) => StyleSheet.create({
  optionsContainer: {
    width: "100%",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 32,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 52,
  },
  backButton: {
    flex: 1,
  },
  primaryButton: {
    flex: 2,
    backgroundColor: palette.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: palette.textPrimary,
  },
}));
