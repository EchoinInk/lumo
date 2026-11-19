import { usePalette } from "@/theme/usePalette";
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export function ListLoadingState() {
  const palette = usePalette();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={palette.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
});
