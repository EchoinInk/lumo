/**
 * FocusExitButton
 *
 * A gentle exit button for Focus Mode.
 * Accessible touch target with non-aggressive styling.
 */

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { createThemedValue } from "@/theme/usePalette";
import { Spacing, Typography } from '@/src/theme/tokens';
import { UX } from '@/src/constants/ux';

interface FocusExitButtonProps {
  onPress: () => void;
}

export function FocusExitButton({ onPress }: FocusExitButtonProps) {
  const styles = useStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.button}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Exit Focus Mode"
      accessibilityHint="Return to standard view"
    >
      <Text style={styles.text}>Exit</Text>
    </TouchableOpacity>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  button: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: palette.border,
    minHeight: UX.touchTarget,
    minWidth: UX.touchTargetLarge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...Typography.body,
    color: palette.textSecondary,
    fontWeight: '500',
  },
}));
