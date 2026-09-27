import type { ImageSourcePropType, ImageStyle, StyleProp, ViewStyle } from "react-native";
import { Image, StyleSheet, View } from "react-native";

import { getMiriState, type MiriState as MiriStateName } from "@/constants/miriStates";

type MiriStateProps = {
  state: MiriStateName;
  size?: number;
  decorative?: boolean;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export function MiriState({
  state,
  size = 120,
  decorative = false,
  style,
  imageStyle,
}: MiriStateProps) {
  const config = getMiriState(state);

  return (
    <View
      style={[styles.container, { width: size, height: size }, style]}
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : "image"}
      accessibilityLabel={decorative ? undefined : config.accessibilityLabel}
      importantForAccessibility={decorative ? "no-hide-descendants" : "auto"}
    >
      <Image
        source={config.asset as ImageSourcePropType}
        resizeMode="contain"
        style={[styles.image, imageStyle]}
        accessible={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});