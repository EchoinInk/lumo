import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { usePalette, createThemedValue } from "@/theme/usePalette";
import { Spacing } from '@/theme/tokens';

interface NavigationHeaderProps {
  title?: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export function NavigationHeader({ title, subtitle, leftAction, rightAction }: NavigationHeaderProps) {
  const palette = usePalette();
  const styles = useStyles();

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {leftAction && <View style={styles.action}>{leftAction}</View>}
        <View style={styles.titleContainer}>
          {title && (
            <Text variant="heading" textAlign="center" style={styles.title}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text variant="caption" color={palette.textSecondary} textAlign="center">
              {subtitle}
            </Text>
          )}
        </View>
        {rightAction && <View style={styles.action}>{rightAction}</View>}
      </View>
    </View>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    backgroundColor: palette.card,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  action: {
    width: 40,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
  },
}));
