/**
 * EmptyState Component
 *
 * Emotionally intelligent empty state.
 * Supportive, non-pressuring, calm.
 */

import { getEmptyState } from "@/constants/emptyStates";
import { usePalette, createThemedValue } from "@/theme/usePalette";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface EmptyStateProps {
  emptyKey?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  emptyKey = "search",
  title,
  description,
  actionLabel,
  onAction,
  testID,
}) => {
  const palette = usePalette();
  const styles = useStyles();

  const state = getEmptyState(emptyKey);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: palette.textPrimary }]}>
          {title || state.title}
        </Text>
        <Text style={[styles.description, { color: palette.textSecondary }]}>
          {description || state.description}
        </Text>
        {onAction && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: palette.primary }]}
            onPress={onAction}
            accessibilityRole="button"
            accessibilityLabel={actionLabel || state.actionLabel}
          >
            <Text style={styles.buttonText}>
              {actionLabel || state.actionLabel}
            </Text>
          </TouchableOpacity>
        )}
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
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.textPrimary,
  },
}));
