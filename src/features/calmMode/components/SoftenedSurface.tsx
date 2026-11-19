/**
 * SoftenedSurface Component
 *
 * Reusable wrapper that reduces glow intensity, softens borders,
 * reduces visual sharpness, and lowers contrast spikes.
 * Preserves design system using token-backed styling.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useEnvironmentalSoftening } from '../hooks/useEnvironmentalSoftening';
import { createThemedValue } from "@/theme/usePalette";
import { Radius, Spacing } from '@/theme/tokens';

interface SoftenedSurfaceProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}

export function SoftenedSurface({ children, style, backgroundColor }: SoftenedSurfaceProps) {
  const styles = useStyles();

  const { shouldSoftenSurfaceBorders, shouldReduceGlowIntensity } = useEnvironmentalSoftening();

  const containerStyle = [
    styles.container,
    shouldSoftenSurfaceBorders && styles.softenedBorder,
    shouldReduceGlowIntensity && styles.reducedGlow,
    backgroundColor && { backgroundColor },
    style,
  ];

  return <View style={containerStyle}>{children}</View>;
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    backgroundColor: palette.backgroundAlt,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  softenedBorder: {
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  reducedGlow: {
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
}));
