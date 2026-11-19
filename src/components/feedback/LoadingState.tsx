/**
 * LoadingState Component
 *
 * Calm loading state with skeleton support.
 * No flashing, no layout jumps.
 */

import { getLoadingMessage } from "@/constants/feedbackMessages";
import { usePalette } from "@/theme/usePalette";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface LoadingStateProps {
  loadingKey?: string;
  message?: string;
  testID?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  loadingKey = "default",
  message,
  testID,
}) => {
  const palette = usePalette();

  const loadingMessage = message || getLoadingMessage(loadingKey);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.content}>
        <ActivityIndicator color={palette.primary} size="large" />
        <Text style={[styles.message, { color: palette.textSecondary }]}>
          {loadingMessage}
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
  },
  message: {
    fontSize: 14,
    marginTop: 16,
  },
});
