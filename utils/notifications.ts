
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Habit } from '@/types/habit';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

export async function scheduleHabitNotification(habit: Habit): Promise<void> {
  if (!habit.reminderTime) return;
  
  await cancelHabitNotification(habit.id);
  
  const [hours, minutes] = habit.reminderTime.split(':').map(Number);
  
  const trigger: any = {
    hour: hours,
    minute: minutes,
    repeats: true,
  };
  
  if (habit.schedule === 'specific' && habit.scheduledDays) {
    // Schedule for specific days
    for (const day of habit.scheduledDays) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Time for your habit!',
          body: habit.name,
          data: { habitId: habit.id },
        },
        trigger: {
          ...trigger,
          weekday: day + 1, // iOS uses 1-7 for Sun-Sat
        },
      });
    }
  } else {
    // Daily notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Time for your habit!',
        body: habit.name,
        data: { habitId: habit.id },
      },
      trigger,
    });
  }
}

export async function cancelHabitNotification(habitId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  
  for (const notification of scheduled) {
    if (notification.content.data?.habitId === habitId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

export async function cancelAllHabitNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function rescheduleAllHabitNotifications(habits: Habit[]): Promise<void> {
  await cancelAllHabitNotifications();
  
  for (const habit of habits) {
    if (habit.reminderTime) {
      await scheduleHabitNotification(habit);
    }
  }
}
