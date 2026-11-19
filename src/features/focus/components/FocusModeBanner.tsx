/**
 * FocusModeBanner
 *
 * A calm, non-alarming banner that shows Focus Mode is active.
 * Displays a soft message with one visible exit action.
 */

import { createThemedValue } from "@/theme/usePalette";
import { Radius, Spacing, Typography } from "@/src/theme/tokens";
import { StyleSheet, Text, View } from "react-native";
import { FocusExitButton } from "./FocusExitButton";

interface FocusModeBannerProps {
  onExit: () => void;
}

export function FocusModeBanner({ onExit }: FocusModeBannerProps) {
  const styles = useStyles();

  return (
    <View style={styles.container} accessible>
      <Text
        style={styles.message}
        accessible
        accessibilityLabel="Focus Mode is keeping things simple"
      >
        Focus Mode is keeping things simple.
      </Text>
      <FocusExitButton onPress={onExit} />
    </View>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    backgroundColor: palette.lavender,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  message: {
    ...Typography.body,
    color: palette.textPrimary,
    flex: 1,
  },
}));
