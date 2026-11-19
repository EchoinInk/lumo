import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { usePalette } from "@/theme/usePalette";
import { Spacing } from '@/theme/tokens';

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

export function StatCard({ label, value, change, positive = true }: StatCardProps) {
  const palette = usePalette();

  return (
    <Card variant="elevated" padding="lg" style={styles.container}>
      <Text variant="caption" color={palette.textSecondary} style={styles.label}>
        {label}
      </Text>
      <Text variant="title" style={styles.value}>
        {value}
      </Text>
      {change && (
        <Text 
          variant="small" 
          color={positive ? palette.success : palette.danger}
          style={styles.change}
        >
          {change}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  value: {
    marginBottom: Spacing.xs,
  },
  change: {
    marginTop: Spacing.xs,
  },
});
