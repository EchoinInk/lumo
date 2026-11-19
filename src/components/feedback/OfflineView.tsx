/**
 * OfflineView Component
 *
 * Calm offline state indicator.
 * Non-alarming, reassuring offline UX.
 */

import { getOfflineMessage } from "@/constants/feedbackMessages";
import { usePalette } from "@/theme/usePalette";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface OfflineViewProps {
  offlineKey?: string;
  title?: string;
  description?: string;
  testID?: string;
}

export const OfflineView: React.FC<OfflineViewProps> = ({
  offlineKey = "default",
  title,
  description,
  testID,
}) => {
  const palette = usePalette();

  const message = getOfflineMessage(offlineKey);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.content}>
        <View style={[styles.indicator, { backgroundColor: palette.warning }]} />
        <Text style={[styles.title, { color: palette.textPrimary }]}>
          {title || message.title}
        </Text>
        <Text style={[styles.description, { color: palette.textSecondary }]}>
          {description || message.description}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    maxWidth: 300,
  },
  indicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
