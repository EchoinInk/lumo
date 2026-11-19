import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { createThemedValue } from "@/theme/usePalette";
import { Radius, Spacing } from '@/theme/tokens';

interface MoreMenuCardProps {
  title: string;
  icon: React.ReactNode;
  onPress?: () => void;
}

export function MoreMenuCard({ title, icon, onPress }: MoreMenuCardProps) {
  const styles = useStyles();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant="elevated" padding="lg" style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconWrapper}>{icon}</View>
          <Text variant="body" style={styles.title}>
            {title}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: palette.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
}));
