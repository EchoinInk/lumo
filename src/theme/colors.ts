// Neurodivergent-friendly soft light theme colors
// Designed for reduced visual stress and sensory comfort
// Soft lavender/white theme with gentle pastel accents

export const colors = {
  // Base backgrounds - soft white/lavender tones
  background: "#F7F8FF",
  surface: "#FFFFFF",
  surfaceElevated: "#FAFBFF",
  surfacePressed: "#F0F2FF",

  // Text colors - deep navy for readability on light backgrounds
  text: {
    primary: "#1E2240",
    secondary: "#6B7280",
    muted: "#6F7688",
    inverse: "#FFFFFF",
  },

  // Accent colors - calm blue/pink/purple for gentle emphasis
  accent: {
    primary: "#7352F4",
    soft: "#A78BFA",
    muted: "#C4B5FD",
    pink: "#F472B6",
    pinkSoft: "#F9A8D4",
    blue: "#60A5FA",
    blueSoft: "#93C5FD",
    purple: "#A78BFA",
    purpleSoft: "#C4B5FD",
    lavender: "#E0E7FF",
  },

  // Semantic colors - softened pastels for reduced visual stress
  semantic: {
    success: "#10B981",
    successSoft: "rgba(16, 185, 129, 0.12)",
    warning: "#F59E0B",
    warningSoft: "rgba(245, 158, 11, 0.12)",
    danger: "#D03434",
    dangerSoft: "rgba(239, 68, 68, 0.12)",
    info: "#3B82F6",
    infoSoft: "rgba(59, 130, 246, 0.12)",
  },

  // Border colors - subtle soft borders
  border: "#E5E7EB",
  borderLight: "#F3F4F6",
  borderFocus: "#7352F4",

  // Overlay for modals and sheets - softer on light theme
  overlay: "rgba(30, 34, 64, 0.4)",

  // Gradients - calm, gentle gradients matching mockup
  gradients: {
    accent: ["#7C5CFF", "#A78BFA"] as const,
    pinkPurple: ["#F472B6", "#A78BFA"] as const,
    bluePurple: ["#60A5FA", "#A78BFA"] as const,
    soft: ["#E0E7FF", "#F0F2FF"] as const,
    surface: ["#FFFFFF", "#F7F8FF"] as const,
  },
} as const;

// Legacy export for compatibility
export const Colors = {
  background: colors.background,
  backgroundAlt: colors.surface,
  card: colors.surface,
  cardGlass: "rgba(255, 255, 255, 0.9)",
  primary: colors.accent.primary,
  primarySoft: colors.accent.soft,
  secondary: colors.accent.blue,
  secondarySoft: colors.accent.blueSoft,
  accent: colors.accent.primary,
  textPrimary: colors.text.primary,
  textSecondary: colors.text.secondary,
  textTertiary: colors.text.muted,
  textInverse: colors.text.inverse,
  success: colors.semantic.success,
  successSoft: colors.semantic.successSoft,
  warning: colors.semantic.warning,
  warningSoft: colors.semantic.warningSoft,
  danger: colors.semantic.danger,
  dangerSoft: colors.semantic.dangerSoft,
  info: colors.semantic.info,
  infoSoft: colors.semantic.infoSoft,
  border: colors.border,
  borderLight: colors.borderLight,
  borderDark: colors.border,
  overlay: colors.overlay,
  overlayLight: "rgba(30, 34, 64, 0.2)",
  gradientStart: "#B83280",
  gradientEnd: colors.accent.primary,
  // New gradient variants for UI
  pink: colors.accent.pink,
  pinkSoft: colors.accent.pinkSoft,
  blue: colors.accent.blue,
  blueSoft: colors.accent.blueSoft,
  purple: colors.accent.purple,
  purpleSoft: colors.accent.purpleSoft,
  lavender: colors.accent.lavender,
} as const;

// Dark theme alias (app uses dark theme by default)
export const DarkColors = Colors;

export type ColorKey = keyof typeof Colors;
export type DarkColorKey = ColorKey;
export type ColorsType = typeof colors;
