import { Text } from "@/src/components/ui/Text";
import type { EnergyLevel } from "@/src/features/tasks/types/energy";
import { usePalette, createThemedValue } from "@/theme/usePalette";
import { Radius, Spacing } from "@/src/theme/tokens";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface EnergyPickerProps {
  value?: EnergyLevel;
  onChange: (value: EnergyLevel | undefined) => void;
}

const options: Array<{ value: EnergyLevel; label: string; hint: string }> = [
  { value: "low", label: "Low", hint: "Tiny or quiet" },
  { value: "medium", label: "Medium", hint: "Some effort" },
  { value: "high", label: "High", hint: "Needs capacity" },
];

export function EnergyPicker({ value, onChange }: EnergyPickerProps) {
  const palette = usePalette();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Text variant="label" color={palette.textSecondary}>
        Energy needed
      </Text>
      <View style={styles.options}>
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onChange(isSelected ? undefined : option.value)}
              accessibilityRole="button"
              accessibilityLabel={`${option.label} energy`}
              accessibilityHint={option.hint}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                variant="caption"
                color={isSelected ? palette.textInverse : palette.textSecondary}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  option: {
    minHeight: 44,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    backgroundColor: palette.card,
  },
  optionSelected: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
}));
