import { isLoaded } from "expo-font";

export const brandFonts = {
  MelloBody: require("../../assets/branding/mello/fonts/NotoSans-Regular.ttf"),
  MelloBodyBold: require("../../assets/branding/mello/fonts/NotoSans-Bold.ttf"),
  MelloDisplay: require("../../assets/branding/mello/fonts/NotoSansDisplay-Regular.ttf"),
  MelloDisplayBold: require("../../assets/branding/mello/fonts/NotoSansDisplay-Bold.ttf"),
};

export function brandFont(display: boolean, bold: boolean) {
  const name = display ? (bold ? "MelloDisplayBold" : "MelloDisplay") : (bold ? "MelloBodyBold" : "MelloBody");
  return isLoaded(name) ? { fontFamily: name, fontWeight: "normal" as const } : undefined;
}
