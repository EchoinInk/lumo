import { Text } from "@/src/components/ui/Text";
import { usePalette, createThemedValue } from "@/theme/usePalette";
import { Spacing, Typography } from "@/src/theme/tokens";
import { Sparkles, Sun } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

interface StartHeaderProps {
  name?: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function StartHeader({ name = "there" }: StartHeaderProps) {
  const palette = usePalette();
  const styles = useStyles();

  const greeting = getGreeting();

  return (
    <View style={styles.container}>
      <View style={styles.greetingRow}>
        <Text variant="title" style={styles.greeting}>
          {greeting}, {name}
        </Text>
        <View style={styles.iconContainer}>
          <Sun size={20} color={palette.warning} />
        </View>
      </View>
      <View style={styles.subtitleRow}>
        <Sparkles size={14} color={palette.pink} />
        <Text variant="body" color={palette.textSecondary} style={styles.subtitle}>
          You&apos;ve got this. One step at a time.
        </Text>
      </View>
    </View>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  greeting: {
    ...Typography.heading,
    color: palette.textPrimary,
  },
  iconContainer: {
    marginLeft: Spacing.xs,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  subtitle: {
    fontStyle: "italic",
  },
}));
