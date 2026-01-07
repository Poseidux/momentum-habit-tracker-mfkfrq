
import "react-native-reanimated";
import React, { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { HabitProvider } from "@/contexts/HabitContext";
import { PremiumProvider } from "@/contexts/PremiumContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const onboarded = await AsyncStorage.getItem("@onboarded");
        setIsOnboarded(onboarded === "true");
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        setIsOnboarded(false);
      }
    }
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (loaded && isOnboarded !== null) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isOnboarded]);

  if (!loaded || isOnboarded === null) {
    return null;
  }

  return (
    <>
      <StatusBar style="auto" />
      <AuthProvider>
        <PremiumProvider>
          <HabitProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="add-habit" options={{ presentation: "modal" }} />
                <Stack.Screen name="edit-habit" options={{ presentation: "modal" }} />
                <Stack.Screen name="manage-habits" options={{ presentation: "modal" }} />
                <Stack.Screen name="auth" options={{ presentation: "modal" }} />
              </Stack>
            </GestureHandlerRootView>
          </HabitProvider>
        </PremiumProvider>
      </AuthProvider>
    </>
  );
}
