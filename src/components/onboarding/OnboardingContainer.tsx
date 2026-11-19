/**
 * OnboardingContainer Component
 * 
 * Container for the onboarding flow.
 * Provides calm, supportive environment for first-time users.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { usePalette } from "@/theme/usePalette";
import { BlurView } from 'expo-blur';

interface OnboardingContainerProps {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
}

export const OnboardingContainer: React.FC<OnboardingContainerProps> = ({
  children,
  step,
  totalSteps,
}) => {
  const palette = usePalette();

  const { isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? palette.background : palette.background }]}>
      <BlurView
        intensity={20}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
});
