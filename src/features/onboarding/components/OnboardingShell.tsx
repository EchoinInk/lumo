/**
 * Onboarding Shell
 * Provides consistent layout for onboarding screens
 */

import { Button } from "@/src/components/ui/Button";
import { Text } from "@/src/components/ui/Text";
import { usePalette } from "@/theme/usePalette";
import { Radius, Spacing } from "@/src/theme/tokens";
import { MelloLogo } from "@/components/ui/MelloLogo";
import { ReactNode } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { OnboardingProgress } from "./OnboardingProgress";

interface OnboardingShellProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  canProceed?: boolean;
}

export function OnboardingShell({
  children,
  title,
  subtitle,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  nextLabel = "Continue",
  canProceed = true,
}: OnboardingShellProps) {
  const palette = usePalette();

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Header */}
          <View style={styles.header}>
            <MelloLogo compact={currentStep !== 1} />
            <OnboardingProgress current={currentStep} total={totalSteps} />
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text variant="heading" style={styles.title}>
              {title}
            </Text>
            {subtitle && (
              <Text
                variant="body"
                color={palette.textSecondary}
                style={styles.subtitle}
              >
                {subtitle}
              </Text>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>{children}</View>

          {/* Footer with Actions */}
          <View style={styles.footer}>
            <Button
              onPress={onNext}
              disabled={!canProceed}
              variant="primary"
              size="lg"
              style={styles.nextButton}
              accessibilityLabel={nextLabel}
              accessibilityRole="button"
            >
              {nextLabel}
            </Button>
            {onBack && (
              <Button
                onPress={onBack}
                variant="ghost"
                size="md"
                style={styles.backButton}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                Back
              </Button>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing["2xl"],
    paddingBottom: Spacing.xl,
  },
  header: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  titleSection: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    lineHeight: 24,
  },
  content: {
    flex: 1,
    marginBottom: Spacing.xl,
  },
  footer: {
    gap: Spacing.md,
  },
  nextButton: {
    borderRadius: Radius.lg,
  },
  backButton: {
    alignSelf: "center",
  },
});
