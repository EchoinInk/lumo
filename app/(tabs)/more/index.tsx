import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Text } from "@/src/components/ui/Text";
import { usePalette } from "@/theme/usePalette";
import { Radius, Spacing } from "@/src/theme/tokens";
import { router } from "expo-router";
import {
    ArrowRight,
    Archive,
    CreditCard,
    Dumbbell,
    Layers,
    Home,
    Moon,
    Ruler,
    Scale,
    Settings,
    ShoppingCart,
    Sparkles,
    Sunrise,
    Utensils,
    Wallet,
} from "lucide-react-native";
import React from "react";
import { useSimplifiedMode } from "@/src/hooks/useSimplifiedMode";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface FeatureCardProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  onPress?: () => void;
}

function FeatureCard({ title, icon, color, onPress }: FeatureCardProps) {
  const palette = usePalette();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.cardContainer}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={`Opens ${title}`}
    >
      <Card variant="elevated" style={styles.featureCard}>
        <View style={[styles.iconWrapper, { backgroundColor: color + "15" }]}>
          {icon}
        </View>
        <View style={styles.cardContent}>
          <Text variant="body" style={styles.cardTitle}>
            {title}
          </Text>
          <ArrowRight size={18} color={palette.textTertiary} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const palette = usePalette();

  const simplifiedMode = useSimplifiedMode();
  const features = [
    {
      title: "Budget Tracker",
      icon: <Wallet size={22} color={palette.success} />,
      color: palette.success,
      route: "/(tabs)/more/budget",
    },
    {
      title: "Payment Logs",
      icon: <CreditCard size={22} color={palette.blue} />,
      color: palette.blue,
      route: "/(tabs)/more/payments",
    },
    {
      title: "Weekly Groceries",
      icon: <ShoppingCart size={22} color={palette.purple} />,
      color: palette.purple,
      route: "/(tabs)/more/groceries",
    },
    {
      title: "My Meals",
      icon: <Utensils size={22} color={palette.pink} />,
      color: palette.pink,
      route: "/(tabs)/more/meals",
    },
    {
      title: "Recipes",
      icon: <Utensils size={22} color={palette.purple} />,
      color: palette.purple,
      route: "/(tabs)/more/recipes",
    },
    { title: "Weekly Meal Planner", icon: <Utensils size={22} color={palette.purple} />, color: palette.purple, route: "/(tabs)/more/meal-planner" },
    {
      title: "Cleaning Schedule",
      icon: <Home size={22} color={palette.warning} />,
      color: palette.warning,
      route: "/(tabs)/more/cleaning",
    },
    {
      title: "Weight Tracker",
      icon: <Scale size={22} color={palette.primary} />,
      color: palette.primary,
      route: "/(tabs)/more/weight",
    },
    {
      title: "My Workout Log",
      icon: <Dumbbell size={22} color={palette.pink} />,
      color: palette.pink,
      route: "/(tabs)/more/workouts",
    },
    {
      title: "Body Measurements",
      icon: <Ruler size={22} color={palette.purple} />,
      color: palette.purple,
      route: "/(tabs)/more/measurements",
    },
    {
      title: "Morning planning",
      icon: <Sunrise size={22} color={palette.primary} />,
      color: palette.primary,
      route: "/planning/morning",
    },
    {
      title: "Evening reset",
      icon: <Moon size={22} color={palette.purple} />,
      color: palette.purple,
      route: "/planning/evening",
    },
    {
      title: "Routine Bundles",
      icon: <Layers size={22} color={palette.blue} />,
      color: palette.blue,
      route: "/routine-bundles",
    },
    {
      title: "Parked items",
      icon: <Archive size={22} color={palette.textSecondary} />,
      color: palette.textSecondary,
      route: "/parked",
    },
    {
      title: "Settings",
      icon: <Settings size={22} color={palette.textSecondary} />,
      color: palette.textSecondary,
      route: "/(tabs)/more/settings",
    },
  ];
  return (
    <Screen scrollable padded>
      <SectionHeader title="More" subtitle="All your features" />

      {/* Feature Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
      >
        {(simplifiedMode
          ? features.filter((feature) => ["Morning planning", "Evening reset", "Parked items", "Settings"].includes(feature.title))
          : features
        ).map((feature, index) => (
          <FeatureCard
            key={index}
            title={feature.title}
            icon={feature.icon}
            color={feature.color}
            onPress={() => router.push(feature.route as any)}
          />
        ))}
      </ScrollView>

      {/* Support Card */}
      {!simplifiedMode && <Card variant="gradient" style={styles.supportCard}>
        <View style={styles.supportContent}>
          <Sparkles size={20} color={palette.textInverse} />
          <Text
            variant="body"
            color={palette.textInverse}
            style={styles.supportText}
          >
            Need help? We&apos;re here for you.
          </Text>
        </View>
      </Card>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  cardContainer: {
    flex: 1,
    minWidth: "45%",
  },
  featureCard: {
    padding: Spacing.lg,
    alignItems: "flex-start",
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  cardTitle: {
    fontWeight: "500",
    flex: 1,
  },
  supportCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  supportContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  supportText: {
    fontWeight: "600",
  },
});
