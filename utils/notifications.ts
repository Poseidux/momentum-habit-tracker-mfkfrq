
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

  const [hours, minutes] = habit.reminderTime.split(':').map(Number);

  if (habit.schedule === 'daily') {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Momentum Reminder',
        body: `Time to complete: ${habit.name}`,
        data: { habitId: habit.id },
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  } else if (habit.schedule === 'specific' && Array.isArray(habit.scheduledDays)) {
    for (const day of habit.scheduledDays) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Momentum Reminder',
          body: `Time to complete: ${habit.name}`,
          data: { habitId: habit.id },
        },
        trigger: {
          weekday: day + 1, // Expo uses 1-7 (Sun-Sat)
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });
    }
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
