/**
 * Recovery Sheet
 *
 * A bottom sheet for recovery actions when something goes wrong.
 * Tone: Calm, reassuring, not alarming.
 *
 * Messaging philosophy:
 * - Avoid harsh technical jargon
 * - Use gentle recovery language
 * - Offer clear action options
 */

import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text } from "../ui/Text";
import { Button } from "../ui/Button";

interface Props {
  title: string;
  message: string;
  actions: Array<{
    label: string;
    onPress: () => void;
    variant?: "primary" | "ghost" | "danger";
  }>;
  onClose?: () => void;
}

export function RecoverySheet({ title, message, actions, onClose }: Props): React.JSX.Element {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>

      <Text variant="body" style={styles.message}>
        {message}
      </Text>

      <View style={styles.actions}>
        {actions.map((action, index) => (
          <Button
            key={index}
            onPress={action.onPress}
            variant={action.variant || "primary"}
            style={styles.action}
          >
            {action.label}
          </Button>
        ))}

        {onClose ? (
          <Button onPress={onClose} variant="ghost" style={styles.action}>
            Cancel
          </Button>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  content: {
    padding: 24,
  },
  title: {
    marginBottom: 12,
  },
  message: {
    marginBottom: 24,
    lineHeight: 24,
  },
  actions: {
    gap: 12,
  },
  action: {
    width: "100%",
  },
});
