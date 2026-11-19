import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui/Text";
import { usePalette, createThemedValue } from "@/theme/usePalette";
import { Radius, Spacing } from "@/src/theme/tokens";
import { Bell, Droplets } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

interface ReminderCardProps {
  title?: string;
  message?: string;
  time?: string;
}

export function ReminderCard({
  title = "Reminder",
  message = "Drink water",
  time = "Every 2 hours",
}: ReminderCardProps) {
  const palette = usePalette();
  const styles = useStyles();

  return (
    <Card variant="outlined" style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Droplets size={20} color={palette.blue} />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text variant="body" style={styles.title}>
              {message}
            </Text>
            <Bell size={14} color={palette.textTertiary} />
          </View>
          <Text variant="caption" color={palette.textSecondary}>
            {time}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    backgroundColor: palette.backgroundAlt,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: palette.blue + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  title: {
    fontWeight: "500",
  },
}));
