import { useReducedMotion } from "@/hooks/useReducedMotion";
import tokens from "@/theme/mello-tokens.json";
import { useEnvironmentalSoftening } from "@/src/features/calmMode/hooks/useEnvironmentalSoftening";
import { type ReactNode, useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewStyle } from "react-native";

interface PlanningGentleFadeProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function PlanningGentleFade({ children, style }: PlanningGentleFadeProps) {
  const { shouldReduceMotion: calmMotion } = useEnvironmentalSoftening();
  const reducedMotion = useReducedMotion();
  const shouldReduceMotion = reducedMotion || calmMotion;
  const opacity = useRef(new Animated.Value(shouldReduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (shouldReduceMotion) {
      opacity.setValue(1);
      return;
    }

    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: tokens.motion.selectionFadeMs,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [opacity, shouldReduceMotion]);

  return (
    <Animated.View style={[styles.container, style, { opacity }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});
