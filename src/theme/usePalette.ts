import { createContext, useContext } from "react";
import { Colors, type Palette } from "./colors";

export const PaletteContext = createContext<Palette>(Colors);
export function usePalette() {
  return useContext(PaletteContext);
}

/** Cache colour-dependent styles and lookup tables once per appearance. */
export function createThemedValue<T>(makeValue: (palette: Palette) => T) {
  const values = new WeakMap<Palette, { value: T }>();
  return function useThemedValue(): T {
    const palette = usePalette();
    let entry = values.get(palette);
    if (!entry) {
      entry = { value: makeValue(palette) };
      values.set(palette, entry);
    }
    return entry.value;
  };
}
