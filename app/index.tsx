
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator, useColorScheme } from "react-native";
import { colors } from "@/styles/commonStyles";

export default function Index() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

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
      <View style={{ 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center",
        backgroundColor: theme.background 
      }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return <Redirect href={isOnboarded ? "/(tabs)" : "/onboarding"} />;
}
