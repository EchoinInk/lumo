import { createThemedValue } from "@/theme/usePalette";
/**
 * Offline Banner
 *
 * Displays a gentle banner when the app is offline.
 * Tone: Calm, reassuring, not alarming.
 *
 * Messaging philosophy:
 * - Avoid harsh "disconnected" language
 * - Use gentle offline metaphors
 * - Reassure that data is safe
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "../ui/Text";

export function OfflineBanner(): React.JSX.Element {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Text variant="body" style={styles.message}>
        You're offline. Your data is safe here 💜
      </Text>
    </View>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    backgroundColor: palette.taskPanel,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
  },
  message: {
    textAlign: "center",
  },
}));
