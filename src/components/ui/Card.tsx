import { Colors, Radius, Shadows, Spacing } from "@/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
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
  | "compact";

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
  const paddingValue = variant === "compact" ? Spacing.md : Spacing[padding];

  const getVariantStyles = () => {
    switch (variant) {
      case "elevated":
        return {
          backgroundColor: Colors.card,
          borderRadius: Radius["3xl"],
          ...Shadows.card,
          overflow: "hidden" as const,
        };
      case "gradient":
        return {
          borderRadius: Radius["3xl"],
          ...Shadows.card,
          overflow: "hidden" as const,
        };
      case "outlined":
        return {
          backgroundColor: Colors.card,
          borderRadius: Radius["3xl"],
          borderWidth: 1,
          borderColor: Colors.border,
          overflow: "hidden" as const,
        };
      case "glass":
        return {
          backgroundColor: Colors.cardGlass,
          borderRadius: Radius["3xl"],
          ...Shadows.soft,
          overflow: "hidden" as const,
        };
      case "interactive":
        return {
          backgroundColor: Colors.card,
          borderRadius: Radius["3xl"],
          ...Shadows.card,
          overflow: "hidden" as const,
        };
      case "compact":
        return {
          backgroundColor: Colors.card,
          borderRadius: Radius["2xl"],
          ...Shadows.sm,
          overflow: "hidden" as const,
        };
      default:
        return {
          backgroundColor: Colors.card,
          borderRadius: Radius["3xl"],
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
      {variant === "gradient" ? (
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            margin: -paddingValue,
            padding: paddingValue,
          }}
        >
          {children}
        </LinearGradient>
      ) : (
        children
      )}
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
        {variant === "gradient" ? (
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              margin: -paddingValue,
              padding: paddingValue,
            }}
          >
            {children}
          </LinearGradient>
        ) : (
          children
        )}
      </TouchableOpacity>
    );
  }

  return cardContent;
}
