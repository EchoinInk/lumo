/**
 * AnimatedCard Component
 *
 * A card component with gentle entrance and elevation animations.
 * Subtle depth animation on press/hover.
 */

import { softFadeIn } from "@/animations/transitions";
import { usePalette } from "@/theme/usePalette";
import React from "react";
import { GestureResponderEvent, StyleSheet, ViewStyle } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  testID?: string;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  elevated = false,
  onPress,
  testID,
}) => {
  const palette = usePalette();

  const isPressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = withTiming(isPressed.value ? 0.98 : 1, {
      duration: 150,
    });

    const translateY = withTiming(isPressed.value ? -2 : 0, {
      duration: 150,
    });

    return {
      transform: [{ scale }, { translateY }],
    };
  });

  const handlePressIn = () => {
    if (onPress) {
      isPressed.value = true;
    }
  };

  const handlePressOut = () => {
    isPressed.value = false;
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor: palette.card,
      shadowColor: "#000",
    },
    animatedStyle,
    style,
  ];

  return (
    <Animated.View
      entering={softFadeIn()}
      style={cardStyle}
      onStartShouldSetResponder={() => !!onPress}
      onResponderGrant={handlePressIn}
      onResponderRelease={handlePressOut}
      onResponderTerminate={handlePressOut}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
});
