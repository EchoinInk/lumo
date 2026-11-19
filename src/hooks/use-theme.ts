import { themeColors } from "@/constants/theme";
import { usePalette } from "@/theme/usePalette";

export function useTheme() {
  const palette = usePalette();
  return { ...themeColors(palette), isDark: palette.mode === "dark" };
}
