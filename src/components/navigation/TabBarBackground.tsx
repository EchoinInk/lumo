import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Radius, Shadows } from '@/theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function TabBarBackground() {
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      intensity={80}
      tint="light"
      style={[
        styles.container,
        {
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0,
        },
      ]}
    >
      <View style={styles.overlay} />
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.cardGlass,
    ...Shadows.lg,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: Colors.cardGlass,
    opacity: 0.9,
  },
});
