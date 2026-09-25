import { UX } from "@/constants/ux";
import { Colors, Padding, Spacing } from "@/theme/tokens";
import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ScrollViewProps,
    View,
    ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenProps extends ViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean | keyof typeof Padding;
  keyboardAvoiding?: boolean;
  backgroundColor?: string;
  scrollViewProps?: ScrollViewProps;
  centered?: boolean;
  accessibilityLabel?: string;
  /** Extra bottom padding to account for tab bar (default: true for tab screens) */
  bottomPadding?: boolean;
}

// Bottom padding for tab bar visibility
const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 88 : 72;
const BOTTOM_SAFE_PADDING = Spacing.xl;

export function Screen({
  children,
  scrollable = false,
  padded = true,
  keyboardAvoiding = false,
  backgroundColor = Colors.background,
  className = "",
  scrollViewProps,
  centered = false,
  accessibilityLabel,
  bottomPadding = true,
  style,
  ...props
}: ScreenProps) {
  const paddingValue =
    typeof padded === "boolean"
      ? padded
        ? Padding.lg
        : Padding.none
      : Padding[padded];

  const bottomPaddingValue = bottomPadding
    ? TAB_BAR_HEIGHT + BOTTOM_SAFE_PADDING
    : 0;

  const content = (
    <View
      className={`flex-1 ${className}`}
      style={[
        {
          backgroundColor,
          paddingHorizontal: paddingValue,
          paddingTop: paddingValue,
          paddingBottom: bottomPaddingValue,
          maxWidth: UX.content.maxWidth,
          alignSelf: centered ? "center" : "stretch",
          width: centered ? "100%" : undefined,
        },
        style,
      ]}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      {children}
    </View>
  );

  const scrollContent = (
    <ScrollView
      {...scrollViewProps}
      contentContainerStyle={[
        {
          flexGrow: 1,
          paddingHorizontal: paddingValue,
          paddingTop: paddingValue,
          paddingBottom: bottomPaddingValue,
        },
        scrollViewProps?.contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      accessible={false}
    >
      <View
        style={{
          maxWidth: UX.content.maxWidth,
          alignSelf: centered ? "center" : "stretch",
          width: "100%",
        }}
      >
        {children}
      </View>
    </ScrollView>
  );

  if (keyboardAvoiding) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor }}
        edges={["top", "left", "right"]}
        accessible={false}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {scrollable ? scrollContent : content}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor }}
      edges={["top", "left", "right"]}
      accessible={false}
    >
      {scrollable ? scrollContent : content}
    </SafeAreaView>
  );
}
