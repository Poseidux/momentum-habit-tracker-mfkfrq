
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, UserSettings } from '@/types/habit';

const HABITS_KEY = '@momentum_habits';
const SETTINGS_KEY = '@momentum_settings';

export async function loadHabits(): Promise<Habit[]> {
  try {
    const data = await AsyncStorage.getItem(HABITS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading habits:', error);
    return [];
  }
}

export async function saveHabits(habits: Habit[]): Promise<void> {
  try {
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  } catch (error) {
    console.error('Error saving habits:', error);
  }
}

export async function loadSettings(): Promise<UserSettings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : {
      notificationsEnabled: false,
      darkMode: 'auto',
      hasCompletedOnboarding: false,
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      notificationsEnabled: false,
      darkMode: 'auto',
      hasCompletedOnboarding: false,
    };
  }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([HABITS_KEY, SETTINGS_KEY]);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}
