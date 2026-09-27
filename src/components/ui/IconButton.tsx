import { Colors, Radius, Shadows } from '@/theme/tokens';
import { UX } from '@/constants/ux';
import { softImpact } from '@/animations/haptics';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

type IconButtonShape = 'circular' | 'square';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  shape?: IconButtonShape;
  size?: IconButtonSize;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  haptic?: boolean;
  reducedMotion?: boolean;
}

export function IconButton({ 
  children, 
  shape = 'circular',
  size = 'md',
  variant = 'ghost',
  haptic = true,
  reducedMotion = false,
  className = '',
  onPress,
  ...props 
}: IconButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const handlePress = (event: any) => {
    if (haptic) {
      softImpact();
    }
    onPress?.(event);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { width: UX.touchTarget, height: UX.touchTarget };
      case 'lg':
        return { width: UX.touchTargetLarge, height: UX.touchTargetLarge };
      default:
        return { width: UX.touchTarget, height: UX.touchTarget };
    }
  };

  const getShapeStyles = () => {
    switch (shape) {
      case 'square':
        return { borderRadius: Radius.md };
      default:
        return { borderRadius: Radius.full };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: Colors.primary,
          ...Shadows.sm,
        };
      case 'secondary':
        return {
          backgroundColor: Colors.secondary,
          ...Shadows.sm,
        };
      case 'danger':
        return {
          backgroundColor: Colors.danger,
          ...Shadows.sm,
        };
      case 'ghost':
      default:
        return {
          backgroundColor: 'transparent',
        };
    }
  };

  return (
    <TouchableOpacity
      className={className}
      onPress={handlePress}
      activeOpacity={reducedMotion || prefersReducedMotion ? 0.9 : 0.7}
      accessibilityRole="button"
      style={{
        ...getSizeStyles(),
        ...getShapeStyles(),
        ...getVariantStyles(),
        alignItems: 'center',
        justifyContent: 'center',
      }}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}
