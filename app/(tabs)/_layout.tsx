
import { Tabs } from "expo-router";
import { useColorScheme, Platform } from "react-native";
import { colors } from "@/styles/commonStyles";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? colors.dark : colors.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 28 : 12,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="today" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: "Social",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
