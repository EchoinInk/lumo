/**
 * SuccessState Component
 *
 * Calm success feedback.
 * Subtle, warm, non-exaggerated.
 */

import { getSuccessMessage } from "@/constants/feedbackMessages";
import { usePalette, createThemedValue } from "@/theme/usePalette";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface SuccessStateProps {
  successKey?: string;
  title?: string;
  description?: string;
  testID?: string;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  successKey = "taskCreated",
  title,
  description,
  testID,
}) => {
  const palette = usePalette();
  const styles = useStyles();

  const message = getSuccessMessage(successKey);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.content}>
        <View style={[styles.checkmark, { backgroundColor: palette.success }]}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
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

const useStyles = createThemedValue((palette) => StyleSheet.create({
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
  checkmark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  checkmarkText: {
    fontSize: 24,
    fontWeight: "600",
    color: palette.textPrimary,
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
}));
