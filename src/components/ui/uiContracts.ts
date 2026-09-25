import type {
  AccessibilityState,
  AccessibilityValue,
  StyleProp,
  ViewStyle,
} from "react-native";

export const MINIMUM_INTERACTIVE_TARGET = 44;

export function composeStyles(
  baseStyle: StyleProp<ViewStyle>,
  callerStyle?: StyleProp<ViewStyle>,
  requiredStyle?: StyleProp<ViewStyle>,
): StyleProp<ViewStyle> {
  return [baseStyle, callerStyle, requiredStyle];
}

export function mergeAccessibilityState(
  callerState: AccessibilityState | undefined,
  requiredState: AccessibilityState,
): AccessibilityState {
  return { ...callerState, ...requiredState };
}

export function getProgressAccessibilityValue(
  progress: number,
  callerValue?: AccessibilityValue,
): AccessibilityValue {
  const now = Math.round(Math.min(Math.max(progress, 0), 100));

  return {
    ...callerValue,
    min: 0,
    max: 100,
    now,
    text: callerValue?.text ?? `${now}%`,
  };
}

export const interactiveTargetStyle: ViewStyle = {
  minWidth: MINIMUM_INTERACTIVE_TARGET,
  minHeight: MINIMUM_INTERACTIVE_TARGET,
};

function relativeLuminance(hex: string): number {
  const channels = hex
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((channel) => parseInt(channel, 16) / 255);

  if (!channels || channels.length !== 3) {
    throw new Error(`Expected a six-digit hex color, received ${hex}`);
  }

  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4),
  );

  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

export function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}
