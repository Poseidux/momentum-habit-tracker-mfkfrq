
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Habit, UserSettings } from '@/types/habit';
import { loadHabits, saveHabits, loadSettings, saveSettings } from '@/utils/storage';
import { scheduleHabitNotification, cancelHabitNotification, rescheduleAllHabitNotifications } from '@/utils/notifications';

interface HabitContextType {
  habits: Habit[];
  settings: UserSettings;
  loading: boolean;
  addHabit: (habit: Omit<Habit, 'id' | 'completions' | 'createdAt'>) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleCompletion: (habitId: string, date: string) => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export function HabitProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    notificationsEnabled: false,
    darkMode: 'auto',
    hasCompletedOnboarding: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [loadedHabits, loadedSettings] = await Promise.all([
      loadHabits(),
      loadSettings(),
    ]);
    
    setHabits(loadedHabits);
    setSettings(loadedSettings);
    setLoading(false);
  }

  async function addHabit(habitData: Omit<Habit, 'id' | 'completions' | 'createdAt'>) {
    const newHabit: Habit = {
      ...habitData,
      id: Date.now().toString(),
      completions: {},
      createdAt: new Date().toISOString(),
    };
    
    const updatedHabits = [...habits, newHabit];
    setHabits(updatedHabits);
    await saveHabits(updatedHabits);
    
    if (settings.notificationsEnabled && newHabit.reminderTime) {
      await scheduleHabitNotification(newHabit);
    }
  }

  async function updateHabit(habit: Habit) {
    const updatedHabits = habits.map(h => h.id === habit.id ? habit : h);
    setHabits(updatedHabits);
    await saveHabits(updatedHabits);
    
    if (settings.notificationsEnabled && habit.reminderTime) {
      await scheduleHabitNotification(habit);
    } else {
      await cancelHabitNotification(habit.id);
    }
  }

  async function deleteHabit(id: string) {
    const updatedHabits = habits.filter(h => h.id !== id);
    setHabits(updatedHabits);
    await saveHabits(updatedHabits);
    await cancelHabitNotification(id);
  }

  async function toggleCompletion(habitId: string, date: string) {
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const completions = { ...habit.completions };
        completions[date] = !completions[date];
        return { ...habit, completions };
      }
      return habit;
    });
    
    setHabits(updatedHabits);
    await saveHabits(updatedHabits);
  }

  async function updateSettings(newSettings: Partial<UserSettings>) {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveSettings(updated);
    
    if (updated.notificationsEnabled) {
      await rescheduleAllHabitNotifications(habits);
    }
  }

  return (
    <HabitContext.Provider
      value={{
        habits,
        settings,
        loading,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleCompletion,
        updateSettings,
      }}
    >
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
