
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, UserSettings } from '@/types/habit';

const HABITS_KEY = '@momentum_habits';
const SETTINGS_KEY = '@momentum_settings';

export const storage = {
  // Habits
  async getHabits(): Promise<Habit[]> {
    try {
      const data = await AsyncStorage.getItem(HABITS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading habits:', error);
      return [];
    }
  },

  async saveHabits(habits: Habit[]): Promise<void> {
    try {
      await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  },

  async addHabit(habit: Habit): Promise<void> {
    const habits = await this.getHabits();
    habits.push(habit);
    await this.saveHabits(habits);
  },

  async updateHabit(updatedHabit: Habit): Promise<void> {
    const habits = await this.getHabits();
    const index = habits.findIndex(h => h.id === updatedHabit.id);
    if (index !== -1) {
      habits[index] = updatedHabit;
      await this.saveHabits(habits);
    }
  },

  async deleteHabit(habitId: string): Promise<void> {
    const habits = await this.getHabits();
    const filtered = habits.filter(h => h.id !== habitId);
    await this.saveHabits(filtered);
  },

  // Settings
  async getSettings(): Promise<UserSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : {
        notificationsEnabled: false,
        darkMode: false,
        hasCompletedOnboarding: false,
      };
    } catch (error) {
      console.error('Error loading settings:', error);
      return {
        notificationsEnabled: false,
        darkMode: false,
        hasCompletedOnboarding: false,
      };
    }
  },

  async saveSettings(settings: UserSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  async resetAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([HABITS_KEY, SETTINGS_KEY]);
    } catch (error) {
      console.error('Error resetting data:', error);
    }
  },
};
