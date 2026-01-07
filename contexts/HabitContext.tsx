
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Habit, UserSettings } from '@/types/habit';
import { storage } from '@/utils/storage';
import { scheduleHabitNotification, cancelHabitNotification } from '@/utils/notifications';

interface HabitContextType {
  habits: Habit[];
  settings: UserSettings;
  loading: boolean;
  addHabit: (habit: Habit) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  resetAllData: () => Promise<void>;
  refreshHabits: () => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export function HabitProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    notificationsEnabled: false,
    darkMode: false,
    hasCompletedOnboarding: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [loadedHabits, loadedSettings] = await Promise.all([
        storage.getHabits(),
        storage.getSettings(),
      ]);
      setHabits(loadedHabits);
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addHabit(habit: Habit) {
    await storage.addHabit(habit);
    setHabits(prev => [...prev, habit]);
    
    if (settings.notificationsEnabled && habit.reminderTime) {
      await scheduleHabitNotification(habit);
    }
  }

  async function updateHabit(habit: Habit) {
    await storage.updateHabit(habit);
    setHabits(prev => prev.map(h => h.id === habit.id ? habit : h));
    
    if (settings.notificationsEnabled && habit.reminderTime) {
      await scheduleHabitNotification(habit);
    } else {
      await cancelHabitNotification(habit.id);
    }
  }

  async function deleteHabit(habitId: string) {
    await storage.deleteHabit(habitId);
    setHabits(prev => prev.filter(h => h.id !== habitId));
    await cancelHabitNotification(habitId);
  }

  async function updateSettings(newSettings: Partial<UserSettings>) {
    const updated = { ...settings, ...newSettings };
    await storage.saveSettings(updated);
    setSettings(updated);
  }

  async function resetAllData() {
    await storage.resetAllData();
    setHabits([]);
    setSettings({
      notificationsEnabled: false,
      darkMode: false,
      hasCompletedOnboarding: false,
    });
  }

  async function refreshHabits() {
    const loadedHabits = await storage.getHabits();
    setHabits(loadedHabits);
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
        updateSettings,
        resetAllData,
        refreshHabits,
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
