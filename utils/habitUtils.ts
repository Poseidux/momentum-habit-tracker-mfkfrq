
import { Habit } from '@/types/habit';

export function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export function isHabitScheduledForDate(habit: Habit, date: Date | string): boolean {
  if (habit.schedule === 'daily') return true;
  
  const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const dayOfWeek = dateObj.getDay();
  return Array.isArray(habit.scheduledDays) && habit.scheduledDays.includes(dayOfWeek);
}

export function toggleHabitCompletion(habit: Habit, dateString: string): Habit {
  const completions = habit.completions.includes(dateString)
    ? habit.completions.filter(d => d !== dateString)
    : [...habit.completions, dateString];
  
  return { ...habit, completions };
}

export function calculateStreak(habit: Habit): number {
  if (habit.completions.length === 0) return 0;

  const sorted = [...habit.completions].sort().reverse();
  const today = getTodayString();
  let streak = 0;
  let currentDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    if (!isHabitScheduledForDate(habit, dateStr)) {
      currentDate.setDate(currentDate.getDate() - 1);
      continue;
    }

    if (sorted.includes(dateStr)) {
      streak++;
    } else {
      break;
    }

    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

export function getWeeklyStats(habits: Habit[]) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  let totalCompleted = 0;
  let totalScheduled = 0;
  const dailyCompletions: { [key: string]: number } = {};

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    dailyCompletions[dateStr] = 0;

    habits.forEach(habit => {
      if (isHabitScheduledForDate(habit, dateStr)) {
        totalScheduled++;
        if (habit.completions.includes(dateStr)) {
          totalCompleted++;
          dailyCompletions[dateStr]++;
        }
      }
    });
  }

  // Find best day
  let bestDay = 'None';
  let maxCompletions = 0;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  Object.entries(dailyCompletions).forEach(([dateStr, count]) => {
    if (count > maxCompletions) {
      maxCompletions = count;
      const date = new Date(dateStr + 'T00:00:00');
      bestDay = dayNames[date.getDay()];
    }
  });

  const weeklyCompletionRate = totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0;

  return { 
    completedThisWeek: totalCompleted, 
    totalScheduled,
    bestDay,
    weeklyCompletionRate
  };
}

export function getCompletionPercentage(habits: Habit[], dateString: string): number {
  let completed = 0;
  let scheduled = 0;

  habits.forEach(habit => {
    if (isHabitScheduledForDate(habit, dateString)) {
      scheduled++;
      if (habit.completions.includes(dateString)) {
        completed++;
      }
    }
  });

  return scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
}
