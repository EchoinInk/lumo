/**
 * ErrorState Component
 *
 * Calm, reassuring error state component.
 * No technical jargon, no alarming language.
 */

import { getErrorMessage } from "@/constants/feedbackMessages";
import { Button } from "@/components/ui/Button";
import { usePalette } from "@/theme/usePalette";
import { Spacing, Typography } from "@/theme/tokens";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ErrorStateProps {
  errorKey?: string;
  title?: string;
  description?: string;
  onRetry?: () => void;
  actionLabel?: string;
  testID?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  errorKey = "unknown",
  title,
  description,
  onRetry,
  actionLabel,
  testID,
}) => {
  const palette = usePalette();

  const message = getErrorMessage(errorKey);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: palette.textPrimary }]}>
          {title || message.title}
        </Text>
        <Text style={[styles.description, { color: palette.textSecondary }]}>
          {description || message.description}
        </Text>
        {onRetry && (
          <Button
            style={styles.button}
            onPress={onRetry}
            accessibilityLabel={actionLabel || message.actionLabel}
            accessibilityHint="Retries the recovery action"
          >
            {actionLabel || message.actionLabel}
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  content: {
    alignItems: "center",
    maxWidth: 300,
  },
  title: {
    ...Typography.subheading,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  button: {
    minWidth: 120,
  },
});
