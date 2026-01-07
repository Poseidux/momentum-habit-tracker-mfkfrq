
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Habit } from '@/types/habit';

// Set notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('habit-reminders', {
        name: 'Habit Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
      });
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

export async function scheduleHabitNotification(habit: Habit): Promise<void> {
  if (!habit.reminderTime) {
    return;
  }

  try {
    // Cancel existing notifications for this habit
    await cancelHabitNotification(habit.id);

    const [hours, minutes] = habit.reminderTime.split(':').map(Number);
    
    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
      repeats: true,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Momentum Reminder',
        body: `Time to complete: ${habit.name} ${habit.icon}`,
        data: { habitId: habit.id },
      },
      trigger,
      identifier: `habit-${habit.id}`,
    });

    console.log(`Scheduled notification for habit: ${habit.name} at ${habit.reminderTime}`);
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

export async function cancelHabitNotification(habitId: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const habitNotifications = scheduled.filter(n => n.identifier === `habit-${habitId}`);
    
    for (const notification of habitNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

export async function cancelAllHabitNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}
