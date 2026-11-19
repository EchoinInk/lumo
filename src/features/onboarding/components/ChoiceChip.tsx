/**
 * Choice Chip
 * Selectable chip for onboarding choices
 */

import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui/Text";
import { usePalette, createThemedValue } from "@/theme/usePalette";
import { Radius, Spacing } from "@/src/theme/tokens";
import { Check } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface ChoiceChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function ChoiceChip({
  label,
  selected,
  onPress,
  disabled = false,
}: ChoiceChipProps) {
  const palette = usePalette();
  const styles = useStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
    >
      <Card
        variant={selected ? "elevated" : "outlined"}
        style={[
          styles.container,
          selected && styles.containerSelected,
          disabled && styles.containerDisabled,
        ]}
      >
        <View style={styles.content}>
          <Text
            variant="body"
            style={[styles.label, selected && styles.labelSelected]}
            color={selected ? palette.primary : palette.textPrimary}
          >
            {label}
          </Text>
          {selected && (
            <View style={styles.checkmark}>
              <Check size={16} color={palette.primary} />
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  containerSelected: {
    borderColor: palette.primary,
    borderWidth: 2,
    backgroundColor: palette.lavender,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontWeight: "500",
  },
  labelSelected: {
    fontWeight: "600",
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    backgroundColor: palette.lavender,
    alignItems: "center",
    justifyContent: "center",
  },
}));
