/**
 * OnboardingProgress Component
 *
 * Progress indicator for onboarding steps.
 * Subtle, calm visual feedback without pressure.
 */

import { usePalette } from "@/theme/usePalette";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
  totalSteps,
}) => {
  const palette = usePalette();

  return (
    <View style={styles.container}>
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isActive = index + 1 === currentStep;
          const isCompleted = index + 1 < currentStep;

          return (
            <View
              key={index}
              style={[
                styles.dot,
                isActive && styles.dotActive,
                isCompleted && styles.dotCompleted,
                {
                  backgroundColor:
                    isActive || isCompleted ? palette.primary : palette.border,
                },
              ]}
            />
          );
        })}
      </View>
      <Text style={[styles.stepText, { color: palette.textSecondary }]}>
        Step {currentStep} of {totalSteps}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 32,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  dotCompleted: {
    width: 8,
  },
  stepText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
