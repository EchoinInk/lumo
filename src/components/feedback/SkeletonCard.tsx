/**
 * SkeletonCard Component
 *
 * Calm skeleton placeholder for cards.
 * Soft shimmer, no flashing, layout-preserving.
 */

import { usePalette, createThemedValue } from "@/theme/usePalette";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

interface SkeletonCardProps {
  style?: any;
  lines?: number;
  testID?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  style,
  lines = 3,
  testID,
}) => {
  const palette = usePalette();
  const styles = useStyles();

  const opacity = useSharedValue(0.5);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[styles.container, style, animatedStyle]}
      testID={testID}
    >
      <View style={[styles.title, { backgroundColor: palette.border }]} />
      {Array.from({ length: lines }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.line,
            { backgroundColor: palette.border },
            index === lines - 1 && styles.lastLine,
          ]}
        />
      ))}
    </Animated.View>
  );
};

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: palette.card,
  },
  title: {
    width: "60%",
    height: 20,
    borderRadius: 4,
    marginBottom: 12,
  },
  line: {
    width: "100%",
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  lastLine: {
    width: "80%",
  },
}));
