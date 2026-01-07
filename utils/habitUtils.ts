
import { Habit } from '@/types/habit';

export function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function isHabitScheduledForDate(habit: Habit, date: Date): boolean {
  if (habit.schedule === 'daily') {
    return true;
  }
  
  if (habit.schedule === 'specific' && habit.scheduledDays) {
    const dayOfWeek = date.getDay();
    return habit.scheduledDays.includes(dayOfWeek);
  }
  
  return false;
}

export function toggleHabitCompletion(habit: Habit, date: string): Habit {
  const completions = { ...habit.completions };
  completions[date] = !completions[date];
  
  return { ...habit, completions };
}

export function calculateStreak(habit: Habit): number {
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    
    if (!isHabitScheduledForDate(habit, checkDate)) {
      continue;
    }
    
    const dateStr = getDateString(checkDate);
    
    if (habit.completions[dateStr]) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

export function getWeeklyStats(habits: Habit[]): { completed: number; total: number } {
  const today = new Date();
  let completed = 0;
  let total = 0;
  
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = getDateString(checkDate);
    
    habits.forEach(habit => {
      if (isHabitScheduledForDate(habit, checkDate)) {
        total++;
        if (habit.completions[dateStr]) {
          completed++;
        }
      }
    });
  }
  
  return { completed, total };
}

export function getCompletionPercentage(habit: Habit, days: number = 30): number {
  const today = new Date();
  let completed = 0;
  let scheduled = 0;
  
  for (let i = 0; i < days; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    
    if (isHabitScheduledForDate(habit, checkDate)) {
      scheduled++;
      const dateStr = getDateString(checkDate);
      if (habit.completions[dateStr]) {
        completed++;
      }
    }
  }
  
  return scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
}
