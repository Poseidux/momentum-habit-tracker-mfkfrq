
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const onboarded = await AsyncStorage.getItem("@onboarded");
        setIsOnboarded(onboarded === "true");
      } catch (error) {
        console.error("Error checking onboarding:", error);
        setIsOnboarded(false);
      }
    }
    checkOnboarding();
  }, []);

  if (isOnboarded === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={isOnboarded ? "/(tabs)" : "/onboarding"} />;
}
