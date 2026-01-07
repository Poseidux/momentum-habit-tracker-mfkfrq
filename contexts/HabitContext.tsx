
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit } from '@/types/habit';
import { scheduleHabitNotification, cancelHabitNotification } from '@/utils/notifications';

interface Settings {
  notificationsEnabled: boolean;
}

interface HabitContextType {
  habits: Habit[];
  loading: boolean;
  settings: Settings;
  addHabit: (habit: Omit<Habit, 'id' | 'completions' | 'createdAt'>) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleCompletion: (habitId: string, date: string) => Promise<void>;
  refreshHabits: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  resetAll: () => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

const HABITS_KEY = '@momentum_habits';
const SETTINGS_KEY = '@momentum_settings';

export function HabitProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [settings, setSettings] = useState<Settings>({ notificationsEnabled: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storedHabits, storedSettings] = await Promise.all([
        AsyncStorage.getItem(HABITS_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
      ]);
      
      if (storedHabits) {
        setHabits(JSON.parse(storedHabits));
      }
      
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveHabits = async (newHabits: Habit[]) => {
    try {
      await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(newHabits));
      setHabits(newHabits);
    } catch (error) {
      console.error('Failed to save habits:', error);
    }
  };

  const addHabit = async (habitData: Omit<Habit, 'id' | 'completions' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: Date.now().toString(),
      completions: [],
      createdAt: new Date().toISOString(),
    };

    if (habitData.reminderTime && settings.notificationsEnabled) {
      await scheduleHabitNotification(newHabit);
    }

    await saveHabits([...habits, newHabit]);
  };

  const updateHabit = async (updatedHabit: Habit) => {
    const updated = habits.map(h => h.id === updatedHabit.id ? updatedHabit : h);
    
    await cancelHabitNotification(updatedHabit.id);
    if (updatedHabit.reminderTime && settings.notificationsEnabled) {
      await scheduleHabitNotification(updatedHabit);
    }

    await saveHabits(updated);
  };

  const deleteHabit = async (id: string) => {
    await cancelHabitNotification(id);
    await saveHabits(habits.filter(h => h.id !== id));
  };

  const toggleCompletion = async (habitId: string, date: string) => {
    const updated = habits.map(habit => {
      if (habit.id === habitId) {
        const completions = habit.completions.includes(date)
          ? habit.completions.filter(d => d !== date)
          : [...habit.completions, date];
        return { ...habit, completions };
      }
      return habit;
    });
    await saveHabits(updated);
  };

  const refreshHabits = async () => {
    await loadData();
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      setSettings(updated);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const resetAll = async () => {
    try {
      // Cancel all notifications
      for (const habit of habits) {
        await cancelHabitNotification(habit.id);
      }
      
      // Clear storage
      await AsyncStorage.multiRemove([HABITS_KEY, SETTINGS_KEY]);
      
      // Reset state
      setHabits([]);
      setSettings({ notificationsEnabled: false });
    } catch (error) {
      console.error('Failed to reset data:', error);
    }
  };

  return (
    <HabitContext.Provider value={{
      habits,
      loading,
      settings,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleCompletion,
      refreshHabits,
      updateSettings,
      resetAll,
    }}>
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits() {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within HabitProvider');
  }
  return context;
}
