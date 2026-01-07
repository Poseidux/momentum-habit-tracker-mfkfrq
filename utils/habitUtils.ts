
import { Habit } from '@/types/habit';

export function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
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

export function isHabitCompletedOnDate(habit: Habit, dateString: string): boolean {
  return habit.completions.includes(dateString);
}

export function toggleHabitCompletion(habit: Habit, dateString: string): Habit {
  const isCompleted = habit.completions.includes(dateString);
  
  if (isCompleted) {
    return {
      ...habit,
      completions: habit.completions.filter(d => d !== dateString),
    };
  } else {
    return {
      ...habit,
      completions: [...habit.completions, dateString],
    };
  }
}

export function calculateStreak(habit: Habit): number {
  if (habit.completions.length === 0) {
    return 0;
  }

  const sortedCompletions = [...habit.completions].sort().reverse();
  const today = new Date();
  let streak = 0;
  let currentDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateString = currentDate.toISOString().split('T')[0];
    
    if (!isHabitScheduledForDate(habit, currentDate)) {
      currentDate.setDate(currentDate.getDate() - 1);
      continue;
    }

    if (sortedCompletions.includes(dateString)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function getWeeklyStats(habits: Habit[]): {
  completedThisWeek: number;
  bestDay: string;
} {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  
  const dayCounts: { [key: string]: number } = {
    'Sunday': 0,
    'Monday': 0,
    'Tuesday': 0,
    'Wednesday': 0,
    'Thursday': 0,
    'Friday': 0,
    'Saturday': 0,
  };
  
  let totalCompleted = 0;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    const dayName = dayNames[date.getDay()];

    habits.forEach(habit => {
      if (isHabitScheduledForDate(habit, date) && habit.completions.includes(dateString)) {
        dayCounts[dayName]++;
        totalCompleted++;
      }
    });
  }

  let bestDay = 'None';
  let maxCount = 0;
  
  Object.entries(dayCounts).forEach(([day, count]) => {
    if (count > maxCount) {
      maxCount = count;
      bestDay = day;
    }
  });

  return {
    completedThisWeek: totalCompleted,
    bestDay: maxCount > 0 ? bestDay : 'None',
  };
}

export function getCompletionPercentage(habits: Habit[], dateString: string): number {
  if (habits.length === 0) {
    return 0;
  }

  const date = new Date(dateString);
  const scheduledHabits = habits.filter(h => isHabitScheduledForDate(h, date));
  
  if (scheduledHabits.length === 0) {
    return 0;
  }

  const completedCount = scheduledHabits.filter(h => 
    h.completions.includes(dateString)
  ).length;

  return Math.round((completedCount / scheduledHabits.length) * 100);
}
