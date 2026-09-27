import { Text } from "@/src/components/ui/Text";
import { Colors, Radius, Spacing } from "@/src/theme/tokens";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface MoreScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export function MoreScreenHeader({ title, subtitle }: MoreScreenHeaderProps) {
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace({ pathname: "/(tabs)/more" as const } as any);
  };
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleBack}
        style={styles.backButton}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Back to More"
      >
        <View style={styles.backButtonInner}>
          <ChevronLeft size={20} color={Colors.textSecondary} />
          <Text variant="body" color={Colors.textSecondary}>
            More
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text variant="title" style={styles.title}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="body" color={Colors.textSecondary}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: Spacing.md,
  },
  backButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.lavender,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  titleContainer: {
    gap: Spacing.xs,
  },
  title: {
    fontWeight: "600",
  },
});
