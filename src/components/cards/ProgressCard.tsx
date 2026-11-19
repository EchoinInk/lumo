import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { usePalette } from "@/theme/usePalette";
import { Spacing } from '@/theme/tokens';

interface ProgressCardProps {
  title: string;
  progress: number;
  subtitle?: string;
  variant?: 'default' | 'gradient';
}

export function ProgressCard({ title, progress, subtitle, variant = 'default' }: ProgressCardProps) {
  const palette = usePalette();

  return (
    <Card variant="elevated" padding="lg" style={styles.container}>
      <Text variant="subheading" style={styles.title}>
        {title}
      </Text>
      {subtitle && (
        <Text variant="caption" color={palette.textSecondary} style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
      <ProgressBar 
        progress={progress} 
        showLabel 
        variant={variant}
        style={styles.progressBar}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.sm,
  },
  progressBar: {
    marginTop: Spacing.sm,
  },
});
