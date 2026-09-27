import { Redirect } from "expo-router";

export default function RetiredWeeklyDashboardRoute() {
  return <Redirect href={{ pathname: "/(tabs)" as const } as any} />;
}
