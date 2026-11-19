/**
 * Sync Failure Banner
 *
 * Displays a gentle banner when sync has failed.
 * Tone: Calm, reassuring, not alarming.
 *
 * Messaging philosophy:
 * - Avoid harsh "failure" language
 * - Use gentle drift metaphors
 * - Offer clear retry path
 */

import { createThemedValue } from "@/theme/usePalette";
import { Radius, Spacing } from "@/theme/tokens";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../ui/Text";
import { RetryButton } from "./RetryButton";

interface Props {
  onRetry: () => void;
  isRetrying?: boolean;
}

export function SyncFailureBanner({
  onRetry,
  isRetrying = false,
}: Props): React.JSX.Element {
  const styles = useStyles();

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel="Something drifted out of sync"
    >
      <Text variant="body" style={styles.message}>
        Something drifted out of sync
      </Text>
      <RetryButton onPress={onRetry} isRetrying={isRetrying} />
    </View>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  message: {
    flex: 1,
  },
}));
