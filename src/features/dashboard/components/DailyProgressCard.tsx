import { Card } from "@/src/components/ui/Card";
import { ProgressBar } from "@/src/components/ui/ProgressBar";
import { Text } from "@/src/components/ui/Text";
import { usePalette } from "@/theme/usePalette";
import { Spacing } from "@/src/theme/tokens";
import React from "react";
import { StyleSheet, View } from "react-native";

interface DailyProgressCardProps {
  title?: string;
  progress: number;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  variant?: "default" | "gradient";
}

export function DailyProgressCard({
  title = "Today's Progress",
  progress,
  subtitle,
  completedCount,
  totalCount,
  variant = "gradient",
}: DailyProgressCardProps) {
  const palette = usePalette();

  return (
    <Card variant={variant === "gradient" ? "gradient" : "elevated"} style={styles.container}>
      <View style={styles.header}>
        <Text
          variant="subheading"
          style={styles.title}
          color={variant === "gradient" ? palette.textInverse : palette.textPrimary}
        >
          {title}
        </Text>
        <Text
          variant="heading"
          color={variant === "gradient" ? palette.textInverse : palette.primary}
        >
          {completedCount}/{totalCount}
        </Text>
      </View>

      <ProgressBar
        progress={progress}
        height={8}
        variant={variant === "gradient" ? "gradient" : "default"}
      />

      <Text
        variant="caption"
        style={styles.subtitle}
        color={variant === "gradient" ? palette.textInverse : palette.textSecondary}
      >
        {subtitle}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontWeight: "600",
  },
  subtitle: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
