import { Redirect } from "expo-router";

export default function RetiredAddTabRoute() {
  return <Redirect href={{ pathname: "/(tabs)/tasks" as const } as any} />;
}
