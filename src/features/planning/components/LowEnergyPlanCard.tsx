import { Bookmark } from "lucide-react-native";
import { useState } from "react";
import Svg, { Path } from "react-native-svg";
import tokens from "@/theme/mello-tokens.json";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui/Text";
import { PlanningGentleFade } from "./PlanningGentleFade";
import type { LowEnergyOption, PlanningSourceRef } from "@/src/features/planning/types/planning";
import { usePalette, createThemedValue } from "@/theme/usePalette";
import { Spacing } from "@/src/theme/tokens";
import { StyleSheet, View } from "react-native";

interface LowEnergyPlanCardProps {
  options: LowEnergyOption[];
  selectedSource?: PlanningSourceRef;
  onChoose: (optionId: string) => void;
  onPark: (sourceId: string, sourceType: LowEnergyOption["sourceType"]) => void | Promise<void>;
  embedded?: boolean;
}

export function LowEnergyPlanCard({
  options,
  selectedSource,
  onChoose,
  onPark,
  embedded = false,
}: LowEnergyPlanCardProps) {
  const palette = usePalette();
  const styles = useStyles();

  const [parkingFeedback, setParkingFeedback] = useState("");

  async function handlePark(option: LowEnergyOption) {
    try {
      await onPark(option.sourceId, option.sourceType);
      setParkingFeedback(`${option.label} parked for later.`);
    } catch {
      setParkingFeedback("Couldn’t park this item. Try again.");
    }
  }

  const content = (
    <>
      <Text variant="subheading" style={styles.title}>
        Today can be lighter.
      </Text>
      <Text variant="body" color={palette.textSecondary}>
        One supportive action is enough.
      </Text>

      {parkingFeedback && (
        <Text variant="caption" color={palette.textSecondary} accessibilityLiveRegion="polite" aria-live="polite">
          {parkingFeedback}
        </Text>
      )}

      {options.length === 0 ? (
        <View style={styles.emptyBlock}>
          <Text variant="body" color={palette.textSecondary}>
            No pressure — you can start with a small reset.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {options.map((option) => {
            const isSelected = option.sourceType === selectedSource?.sourceType
              && option.sourceId === selectedSource.sourceId;
            return (
              <View
                key={option.id}
                style={[styles.option, isSelected && styles.optionSelected]}
              >
                <View style={styles.optionText}>
                  <Svg width={19} height={19} viewBox="0 0 24 24" accessible={false}><Path d="M3 19C3 10 7 5 14 5H22" fill="none" stroke={palette.primary} strokeWidth={1.8} strokeLinecap="round" /></Svg>
                  <Text variant="caption" color={palette.primary}>
                    {option.reason}
                  </Text>
                  <Text variant="subheading" style={styles.optionLabel}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <PlanningGentleFade>
                      <Text variant="caption" color={palette.textTertiary}>Chosen for today</Text>
                    </PlanningGentleFade>
                  )}
                </View>
                <View style={styles.actions}>
                  <Button
                    size="sm"
                    variant={isSelected ? "secondary" : "primary"}
                    onPress={() => onChoose(option.id)}
                    accessibilityRole="button"
                    accessibilityLabel={isSelected ? `${option.label}, chosen for today` : `Choose ${option.label}`}
                    accessibilityHint="Selects this as your one small step for today"
                    accessibilityState={{ selected: isSelected }}
                  >
                    {isSelected ? "Chosen" : "Choose this"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Bookmark size={16} color={palette.primary} />}
                    onPress={() => handlePark(option)}
                    accessibilityRole="button"
                    accessibilityLabel={`Park ${option.label} for later`}
                    accessibilityHint="Parks this option for later"
                  >
                    Park for later
                  </Button>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </>
  );

  if (embedded) {
    return <View style={styles.embedded}>{content}</View>;
  }

  return (
    <Card variant="plain" style={styles.card}>
      {content}
    </Card>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  card: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  embedded: {
    gap: Spacing.sm,
  },
  title: {
    fontWeight: "600",
  },
  emptyBlock: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  list: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  option: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: tokens.sizes.panelRadius,
    backgroundColor: palette.taskPanel,
    borderWidth: 1,
    borderColor: palette.border,
  },
  optionSelected: {
    borderColor: palette.selectedEdge,
    backgroundColor: palette.taskPanel,
  },
  optionText: {
    gap: Spacing.xs,
  },
  optionLabel: {
    fontSize: tokens.typography["task-title"].size,
    lineHeight: tokens.typography["task-title"].lineHeight,
    fontWeight: "600",
  },
  actions: {
    alignItems: "stretch",
    gap: Spacing.sm,
  },
}));
