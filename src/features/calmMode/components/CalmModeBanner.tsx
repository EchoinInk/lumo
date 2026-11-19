/**
 * CalmModeBanner Component
 *
 * Softly indicates Calm Mode is active.
 * Provides reassurance and an accessible exit path.
 */

import { Text } from "@/components/ui/Text";
import { UX } from "@/constants/ux";
import { createThemedValue } from "@/theme/usePalette";
import { Spacing } from "@/theme/tokens";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useCalmMode } from "../hooks/useCalmMode";

interface CalmModeBannerProps {
  onDismiss?: () => void;
}

export function CalmModeBanner({ onDismiss }: CalmModeBannerProps) {
  const styles = useStyles();

  const { isCalmModeEnabled, disableCalmMode } = useCalmMode();

  if (!isCalmModeEnabled) {
    return null;
  }

  const handleDismiss = () => {
    disableCalmMode();
    onDismiss?.();
  };

  return (
    <View style={styles.container} accessible accessibilityRole="alert">
      <View style={styles.content}>
        <Text variant="caption" style={styles.text}>
          Calm Mode is softening the environment.
        </Text>
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.dismissButton}
          accessibilityLabel="Disable Calm Mode"
          accessibilityHint="Returns the environment to its standard visual intensity"
          accessibilityRole="button"
        >
          <Text variant="caption" style={styles.dismissText}>
            Exit
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    backgroundColor: palette.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  text: {
    color: palette.textSecondary,
    flex: 1,
  },
  dismissButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    minHeight: UX.touchTarget,
    minWidth: UX.touchTargetLarge,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissText: {
    color: palette.primary,
    fontWeight: "600",
  },
}));
