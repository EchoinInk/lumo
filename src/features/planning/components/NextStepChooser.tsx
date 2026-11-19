import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui/Text";
import type { PlanningNextStep } from "@/src/features/planning/types/planning";
import { usePalette, createThemedValue } from "@/theme/usePalette";
import { Spacing } from "@/src/theme/tokens";
import { Check } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

interface NextStepChooserProps {
  options: PlanningNextStep[];
  selectedId?: string;
  energyLevel?: "low" | "medium" | "steady";
  onSelect: (stepId: string) => void;
  onStart: (step: PlanningNextStep) => void;
  onPickAnother: () => void;
}

export function NextStepChooser({
  options,
  selectedId,
  energyLevel,
  onSelect,
  onStart,
  onPickAnother,
}: NextStepChooserProps) {
  const palette = usePalette();
  const styles = useStyles();

  const selected =
    options.find((step) => step.id === selectedId) ?? options[0];

  if (!selected) {
    return (
      <Card variant="outlined" style={styles.card}>
        <Text variant="body" color={palette.textSecondary}>
          No pressure — you can start with a small reset.
        </Text>
      </Card>
    );
  }

  const subtitle =
    energyLevel === "low"
      ? "Choose the smallest useful step."
      : "Choose one small step.";
  const isSelected = selected.id === selectedId;

  return (
    <Card
      variant="outlined"
      style={[styles.card, styles.selectedCard]}
      accessibilityRole="none"
    >
      <Text variant="caption" color={palette.primary}>
        {subtitle}
      </Text>
      <View style={styles.selectedRow}>
        <Check size={16} color={palette.primary} accessibilityElementsHidden />
        <Text variant="body" style={styles.label}>
          {selected.label}
        </Text>
      </View>
      <Text variant="caption" color={palette.textTertiary}>
        {selected.reason}
      </Text>

      <View style={styles.actions}>
        <Button
          size="sm"
          variant={isSelected ? "secondary" : "primary"}
          onPress={() => onStart(selected)}
          accessibilityRole="button"
          accessibilityLabel={`Choose ${selected.label}`}
          accessibilityHint="Selects this as your one small step for today"
          accessibilityState={{ selected: isSelected }}
        >
          {isSelected ? "Chosen" : "Choose this"}
        </Button>
        {options.length > 1 && (
          <Button
            size="sm"
            variant="secondary"
            onPress={onPickAnother}
            accessibilityRole="button"
            accessibilityLabel="Pick another next step"
            accessibilityHint="Shows another suggestion"
          >
            Pick another
          </Button>
        )}
      </View>

      {options.length > 1 && (
        <View style={styles.alternatives}>
          {options
            .filter((step) => step.id !== selected.id)
            .map((step) => (
              <Button
                key={step.id}
                size="sm"
                variant="ghost"
                onPress={() => onSelect(step.id)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${step.label}`}
                accessibilityHint="Sets this as your chosen next step"
                accessibilityState={{ selected: step.id === selectedId }}
              >
                {step.label}
              </Button>
            ))}
        </View>
      )}
    </Card>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  selectedCard: {
    borderColor: palette.primary + "40",
    borderWidth: 1,
  },
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  label: {
    fontWeight: "600",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  alternatives: {
    gap: Spacing.xs,
  },
}));
