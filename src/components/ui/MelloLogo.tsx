import { usePalette } from "@/theme/usePalette";
import { Image, StyleSheet } from "react-native";

const horizontal = {
  light: require("../../../assets/branding/mello/mello-horizontal-on-porcelain-512w.png"),
  dark: require("../../../assets/branding/mello/mello-horizontal-on-plum-512w.png"),
};
const wordmark = {
  light: require("../../../assets/branding/mello/mello-wordmark-on-porcelain-256w.png"),
  dark: require("../../../assets/branding/mello/mello-wordmark-on-plum-256w.png"),
};
const mono = {
  light: require("../../../assets/branding/mello/mello-horizontal-black-512w.png"),
  dark: require("../../../assets/branding/mello/mello-horizontal-white-512w.png"),
};

export function MelloLogo({ compact = false }: { compact?: boolean }) {
  const { mode, quiet } = usePalette();
  const source = compact ? wordmark : quiet ? mono : horizontal;
  return <Image source={source[mode]} style={compact ? styles.wordmark : styles.full}
    resizeMode="contain" accessible accessibilityRole="image" accessibilityLabel="Mello" />;
}
const styles = StyleSheet.create({
  full: { width: 176, maxWidth: "100%", height: 40 },
  wordmark: { width: 74, height: 26 },
});
