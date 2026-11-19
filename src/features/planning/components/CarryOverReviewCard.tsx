import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui/Text";
import type { CarryOverItem } from "@/src/features/planning/types/planning";
import { usePalette } from "@/theme/usePalette";
import { Spacing } from "@/src/theme/tokens";
import { StyleSheet, View } from "react-native";

interface CarryOverReviewCardProps {
  items: CarryOverItem[];
  onCarryOver: (sourceId: string) => void;
  onPark: (sourceId: string) => void;
}

export function CarryOverReviewCard({
  items,
  onCarryOver,
  onPark,
}: CarryOverReviewCardProps) {
  const palette = usePalette();

  if (items.length === 0) {
    return (
      <Card variant="outlined" style={styles.card}>
        <Text variant="body" color={palette.textSecondary}>
          Nothing needs carrying right now.
        </Text>
      </Card>
    );
  }

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <Card key={item.id} variant="outlined" style={styles.card}>
          <Text variant="caption" color={palette.primary}>
            {item.reason}
          </Text>
          <Text variant="body" style={styles.label}>
            {item.label}
          </Text>
          <View style={styles.actions}>
            <Button
              size="sm"
              onPress={() => onCarryOver(item.sourceId)}
              accessibilityRole="button"
              accessibilityLabel={`Carry ${item.label} gently into today`}
              accessibilityHint="Moves this item into today's plan without pressure"
            >
              Carry into today
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => onPark(item.sourceId)}
              accessibilityRole="button"
              accessibilityLabel={`Park ${item.label} for later`}
              accessibilityHint="Parks this item for later without pressure"
            >
              Park for later
            </Button>
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.md,
  },
  card: {
    gap: Spacing.sm,
  },
  label: {
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
