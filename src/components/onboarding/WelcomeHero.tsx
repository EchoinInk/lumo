/**
 * WelcomeHero Component
 *
 * Hero section for onboarding welcome screen.
 * Warm, reassuring introduction to the app.
 */

import { FadeIn } from "@/components/animated/FadeIn";
import { usePalette } from "@/theme/usePalette";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface WelcomeHeroProps {
  title: string;
  subtitle?: string;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  title,
  subtitle,
}) => {
  const palette = usePalette();

  return (
    <View style={styles.container}>
      <FadeIn delay={0}>
        <Text style={[styles.title, { color: palette.textPrimary }]}>
          {title}
        </Text>
      </FadeIn>
      {subtitle && (
        <FadeIn delay={100}>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            {subtitle}
          </Text>
        </FadeIn>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 28,
  },
});
