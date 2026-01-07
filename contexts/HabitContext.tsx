
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit } from '@/types/habit';
import { scheduleHabitNotification, cancelHabitNotification } from '@/utils/notifications';

interface HabitContextType {
  habits: Habit[];
  loading: boolean;
  addHabit: (habit: Omit<Habit, 'id' | 'completions' | 'createdAt'>) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleCompletion: (habitId: string, date: string) => Promise<void>;
  refreshHabits: () => Promise<void>;
  updateSettings: (settings: any) => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

const HABITS_KEY = '@momentum_habits';
const SETTINGS_KEY = '@momentum_settings';

export function HabitProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const stored = await AsyncStorage.getItem(HABITS_KEY);
      if (stored) {
        setHabits(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load habits:', error);
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

    if (habitData.reminderTime) {
      await scheduleHabitNotification(newHabit);
    }

    await saveHabits([...habits, newHabit]);
  };

  const updateHabit = async (updatedHabit: Habit) => {
    const updated = habits.map(h => h.id === updatedHabit.id ? updatedHabit : h);
    
    await cancelHabitNotification(updatedHabit.id);
    if (updatedHabit.reminderTime) {
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
    await loadHabits();
  };

  const updateSettings = async (settings: any) => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  return (
    <HabitContext.Provider value={{
      habits,
      loading,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleCompletion,
      refreshHabits,
      updateSettings,
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
