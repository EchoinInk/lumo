import { Colors, Radius, Spacing } from "@/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";
import type { DimensionValue, ViewProps } from "react-native";
import { Text } from "./Text";
import { getProgressAccessibilityValue } from "./uiContracts";

interface ProgressBarProps extends ViewProps {
  progress: number;
  showLabel?: boolean;
  label?: string;
  variant?: "default" | "gradient";
  height?: number;
}

export function ProgressBar({
  progress,
  showLabel = false,
  label,
  variant = "default",
  height = 8,
  className = "",
  style,
  accessibilityLabel,
  accessibilityValue,
  accessibilityRole,
  ...props
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress / 100, 0), 1);
  const progressWidth: DimensionValue = `${clampedProgress * 100}%`;

  const barStyle = {
    height,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderLight,
    overflow: "hidden" as const,
  };

  const fillStyle = {
    height: height,
    width: progressWidth,
    borderRadius: Radius.full,
  };

  const fillContent =
    variant === "gradient" ? (
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={fillStyle}
      />
    ) : (
      <View style={[fillStyle, { backgroundColor: Colors.primary }]} />
    );

  return (
    <View
      className={className}
      {...props}
      style={[styles.container, style]}
      accessible
      accessibilityRole={accessibilityRole ?? "progressbar"}
      accessibilityLabel={accessibilityLabel ?? label ?? "Progress"}
      accessibilityValue={getProgressAccessibilityValue(progress, accessibilityValue)}
    >
      {(showLabel || label) && (
        <View style={styles.labelRow}>
          <Text variant="caption" color={Colors.textSecondary}>
            {label || "Progress"}
          </Text>
          <Text variant="caption" color={Colors.textSecondary}>
            {Math.round(clampedProgress * 100)}%
          </Text>
        </View>
      )}
      <View style={barStyle}>{fillContent}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
});
