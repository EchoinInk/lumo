/**
 * RetryView Component
 *
 * Calm retry interface with gentle feedback.
 * Non-aggressive, patient retry UX.
 */

import { getRetryMessage } from "@/constants/feedbackMessages";
import { usePalette, createThemedValue } from "@/theme/usePalette";
import React, { useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface RetryViewProps {
  onRetry: () => void;
  retryKey?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  isLoading?: boolean;
  testID?: string;
}

export const RetryView: React.FC<RetryViewProps> = ({
  onRetry,
  retryKey = "general",
  title,
  description,
  actionLabel,
  isLoading = false,
  testID,
}) => {
  const palette = usePalette();
  const styles = useStyles();

  const [attempt, setAttempt] = useState(0);
  const message = getRetryMessage(retryKey);

  const handleRetry = () => {
    setAttempt((prev) => prev + 1);
    onRetry();
  };

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: palette.textPrimary }]}>
          {title || message.title}
        </Text>
        <Text style={[styles.description, { color: palette.textSecondary }]}>
          {description || message.description}
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: palette.primary }]}
          onPress={handleRetry}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel={actionLabel || message.actionLabel}
          accessibilityState={{ disabled: isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator color={palette.textPrimary} />
          ) : (
            <Text style={styles.buttonText}>
              {actionLabel || message.actionLabel}
            </Text>
          )}
        </TouchableOpacity>
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
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
    minWidth: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.textPrimary,
  },
}));
