import { Colors, Radius, Shadows, Spacing } from '@/theme/tokens';
import { mediumImpact } from '@/animations/haptics';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import React from 'react';
import { StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FloatingActionButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  haptic?: boolean;
}

export function FloatingActionButton({ 
  children, 
  position = 'bottom-right',
  size = 'md',
  haptic = true,
  className = '',
  style,
  onPress,
  ...props 
}: FloatingActionButtonProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const handlePress = (event: any) => {
    if (haptic) {
      mediumImpact();
    }
    onPress?.(event);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { width: 48, height: 48 };
      case 'lg':
        return { width: 64, height: 64 };
      default:
        return { width: 56, height: 56 };
    }
  };

  const getPositionStyles = () => {
    const safeBottom = insets.bottom || Spacing.lg;
    const safeRight = insets.right || Spacing.lg;
    const safeLeft = insets.left || Spacing.lg;
    const safeTop = insets.top || Spacing.lg;

    switch (position) {
      case 'bottom-left':
        return {
          position: 'absolute' as const,
          bottom: safeBottom,
          left: safeLeft,
        };
      case 'top-right':
        return {
          position: 'absolute' as const,
          top: safeTop,
          right: safeRight,
        };
      case 'top-left':
        return {
          position: 'absolute' as const,
          top: safeTop,
          left: safeLeft,
        };
      case 'bottom-right':
      default:
        return {
          position: 'absolute' as const,
          bottom: safeBottom,
          right: safeRight,
        };
    }
  };

  return (
    <TouchableOpacity
      className={className}
      onPress={handlePress}
      activeOpacity={reducedMotion ? 0.9 : 0.7}
      style={[
        styles.container,
        getSizeStyles(),
        getPositionStyles(),
        style,
      ]}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});
