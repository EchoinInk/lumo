import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { Text } from "@/src/components/ui/Text";
import { MoreScreenHeader } from "@/src/features/more/components";
import { ReminderSettingsCard } from "@/src/features/reminders/components/ReminderSettingsCard";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { usePalette, createThemedValue } from "@/theme/usePalette";
import { Spacing } from "@/src/theme/tokens";
import { router } from "expo-router";
import {
  Bell,
  ChevronRight,
  Moon,
  User,
} from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";

type SettingsItem = {
  icon: React.ReactNode;
  label: string;
  value?: string;
  hasToggle?: boolean;
};

type SettingsSection = {
  title: string;
  items: SettingsItem[];
};

const useSettingsSections = createThemedValue((palette): SettingsSection[] => [
  {
    title: "Preferences",
    items: [
      {
        icon: <Bell size={20} color={palette.warning} />,
        label: "Notifications",
        hasToggle: true,
      },
    ],
  },
  {
    title: "Accessibility",
    items: [
      {
        icon: <Moon size={20} color={palette.primary} />,
        label: "Reduced Motion",
        hasToggle: true,
      },
      {
        icon: <Bell size={20} color={palette.warning} />,
        label: "Haptics",
        hasToggle: true,
      },
      {
        icon: <User size={20} color={palette.purple} />,
        label: "Simplified Mode",
        hasToggle: true,
      },
    ],
  },
]);

export default function SettingsScreen() {
  const palette = usePalette();
  const styles = useStyles();
  const settingsSections = useSettingsSections();

  const { settings, updateSettings } = useSettingsStore();

  const handleToggle = (label: string) => {
    switch (label) {
      case "Reduced Motion":
        updateSettings({ reducedMotion: !settings.reducedMotion });
        break;
      case "Haptics":
        updateSettings({
          hapticFeedbackEnabled: !settings.hapticFeedbackEnabled,
        });
        break;
      case "Simplified Mode":
        updateSettings({ simplifiedMode: !settings.simplifiedMode });
        break;
      case "Notifications":
        updateSettings({
          notificationsEnabled: !settings.notificationsEnabled,
        });
        break;
    }
  };

  const getToggleValue = (label: string): boolean => {
    switch (label) {
      case "Reduced Motion":
        return settings.reducedMotion;
      case "Haptics":
        return settings.hapticFeedbackEnabled;
      case "Simplified Mode":
        return settings.simplifiedMode;
      case "Notifications":
        return settings.notificationsEnabled;
      default:
        return false;
    }
  };

  return (
    <Screen scrollable padded>
      <MoreScreenHeader title="Settings" subtitle="App Preferences" />

      <View style={styles.section}>
        <Text
          variant="caption"
          color={palette.textSecondary}
          style={styles.sectionTitle}
        >
          Reminders
        </Text>
        <ReminderSettingsCard />
        <TouchableOpacity
          style={styles.reminderLink}
          onPress={() =>
            router.push({ pathname: "/reminder-settings" as const } as any)
          }
          accessibilityRole="button"
          accessibilityLabel="Open reminder settings"
          accessibilityHint="Opens the full reminder settings screen"
        >
          <Text variant="caption" color={palette.primary}>
            Open reminder settings
          </Text>
          <ChevronRight size={16} color={palette.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text variant="subheading">Appearance</Text>
        <View style={styles.themeChoices} accessibilityRole="radiogroup" accessibilityLabel="Appearance">
          {(["system", "light", "dark"] as const).map((mode) => (
            <Button key={mode} size="sm" variant={settings.theme === mode ? "primary" : "secondary"}
              accessibilityRole="radio" aria-checked={settings.theme === mode}
              accessibilityState={{ checked: settings.theme === mode }}
              accessibilityLabel={mode === "system" ? "Use device appearance" : `${mode} appearance`}
              onPress={() => updateSettings({ theme: mode })}>
              {{ system: "Device", light: "Light", dark: "Dark" }[mode]}
            </Button>
          ))}
        </View>
      </View>
      {/* Settings Sections */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text
              variant="caption"
              color={palette.textSecondary}
              style={styles.sectionTitle}
            >
              {section.title}
            </Text>
            <Card variant="elevated" style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex < section.items.length - 1 &&
                      styles.settingItemBorder,
                  ]}
                  activeOpacity={item.hasToggle ? 1 : 0.7}
                  onPress={
                    item.hasToggle ? () => handleToggle(item.label) : undefined
                  }
                >
                  <View style={styles.settingIcon}>{item.icon}</View>
                  <Text variant="body" style={styles.settingLabel}>
                    {item.label}
                  </Text>
                  {item.hasToggle ? (
                    <Switch
                      value={getToggleValue(item.label)}
                      trackColor={{ false: palette.controlOutline, true: palette.primary }}
                      thumbColor={palette.textInverse}
                      onValueChange={() => handleToggle(item.label)}
                      accessibilityLabel={`Toggle ${item.label}`}
                      accessibilityRole="switch"
                    />
                  ) : (
                    <View style={styles.settingValue}>
                      <Text variant="caption" color={palette.textSecondary}>
                        {item.value}
                      </Text>
                      <ChevronRight size={18} color={palette.textTertiary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  themeChoices: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginTop: Spacing.sm },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCard: {
    padding: 0,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  settingIcon: {
    marginRight: Spacing.md,
  },
  settingLabel: {
    flex: 1,
    fontWeight: "500",
  },
  settingValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  reminderLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
    minHeight: 44,
    paddingHorizontal: Spacing.sm,
  },
}));
