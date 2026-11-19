import { MelloLogo } from "./MelloLogo";
import { usePalette } from "@/theme/usePalette";
import { Spacing } from "@/src/theme/tokens";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "./Text";

interface ScreenBackButtonProps {
  fallbackPath: string;
  showWordmark?: boolean;
}

export function ScreenBackButton({ fallbackPath, showWordmark = false }: ScreenBackButtonProps) {
  const palette = usePalette();

  const handlePress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace({ pathname: fallbackPath as never });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        accessibilityHint="Returns to the previous screen"
        activeOpacity={0.7}
      >
        <ChevronLeft size={18} color={palette.primary} />
        <Text variant="body" color={palette.primary} style={styles.label}>
          Back
        </Text>
      </TouchableOpacity>
      {showWordmark && <View pointerEvents="none" style={styles.wordmark}><MelloLogo compact /></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  wordmark: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  button: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  label: {
    fontWeight: "600",
  },
});
