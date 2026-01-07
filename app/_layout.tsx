
import React, { useEffect, useState } from 'react';
import { useColorScheme, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { HabitProvider, useHabits } from '@/contexts/HabitContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  const { settings, loading } = useHabits();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    if (!loading) {
      prepare();
    }
  }, [loading]);

  useEffect(() => {
    if (isReady && !loading) {
      if (!settings.hasCompletedOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)/(home)/');
      }
    }
  }, [isReady, loading, settings.hasCompletedOnboarding]);

  if (loading || !isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-habit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-habit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="manage-habits" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="auth-popup" />
        <Stack.Screen name="auth-callback" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <HabitProvider>
            <RootLayoutContent />
          </HabitProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
