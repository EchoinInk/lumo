import { UX } from '@/constants/ux';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/theme/tokens';
import { mediumImpact } from '@/animations/haptics';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { composeStyles, interactiveTargetStyle, mergeAccessibilityState } from './uiContracts';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
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
  variant = 'primary', 
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  haptic = true,
  accessibilityLabel,
  accessibilityHint,
  reducedMotion = false,
  className = '',
  onPress,
  style,
  accessibilityRole,
  accessibilityState,
  ...props 
}: ButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const handlePress = (event: any) => {
    if (haptic && !disabled && !loading) {
      mediumImpact();
    }
    onPress?.(event);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          minHeight: UX.touchTarget, // Ensure minimum touch target
        };
      case 'lg':
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
      case 'primary':
        return {
          backgroundColor: Colors.primary,
          borderRadius: Radius.lg,
          ...Shadows.md,
        };
      case 'secondary':
        return {
          backgroundColor: Colors.secondary,
          borderRadius: Radius.lg,
          ...Shadows.md,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderRadius: Radius.lg,
        };
      case 'danger':
        return {
          backgroundColor: Colors.danger,
          borderRadius: Radius.lg,
          ...Shadows.md,
        };
      default:
        return {
          backgroundColor: Colors.primary,
          borderRadius: Radius.lg,
          ...Shadows.md,
        };
    }
  };

  const getTextStyle = () => {
    const baseStyle = {
      ...Typography.body,
      fontWeight: '600' as const,
    };

    switch (variant) {
      case 'primary':
      case 'danger':
        return { ...baseStyle, color: Colors.textInverse };
      case 'secondary':
        return { ...baseStyle, color: Colors.textPrimary };
      case 'ghost':
        return { ...baseStyle, color: Colors.primary };
      default:
        return { ...baseStyle, color: Colors.textInverse };
    }
  };

  const isDisabled = disabled || loading;

  const getButtonLabel = () => {
    if (accessibilityLabel) return accessibilityLabel;
    if (typeof children === 'string') return children;
    return '';
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
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Spacing.sm,
        },
        style,
        interactiveTargetStyle,
      )}
    >
      {loading ? (
        <ActivityIndicator 
          color={
            variant === 'ghost'
              ? Colors.primary
              : variant === 'secondary'
                ? Colors.textPrimary
                : Colors.textInverse
          }
          accessibilityLabel="Loading"
        />
      ) : (
        <>
          {leftIcon}
          {typeof children === 'string' ? (
            <Text style={getTextStyle()}>
              {children}
            </Text>
          ) : (
            children
          )}
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}
