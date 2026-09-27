/**
 * Onboarding Complete
 * "Your space is ready."
 */

import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui/Text";
import { useOnboarding } from "@/src/features/onboarding/hooks/useOnboarding";
import { observability } from "@/src/services/observability";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { Colors, Radius, Shadows, Spacing } from "@/src/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Sparkles } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

export default function OnboardingCompleteScreen() {
  const { completeOnboarding, preferences } = useOnboarding();
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  const handleEnterLumo = async () => {
    await completeOnboarding();
    updateSettings({ simplifiedMode: preferences.planningStyle === "minimal" });
    observability.analytics.track("onboarding_completed");
    router.replace({ pathname: "/(tabs)" as const } as any);
  };

  return (
    <LinearGradient
      colors={[Colors.lavender, Colors.background]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Sparkles size={48} color={Colors.primary} />
          </View>
        </View>

        <Text variant="heading" style={styles.title}>
          Your space is ready.
        </Text>

        <Text
          variant="body"
          color={Colors.textSecondary}
          style={styles.subtitle}
        >
          Start small. Lumo will keep things gentle.
        </Text>

        <Card variant="elevated" style={styles.reminderCard}>
          <Text variant="caption" color={Colors.textSecondary}>
            You can always adjust your preferences in Settings.
          </Text>
        </Card>
      </View>

      <View style={styles.footer}>
        <Button
          onPress={() => void handleEnterLumo()}
          variant="primary"
          size="lg"
          style={styles.enterButton}
        >
          Enter Lumo
        </Button>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing["2xl"],
    paddingBottom: Spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: Radius.xl,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Shadows.sm.shadowColor,
    shadowOffset: Shadows.sm.shadowOffset,
    shadowOpacity: Shadows.sm.shadowOpacity,
    shadowRadius: Shadows.sm.shadowRadius,
    elevation: 2,
  },
  title: {
    fontWeight: "600",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  reminderCard: {
    padding: Spacing.md,
    alignItems: "center",
  },
  footer: {
    marginTop: Spacing.lg,
  },
  enterButton: {
    borderRadius: Radius.lg,
  },
});
