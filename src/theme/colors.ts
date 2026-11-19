import tokens from "./mello-tokens.json";

export type AppearanceMode = keyof typeof tokens.themes;

function makePalette(mode: AppearanceMode, quiet = false) {
  const t = tokens.themes[mode];
  const dark = mode === "dark";
  const panel = quiet ? t.surface : t["task-panel"];
  return {
    mode, quiet,
    background: t.surface, backgroundAlt: panel, card: t.surface, cardGlass: panel,
    primary: t.action, primarySoft: t["selected-fill"], secondary: t["selected-fill"],
    secondarySoft: panel, accent: t.action,
    textPrimary: t.text, textSecondary: t["text-secondary"], textTertiary: t["text-secondary"],
    textInverse: t["on-action"], border: t.separator, borderLight: panel,
    borderDark: t["control-outline"], controlOutline: t["control-outline"], focus: t.focus,
    taskPanel: panel, resetPanel: quiet ? t.surface : t["reset-panel"],
    selectedFill: quiet ? t.surface : t["selected-fill"], selectedText: t["selected-text"], selectedEdge: t["selected-edge"],
    success: dark ? "#A9D9BC" : "#38634A", successSoft: dark ? "#304139" : "#E7F0EA",
    warning: dark ? "#E9C598" : "#775621", warningSoft: dark ? "#443B31" : "#F7EEDC",
    danger: dark ? "#F2ADB9" : "#953B50", dangerSoft: dark ? "#4C303F" : "#F8E7EB",
    info: t.action, infoSoft: panel, overlay: "rgba(38,35,52,0.58)", overlayLight: "rgba(38,35,52,0.20)",
    gradientStart: t.action, gradientEnd: t.action,
    pink: dark ? tokens.gradient.onPlum[0] : tokens.gradient.onPorcelain[0],
    pinkSoft: quiet ? t.surface : t["reset-panel"], blue: t.action, blueSoft: panel,
    purple: dark ? tokens.gradient.onPlum[1] : tokens.gradient.onPorcelain[1],
    purpleSoft: panel, lavender: quiet ? t.surface : t["selected-fill"],
  };
}

export const Colors = makePalette("light");
export const DarkColors = makePalette("dark");
export const palettes = {
  light: { standard: Colors, quiet: makePalette("light", true) },
  dark: { standard: DarkColors, quiet: makePalette("dark", true) },
};

export type Palette = typeof Colors;
export type ColorKey = Exclude<keyof Palette, "mode" | "quiet">;
export type DarkColorKey = ColorKey;

// Original non-reactive light-mode export for non-UI callers.
export const colors = {
  background: Colors.background, surface: Colors.card, surfaceElevated: Colors.taskPanel, surfacePressed: Colors.selectedFill,
  text: { primary: Colors.textPrimary, secondary: Colors.textSecondary, muted: Colors.textTertiary, inverse: Colors.textInverse },
  accent: { primary: Colors.primary, soft: Colors.primarySoft, muted: Colors.lavender, pink: Colors.pink, pinkSoft: Colors.pinkSoft,
    blue: Colors.blue, blueSoft: Colors.blueSoft, purple: Colors.purple, purpleSoft: Colors.purpleSoft, lavender: Colors.lavender },
  semantic: { success: Colors.success, successSoft: Colors.successSoft, warning: Colors.warning, warningSoft: Colors.warningSoft,
    danger: Colors.danger, dangerSoft: Colors.dangerSoft, info: Colors.info, infoSoft: Colors.infoSoft },
  border: Colors.border, borderLight: Colors.borderLight, borderFocus: Colors.focus, overlay: Colors.overlay,
  gradients: { accent: [Colors.gradientStart, Colors.gradientEnd], pinkPurple: [Colors.pink, Colors.purple],
    bluePurple: [Colors.blue, Colors.purple], soft: [Colors.taskPanel, Colors.background], surface: [Colors.card, Colors.background] },
} as const;
export type ColorsType = typeof colors;
