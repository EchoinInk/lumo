import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui/Text";
import { usePalette } from "@/theme/usePalette";
import { Spacing } from "@/src/theme/tokens";
import { StyleSheet } from "react-native";

interface CalmPlaceholderNoteProps {
  title?: string;
  description?: string;
}

export function CalmPlaceholderNote({
  title = "This space is coming together.",
  description = "You can come back to this later.",
}: CalmPlaceholderNoteProps) {
  const palette = usePalette();

  return (
    <Card variant="outlined" style={styles.card} accessibilityRole="text">
      <Text variant="body" color={palette.textSecondary}>
        {title}
      </Text>
      <Text variant="caption" color={palette.textTertiary}>
        {description}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.xs,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
});
