import { Text } from "@/src/components/ui/Text";
import type { RecurrencePattern } from "@/src/features/tasks/types/recurrence";
import { summarizeRecurrence } from "@/src/features/tasks/utils/recurrence";
import { usePalette, createThemedValue } from "@/theme/usePalette";
import { Radius, Spacing } from "@/src/theme/tokens";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface RecurringTaskPickerProps {
  value?: RecurrencePattern;
  onChange: (value: RecurrencePattern | undefined) => void;
}

const options: Array<{ label: string; value?: RecurrencePattern }> = [
  { label: "No repeat", value: undefined },
  { label: "Daily", value: { type: "daily" } },
  { label: "Weekdays", value: { type: "weekly", weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri"] } },
  { label: "Weekly", value: { type: "weekly" } },
  { label: "Every 2 weeks", value: { type: "weekly", interval: 2 } },
  { label: "Monthly", value: { type: "monthly" } },
];

function keyFor(value?: RecurrencePattern): string {
  return value ? summarizeRecurrence(value) : "Does not repeat";
}

export function RecurringTaskPicker({
  value,
  onChange,
}: RecurringTaskPickerProps) {
  const palette = usePalette();
  const styles = useStyles();

  const selectedKey = keyFor(value);

  return (
    <View style={styles.container}>
      <Text variant="label" color={palette.textSecondary}>
        Repeat
      </Text>
      <View style={styles.options}>
        {options.map((option) => {
          const optionKey = keyFor(option.value);
          const isSelected = optionKey === selectedKey;

          return (
            <TouchableOpacity
              key={option.label}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onChange(option.value)}
              accessibilityRole="button"
              accessibilityLabel={option.label}
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
