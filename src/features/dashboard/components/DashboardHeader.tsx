import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { usePalette } from "@/theme/usePalette";
import { Spacing } from '@/theme/tokens';

interface DashboardHeaderProps {
  greeting?: string;
  subtitle?: string;
  initials?: string;
}

export function DashboardHeader({ 
  greeting = "Good Morning", 
  subtitle = "Let's make today productive",
  initials = "LM"
}: DashboardHeaderProps) {
  const palette = usePalette();

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text variant="title" style={styles.greeting}>
          {greeting}
        </Text>
        <Text variant="body" color={palette.textSecondary} style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>
      <Avatar initials={initials} size="lg" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    lineHeight: 24,
  },
});
