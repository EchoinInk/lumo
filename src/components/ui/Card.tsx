import { usePalette } from "@/theme/usePalette";
import { Shadows, Spacing } from "@/theme/tokens";
import tokens from "@/theme/mello-tokens.json";
import React from "react";
import {
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewProps,
} from "react-native";
import type { AccessibilityState } from "react-native";
import { composeStyles, interactiveTargetStyle } from "./uiContracts";

type CardVariant =
  | "default"
  | "elevated"
  | "gradient"
  | "outlined"
  | "glass"
  | "interactive"
  | "compact"
  | "plain";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: CardVariant;
  pressable?: boolean;
  onPress?: TouchableOpacityProps["onPress"];
  onLongPress?: TouchableOpacityProps["onLongPress"];
  disabled?: boolean;
  padding?: keyof typeof Spacing;
  accessibilityLabel?: string;
  reducedMotion?: boolean;
}

export function Card({
  children,
  variant = "default",
  pressable = false,
  onPress,
  onLongPress,
  disabled = false,
  padding = "lg",
  accessibilityLabel,
  reducedMotion = false,
  className = "",
  style,
  accessibilityRole,
  accessibilityState,
  ...props
}: CardProps) {
  const palette = usePalette();

  const paddingValue = variant === "compact" ? Spacing.md : Spacing[padding];

  const getVariantStyles = () => {
    switch (variant) {
      case "elevated":
        return {
          backgroundColor: palette.card,
          borderRadius: tokens.sizes.panelRadius,
          ...Shadows.card,
          overflow: "hidden" as const,
        };
      case "plain":
        return { backgroundColor: palette.background, borderRadius: tokens.sizes.panelRadius };
      case "gradient":
        return {
          backgroundColor: palette.primary,
          borderRadius: tokens.sizes.panelRadius,
          ...Shadows.card,
          overflow: "hidden" as const,
        };
      case "outlined":
        return {
          backgroundColor: palette.card,
          borderRadius: tokens.sizes.panelRadius,
          borderWidth: 1,
          borderColor: palette.border,
          overflow: "hidden" as const,
        };
      case "glass":
        return {
          backgroundColor: palette.cardGlass,
          borderRadius: tokens.sizes.panelRadius,
          ...Shadows.soft,
          overflow: "hidden" as const,
        };
      case "interactive":
        return {
          backgroundColor: palette.card,
          borderRadius: tokens.sizes.panelRadius,
          ...Shadows.card,
          overflow: "hidden" as const,
        };
      case "compact":
        return {
          backgroundColor: palette.card,
          borderRadius: tokens.sizes.panelRadius,
          ...Shadows.sm,
          overflow: "hidden" as const,
        };
      default:
        return {
          backgroundColor: palette.card,
          borderRadius: tokens.sizes.panelRadius,
          ...Shadows.soft,
          overflow: "hidden" as const,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const forwardedTouchableProps = props as TouchableOpacityProps;

  const cardContent = (
    <View
      className={className}
      style={composeStyles(variantStyles, style, { padding: paddingValue })}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      {...props}
    >
      {children}
    </View>
  );

  if (pressable) {
    return (
      <TouchableOpacity
        className={className}
        {...forwardedTouchableProps}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        activeOpacity={reducedMotion ? 0.95 : 0.85}
        accessibilityRole={accessibilityRole ?? "button"}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{
          ...(accessibilityState as AccessibilityState | undefined),
          disabled,
        }}
        style={composeStyles(variantStyles, style, {
          padding: paddingValue,
          ...interactiveTargetStyle,
        })}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return cardContent;
}
