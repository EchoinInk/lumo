/**
 * CalmGradientOverlay Component
 *
 * Reusable atmosphere softener that softens cinematic gradients,
 * reduces brightness spikes, smooths transitions, and calms decorative overlays.
 */

import { usePalette } from "@/theme/usePalette";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useEnvironmentalSoftening } from "../hooks/useEnvironmentalSoftening";
import { getGradientContrastMultiplier } from "../services/environmentalRules";

interface CalmGradientOverlayProps {
  children: React.ReactNode;
  style?: ViewStyle;
  colors?: readonly [string, string, ...string[]];
  disabled?: boolean;
}

export function CalmGradientOverlay({
  children,
  style,
  colors,
  disabled = false,
}: CalmGradientOverlayProps) {
  const palette = usePalette();

  const { shouldReduceGradientContrast, environmentalProfile } =
    useEnvironmentalSoftening();

  const contrastMultiplier =
    getGradientContrastMultiplier(environmentalProfile);
  const shouldApplySoftening = !disabled && shouldReduceGradientContrast;

  // When gradient contrast is reduced, we use softer, more subtle colors
  const adjustedColors = shouldApplySoftening
    ? ([palette.borderLight, palette.background] as const)
    : colors ?? ([palette.lavender, palette.background] as const);

  return (
    <View style={[styles.container, style]}>
      {shouldApplySoftening ? (
        <LinearGradient
          colors={adjustedColors}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
});
