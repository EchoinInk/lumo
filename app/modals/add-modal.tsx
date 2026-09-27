import { Redirect } from "expo-router";

export default function RetiredAddModalRoute() {
  return <Redirect href={{ pathname: "/(tabs)/tasks" as const } as any} />;
}
