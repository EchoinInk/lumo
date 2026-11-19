import { usePalette } from "@/theme/usePalette";
import { Spacing } from "@/src/theme/tokens";
import { Tabs } from "expo-router";
import {
    Calendar,
    HeartPulse,
    Home,
    ListTodo,
    Menu,
} from "lucide-react-native";
import { Platform } from "react-native";

export default function TabLayout() {
  const palette = usePalette();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Soft, calm color scheme
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textTertiary,
        // Clean label styling
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          letterSpacing: 0.3,
        },
        // Premium soft tab bar styling
        tabBarStyle: {
          backgroundColor: palette.background,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          // Gentle height for comfortable touch targets
          height: Platform.OS === "ios" ? 88 : 72,
          paddingHorizontal: Spacing.lg,
          paddingBottom: Platform.OS === "ios" ? 28 : 12,
          paddingTop: Spacing.sm,
        },
        // Remove tab bar border for seamless look
        tabBarItemStyle: {
          paddingVertical: Spacing.xs,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarAccessibilityLabel: "Dashboard tab",
          tabBarIcon: ({ color, size, focused }) => (
            <Home
              size={focused ? 26 : 24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarAccessibilityLabel: "Tasks tab",
          tabBarIcon: ({ color, size, focused }) => (
            <ListTodo
              size={focused ? 26 : 24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarAccessibilityLabel: "Calendar tab",
          tabBarIcon: ({ color, size, focused }) => (
            <Calendar
              size={focused ? 26 : 24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="health"
        options={{
          title: "Health",
          tabBarAccessibilityLabel: "Health tab",
          tabBarIcon: ({ color, size, focused }) => (
            <HeartPulse
              size={focused ? 26 : 24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarAccessibilityLabel: "More tab",
          tabBarIcon: ({ color, size, focused }) => (
            <Menu
              size={focused ? 26 : 24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      <Tabs.Screen name="dashboard" options={{ href: null }} />
      <Tabs.Screen name="add" options={{ href: null }} />
    </Tabs>
  );
}
