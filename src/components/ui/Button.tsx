import { brandFont } from "@/theme/brandFonts";
import tokens from "@/theme/mello-tokens.json";
import { mediumImpact } from "@/animations/haptics";
import { UX } from "@/constants/ux";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePalette } from "@/theme/usePalette";
import { Shadows, Spacing, Typography } from "@/theme/tokens";
import React from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import {
  composeStyles,
  interactiveTargetStyle,
  mergeAccessibilityState,
} from "./uiContracts";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  haptic?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  reducedMotion?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  haptic = true,
  accessibilityLabel,
  accessibilityHint,
  reducedMotion = false,
  className = "",
  onPress,
  style,
  accessibilityRole,
  accessibilityState,
  ...props
}: ButtonProps) {
  const palette = usePalette();

  const prefersReducedMotion = useReducedMotion();
  const handlePress = (event: any) => {
    if (haptic && !disabled && !loading) {
      mediumImpact();
    }
    onPress?.(event);
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return {
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          minHeight: UX.touchTarget, // Ensure minimum touch target
        };
      case "lg":
        return {
          paddingHorizontal: Spacing.xl,
          paddingVertical: Spacing.lg,
          minHeight: UX.touchTargetLarge,
        };
      default:
        return {
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          minHeight: UX.touchTarget,
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: palette.primary,
          borderRadius: tokens.sizes.buttonRadius,
          ...Shadows.md,
        };
      case "secondary":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: palette.primary,
          borderRadius: tokens.sizes.buttonRadius,
          ...Shadows.md,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          borderRadius: tokens.sizes.buttonRadius,
        };
      case "danger":
        return {
          backgroundColor: palette.danger,
          borderRadius: tokens.sizes.buttonRadius,
          ...Shadows.md,
        };
      default:
        return {
          backgroundColor: palette.primary,
          borderRadius: tokens.sizes.buttonRadius,
          ...Shadows.md,
        };
    }
  };

  const getTextStyle = () => {
    const baseStyle = {
      ...Typography.body,
      fontWeight: "700" as const,
      lineHeight: tokens.typography.button.lineHeight,
      ...brandFont(false, true),
    };

    switch (variant) {
      case "primary":
      case "danger":
        return { ...baseStyle, color: palette.textInverse };
      case "secondary":
        return { ...baseStyle, color: palette.primary };
      case "ghost":
        return { ...baseStyle, color: palette.primary };
      default:
        return { ...baseStyle, color: palette.textInverse };
    }
  };

  const isDisabled = disabled || loading;

  const getButtonLabel = () => {
    if (accessibilityLabel) return accessibilityLabel;
    if (typeof children === "string") return children;
    return "";
  };

  return (
    <TouchableOpacity
      className={className}
      {...props}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={reducedMotion || prefersReducedMotion ? 0.9 : 0.7}
      accessibilityRole={accessibilityRole ?? "button"}
      accessibilityLabel={getButtonLabel()}
      accessibilityHint={accessibilityHint}
      accessibilityState={mergeAccessibilityState(accessibilityState, {
        disabled: isDisabled,
        busy: loading,
      })}
      style={composeStyles(
        {
          ...getSizeStyles(),
          ...getVariantStyles(),
          opacity: isDisabled ? 0.5 : 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: Spacing.sm,
        },
        style,
        interactiveTargetStyle
      )}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "ghost"
              ? palette.primary
              : variant === "secondary"
              ? palette.textPrimary
              : palette.textInverse
          }
          accessibilityLabel="Loading"
        />
      ) : (
        <>
          {leftIcon}
          {React.Children.map(children, (child) => {
            if (typeof child === "string" || typeof child === "number") {
              return <Text style={getTextStyle()}>{child}</Text>;
            }

            return child;
          })}
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}
