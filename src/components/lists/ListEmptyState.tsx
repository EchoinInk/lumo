import { createThemedValue } from "@/theme/usePalette";
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ListEmptyStateProps {
  message?: string;
}

export function ListEmptyState({ message = 'No items found' }: ListEmptyStateProps) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  message: {
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
}));
