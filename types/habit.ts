
export interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  schedule: 'daily' | 'specific';
  scheduledDays?: number[]; // 0-6 for Sun-Sat
  reminderTime?: string; // HH:MM format
  completions: { [date: string]: boolean }; // date in YYYY-MM-DD format
  createdAt: string;
  customIconUri?: string;
}

export interface UserSettings {
  notificationsEnabled: boolean;
  darkMode: 'auto' | 'light' | 'dark';
  userName?: string;
  hasCompletedOnboarding: boolean;
}
