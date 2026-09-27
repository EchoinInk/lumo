import { Redirect } from "expo-router";

export default function RetiredExploreRoute() {
  return <Redirect href={{ pathname: "/(tabs)" as const } as any} />;
}
