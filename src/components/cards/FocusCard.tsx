import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { usePalette } from "@/theme/usePalette";
import { Spacing } from '@/theme/tokens';

interface FocusCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  initials?: string;
}

export function FocusCard({ title, description, icon, initials }: FocusCardProps) {
  const palette = usePalette();

  return (
    <Card variant="gradient" padding="lg" pressable style={styles.container}>
      <View style={styles.header}>
        {icon || (initials && <Avatar initials={initials} size="md" />)}
        <Text variant="heading" color={palette.textInverse} style={styles.title}>
          {title}
        </Text>
      </View>
      <Text variant="body" color={palette.textInverse} style={styles.description}>
        {description}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  title: {
    flex: 1,
  },
  description: {
    lineHeight: 22,
  },
});
