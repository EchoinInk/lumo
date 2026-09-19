export type AuthCallbackIntent = "recovery" | "confirmation";

/** Reads only the callback type; credentials are intentionally never returned. */
export function getAuthCallbackIntent(url: string): AuthCallbackIntent {
  const query = url.includes("#")
    ? url.slice(url.indexOf("#") + 1)
    : url.includes("?")
      ? url.slice(url.indexOf("?") + 1)
      : "";
  return new URLSearchParams(query).get("type") === "recovery"
    ? "recovery"
    : "confirmation";
}
