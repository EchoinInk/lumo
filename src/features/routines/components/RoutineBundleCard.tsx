import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { Text } from "@/src/components/ui/Text";
import type { RoutineBundle } from "@/src/features/routines";
import { Colors, Spacing } from "@/src/theme/tokens";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

interface RoutineBundleCardProps {
  bundle: RoutineBundle;
  onUse: (bundle: RoutineBundle) => void;
  isApplying?: boolean;
  isApplied?: boolean;
}

export function RoutineBundleCard({
  bundle,
  onUse,
  isApplying = false,
  isApplied = false,
}: RoutineBundleCardProps) {
  const [items, setItems] = useState(bundle.items);
  const hasActionableItem = items.some((item) => item.title.trim().length > 0);

  const updateItem = (index: number, title: string) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, title } : item,
      ),
    );
  };

  return (
    <Card variant="outlined" style={styles.card}>
      <Text variant="subheading">{bundle.title}</Text>
      <Text variant="body" color={Colors.textSecondary}>
        {bundle.description}
      </Text>
      <View style={styles.items}>
        {items.map((item, index) => (
          <Input
            key={`${bundle.id}-${index}`}
            value={item.title}
            onChangeText={(title) => updateItem(index, title)}
            accessibilityLabel={`${bundle.title} item ${index + 1}`}
          />
        ))}
      </View>
      <Button
        size="sm"
        onPress={() =>
          onUse({
            ...bundle,
            items: items.filter((item) => item.title.trim().length > 0),
          })
        }
        disabled={isApplying || isApplied || !hasActionableItem}
        loading={isApplying}
        accessibilityLabel={`Use ${bundle.title} bundle`}
        accessibilityHint={
          !hasActionableItem
            ? "Enter at least one routine step"
            : isApplied
            ? "Tasks were created from this bundle"
            : "Creates tasks from the edited bundle items"
        }
      >
        {isApplied ? "Added" : "Use bundle"}
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  items: {
    gap: Spacing.xs,
  },
});
