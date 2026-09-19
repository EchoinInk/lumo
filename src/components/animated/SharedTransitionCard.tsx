/**
 * SharedTransitionCard Component
 *
 * A card component with shared element transition support.
 * For smooth navigation between screens with card continuity.
 */

import { Colors } from "@/theme/colors";
import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

interface SharedTransitionCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  sharedTransitionTag: string;
  testID?: string;
}

export const SharedTransitionCard: React.FC<SharedTransitionCardProps> = ({
  children,
  style,
  sharedTransitionTag,
  testID,
}) => {
  const cardStyle = [
    styles.card,
    {
      backgroundColor: Colors.card,
      shadowColor: "#000",
    },
    style,
  ];

  return (
    <Animated.View
      style={cardStyle}
      sharedTransitionTag={sharedTransitionTag}
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
