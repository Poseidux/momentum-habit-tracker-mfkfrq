
import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

const SETTINGS_KEY = '@momentum_settings';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        setHasCompletedOnboarding(settings.hasCompletedOnboarding === true);
      }
    } catch (error) {
      console.error('Error checking onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/(tabs)/(home)/" />;
  }

  return <Redirect href="/onboarding" />;
}
