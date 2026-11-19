import { useEnvironmentalSoftening } from "@/features/calmMode/hooks/useEnvironmentalSoftening";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSettingsStore } from "@/store/useSettingsStore";
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, type PropsWithChildren } from "react";
import { palettes } from "./colors";
import { PaletteContext } from "./usePalette";

export function MelloAppearance({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const preference = useSettingsStore((state) => state.settings.theme);
  const simplified = useSettingsStore((state) => state.settings.simplifiedMode);
  const { shouldReduceDecorativeElements } = useEnvironmentalSoftening();
  const quiet = simplified || shouldReduceDecorativeElements;
  const mode = preference === "system" ? (system === "dark" ? "dark" : "light") : preference;
  const palette = palettes[mode][quiet ? "quiet" : "standard"];
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.melloTheme = mode;
      document.documentElement.style.colorScheme = mode;
    }
  }, [mode]);
  const navigation = useMemo(() => {
    const base = mode === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: palette.background,
        card: palette.card,
        text: palette.textPrimary,
        primary: palette.primary,
        border: palette.border,
        notification: palette.danger,
      },
    };
  }, [mode, palette]);
  return (
    <PaletteContext.Provider value={palette}>
      <ThemeProvider value={navigation}>
        <StatusBar style={mode === "dark" ? "light" : "dark"} />
        {children}
      </ThemeProvider>
    </PaletteContext.Provider>
  );
}
