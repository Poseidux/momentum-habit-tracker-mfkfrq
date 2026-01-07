
export interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  schedule: 'daily' | 'specific';
  scheduledDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
  reminderTime?: string; // HH:MM format
  completions: string[]; // Array of date strings (YYYY-MM-DD)
  createdAt: string;
}

export interface HabitCompletion {
  habitId: string;
  date: string;
}

export interface UserSettings {
  name?: string;
  notificationsEnabled: boolean;
  darkMode: boolean;
  hasCompletedOnboarding: boolean;
}
