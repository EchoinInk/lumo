import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { usePalette } from "@/theme/usePalette";
import { Spacing } from "@/theme/tokens";
import React from "react";
import { StyleSheet, View } from "react-native";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, change, positive = true, icon }: StatCardProps) {
  const palette = usePalette();

  return (
    <Card variant="elevated" padding="lg" style={styles.container}>
      <View style={styles.header}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text variant="caption" color={palette.textSecondary} style={styles.label}>
          {label}
        </Text>
      </View>
      <Text variant="title" style={styles.value}>
        {value}
      </Text>
      {change && (
        <Text
          variant="small"
          color={positive ? palette.success : palette.danger}
          style={styles.change}
        >
          {change}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: "45%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  iconContainer: {
    marginBottom: Spacing.xs,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  value: {
    marginBottom: Spacing.xs,
  },
  change: {
    marginTop: Spacing.xs,
  },
});
