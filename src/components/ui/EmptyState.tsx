import { usePalette } from "@/theme/usePalette";
import { Spacing } from '@/theme/tokens';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Button } from './Button';
import { Text } from './Text';

interface EmptyStateProps extends ViewProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = '',
  style,
  ...props 
}: EmptyStateProps) {
  const palette = usePalette();

  return (
    <View className={className} style={[styles.container, style]} {...props}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text variant="heading" textAlign="center" style={styles.title}>
        {title}
      </Text>
      {description && (
        <Text variant="body" color={palette.textSecondary} textAlign="center" style={styles.description}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={styles.action}>
          <Button variant="primary" onPress={onAction}>
            {actionLabel}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  icon: {
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  description: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  action: {
    marginTop: Spacing.md,
  },
});
