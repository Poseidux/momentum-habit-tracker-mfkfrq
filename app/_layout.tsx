
import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/contexts/AuthContext";
import { HabitProvider } from "@/contexts/HabitContext";
import { PremiumProvider } from "@/contexts/PremiumContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <AuthProvider>
        <PremiumProvider>
          <HabitProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="add-habit" options={{ presentation: 'modal' }} />
              <Stack.Screen name="edit-habit" options={{ presentation: 'modal' }} />
              <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
            </Stack>
          </HabitProvider>
        </PremiumProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
