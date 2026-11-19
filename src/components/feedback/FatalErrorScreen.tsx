import { createThemedValue } from "@/theme/usePalette";
/**
 * Fatal Error Screen
 *
 * Displayed when the app encounters a critical error.
 * Tone: Calm, reassuring, not alarming.
 *
 * Messaging philosophy:
 * - Avoid harsh technical jargon
 * - Use gentle, human language
 * - Offer clear recovery path
 * - Never blame the user
 */

import React from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button } from "../ui/Button";
import { Text } from "../ui/Text";

interface Props {
  error: Error | null;
  onReset: () => void;
}

export function FatalErrorScreen({ error, onReset }: Props): React.JSX.Element {
  const styles = useStyles();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>💜</Text>
      </View>

      <Text variant="heading" style={styles.title}>
        Something drifted out of sync
      </Text>

      <Text variant="body" style={styles.message}>
        Mello encountered an unexpected moment. Let's try again gently.
      </Text>

      {__DEV__ && error && (
        <View style={styles.errorContainer}>
          <Text variant="small" style={styles.errorTitle}>
            Error details (dev only):
          </Text>
          <Text variant="small" style={styles.errorText}>
            {error.message}
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button onPress={onReset} style={styles.button}>
          Try again
        </Button>
      </View>
    </ScrollView>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    minHeight: "100%",
  },
  iconContainer: {
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: palette.textPrimary,
    textAlign: "center",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: palette.taskPanel,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    width: "100%",
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.danger,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: palette.textSecondary,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  buttonContainer: {
    width: "100%",
  },
  button: {
    width: "100%",
  },
}));
