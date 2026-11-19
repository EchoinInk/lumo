import { usePalette } from "@/theme/usePalette";
import { Radius, Shadows } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface BottomTabAddButtonProps {
  onPress?: () => void;
  focused?: boolean;
}

export function BottomTabAddButton({ onPress, focused = false }: BottomTabAddButtonProps) {
  const palette = usePalette();

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel="Add new item"
    >
      <LinearGradient
        colors={[palette.pink, palette.purple]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          focused && styles.focused,
        ]}
      >
        <Plus size={28} color={palette.textInverse} strokeWidth={2.5} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow,
  },
  focused: {
    ...Shadows.glowPurple,
  },
});
