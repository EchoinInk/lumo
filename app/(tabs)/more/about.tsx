import { MelloLogo } from "@/components/ui/MelloLogo";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { Text } from "@/src/components/ui/Text";
import { MoreScreenHeader } from "@/src/features/more/components";
import { usePalette, createThemedValue } from "@/theme/usePalette";
import { Spacing } from "@/src/theme/tokens";
import { Heart } from "lucide-react-native";
import { ScrollView, StyleSheet, View } from "react-native";

const appInfo = [
  { label: "Version", value: "1.0.0" },
  { label: "Build", value: "2024.5.26" },
  { label: "Platform", value: "React Native / Expo" },
];

export default function AboutScreen() {
  const palette = usePalette();
  const styles = useStyles();

  return (
    <Screen scrollable padded>
      <MoreScreenHeader title="About Mello" subtitle="App Information" />

      {/* App Info Cards */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <Card style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <MelloLogo />
            <Text
              variant="title"
              color={palette.textPrimary}
              style={styles.welcomeTitle}
            >
              Welcome to Mello
            </Text>
            <Text
              variant="body"
              color={palette.textPrimary}
              style={styles.welcomeText}
            >
              Your gentle companion for a calmer, more organized life. Built
              with love for the neurodivergent community.
            </Text>
          </View>
        </Card>

        {/* Info List */}
        <Card variant="elevated" style={styles.infoCard}>
          {appInfo.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.infoRow,
                index < appInfo.length - 1 && styles.infoRowBorder,
              ]}
            >
              <Text variant="body" color={palette.textSecondary}>
                {item.label}
              </Text>
              <Text variant="body" style={styles.infoValue}>
                {item.value}
              </Text>
            </View>
          ))}
        </Card>

        {/* Made with Love */}
        <View style={styles.madeWithLove}>
          <Heart size={16} color={palette.pink} />
          <Text variant="caption" color={palette.textSecondary}>
            Made with care for you
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  welcomeCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.xl,
  },
  welcomeContent: {
    alignItems: "center",
  },
  welcomeTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  welcomeText: {
    textAlign: "center",
  },
  infoCard: {
    padding: 0,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  infoValue: {
    fontWeight: "500",
  },
  madeWithLove: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
}));
