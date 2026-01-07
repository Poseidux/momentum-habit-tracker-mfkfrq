
export interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  schedule: 'daily' | 'specific';
  scheduledDays?: number[]; // Array of day numbers (0=Sun, 6=Sat) for specific schedule
  reminderTime?: string; // HH:MM format
  completions: string[]; // Array of date strings (YYYY-MM-DD)
  createdAt: string;
  customIconUri?: string; // For premium users
}
