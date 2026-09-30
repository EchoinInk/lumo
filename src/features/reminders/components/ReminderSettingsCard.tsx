import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui/Text";
import { resolveEffectiveReminderPolicy, useReminders, type ReminderTone } from "@/src/features/reminders";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { Colors, Radius, Spacing } from "@/src/theme/tokens";
import { StyleSheet, TouchableOpacity, View } from "react-native";

const tones: ReminderTone[] = ["gentle", "practical", "encouraging"];

export function ReminderSettingsCard() {
  const { settings, updateSettings } = useReminders();
  const appNotificationsEnabled = useSettingsStore((state) => state.settings.notificationsEnabled);
  const policy = resolveEffectiveReminderPolicy({ notificationsEnabled: appNotificationsEnabled }, settings);

  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text variant="subheading">Gentle reminders</Text>
          <Text variant="caption" color={Colors.textSecondary}>
            Soft nudges, quiet hours respected.
          </Text>
        </View>
        <Button
          size="sm"
          variant={settings.remindersEnabled ? "secondary" : "ghost"}
          onPress={() =>
            void updateSettings({ remindersEnabled: !settings.remindersEnabled })
          }
          accessibilityRole="switch"
          accessibilityState={{ checked: settings.remindersEnabled }}
        >
          {settings.remindersEnabled ? "On" : "Off"}
        </Button>
      </View>

      <View style={styles.tones}>
        {tones.map((tone) => {
          const isSelected = settings.tone === tone;
          return (
            <TouchableOpacity
              key={tone}
              style={[styles.tone, isSelected && styles.toneSelected]}
              onPress={() => void updateSettings({ tone })}
              accessibilityRole="button"
              accessibilityLabel={`${tone} reminder tone`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                variant="caption"
                color={isSelected ? Colors.textInverse : Colors.textSecondary}
              >
                {tone.charAt(0).toUpperCase() + tone.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!policy.enabled && (
        <Text variant="caption" color={Colors.warning} accessibilityLiveRegion="polite">
          {policy.reason === "app-notifications-disabled"
            ? "Reminder delivery is off because Notifications are disabled in app preferences."
            : "Reminder delivery is off in reminder preferences."}
        </Text>
      )}

      <View style={styles.quietHours}>
        <Text variant="label" color={Colors.textSecondary}>
          Quiet hours
        </Text>
        <Text variant="body">
          {settings.quietHoursStart} – {settings.quietHoursEnd}
        </Text>
        <Text variant="caption" color={Colors.textTertiary}>
          Reminders stay gentle during this window.
        </Text>
      </View>

      <View style={styles.hapticsRow}>
        <View style={styles.hapticsCopy}>
          <Text variant="label" color={Colors.textSecondary}>
            Haptics
          </Text>
          <Text variant="caption" color={Colors.textTertiary}>
            Soft feedback when reminders are used.
          </Text>
        </View>
        <Button
          size="sm"
          variant={settings.hapticsEnabled ? "secondary" : "ghost"}
          onPress={() =>
            void updateSettings({ hapticsEnabled: !settings.hapticsEnabled })
          }
          accessibilityRole="switch"
          accessibilityState={{ checked: settings.hapticsEnabled }}
          accessibilityLabel="Reminder haptics"
        >
          {settings.hapticsEnabled ? "On" : "Off"}
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.md,
  },
  tones: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tone: {
    minHeight: 44,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
  },
  toneSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quietHours: {
    gap: Spacing.xs,
  },
  hapticsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.md,
  },
  hapticsCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
});
