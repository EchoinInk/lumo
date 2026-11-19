/**
 * Onboarding Progress Indicator
 * Shows current step in onboarding flow
 */

import { createThemedValue } from "@/theme/usePalette";
import { Radius, Spacing } from "@/src/theme/tokens";
import React from "react";
import { StyleSheet, View } from "react-native";

interface OnboardingProgressProps {
  current: number;
  total: number;
}

export function OnboardingProgress({ current, total }: OnboardingProgressProps) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        {Array.from({ length: total }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.step,
              index < current && styles.stepCompleted,
              index === current - 1 && styles.stepActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    alignItems: "center",
  },
  progressBar: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  step: {
    flex: 1,
    height: 4,
    backgroundColor: palette.border,
    borderRadius: Radius.sm,
    minWidth: 40,
  },
  stepCompleted: {
    backgroundColor: palette.primary,
  },
  stepActive: {
    backgroundColor: palette.primary,
  },
}));
