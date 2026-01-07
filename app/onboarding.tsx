
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, habitColors, habitIcons } from '@/styles/commonStyles';
import { useHabits } from '@/contexts/HabitContext';
import { Habit } from '@/types/habit';
import { requestNotificationPermissions } from '@/utils/notifications';

const STARTER_HABITS = [
  { name: 'Exercise', icon: '💪', color: habitColors[0] },
  { name: 'Meditate', icon: '🧘', color: habitColors[1] },
  { name: 'Read', icon: '📚', color: habitColors[2] },
  { name: 'Drink Water', icon: '💧', color: habitColors[3] },
  { name: 'Journal', icon: '✍️', color: habitColors[4] },
  { name: 'Sleep Early', icon: '😴', color: habitColors[5] },
];

export default function OnboardingScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  const { addHabit, updateSettings } = useHabits();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedHabits, setSelectedHabits] = useState<Set<number>>(new Set());
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [enableReminder, setEnableReminder] = useState(false);

  const toggleHabit = (index: number) => {
    const newSelected = new Set(selectedHabits);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      if (newSelected.size < 3) {
        newSelected.add(index);
      }
    }
    setSelectedHabits(newSelected);
  };

  const handleFinish = async () => {
    // Save selected habits
    const habitsToAdd: Habit[] = Array.from(selectedHabits).map(index => {
      const template = STARTER_HABITS[index];
      return {
        id: `habit-${Date.now()}-${index}`,
        name: template.name,
        color: template.color,
        icon: template.icon,
        schedule: 'daily' as const,
        completions: [],
        createdAt: new Date().toISOString(),
        reminderTime: enableReminder
          ? `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`
          : undefined,
      };
    });

    for (const habit of habitsToAdd) {
      await addHabit(habit);
    }

    // Request notification permissions if reminder is enabled
    let notificationsEnabled = false;
    if (enableReminder) {
      notificationsEnabled = await requestNotificationPermissions();
    }

    // Update settings
    await updateSettings({
      name: name || undefined,
      hasCompletedOnboarding: true,
      notificationsEnabled,
    });

    // Navigate to main app
    router.replace('/(tabs)/(home)/');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Name */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Welcome to Momentum</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              What should we call you?
            </Text>
            
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Your name (optional)"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={() => setStep(2)}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => setStep(2)}
              >
                <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 2: Select Habits */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Choose Your Habits</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Pick up to 3 habits to get started
            </Text>

            <View style={styles.habitsGrid}>
              {STARTER_HABITS.map((habit, index) => {
                const isSelected = selectedHabits.has(index);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.habitCard,
                      {
                        backgroundColor: isSelected ? habit.color : theme.card,
                        borderColor: isSelected ? habit.color : theme.border,
                      },
                    ]}
                    onPress={() => toggleHabit(index)}
                  >
                    <Text style={styles.habitIcon}>{habit.icon}</Text>
                    <Text
                      style={[
                        styles.habitName,
                        { color: isSelected ? '#FFFFFF' : theme.text },
                      ]}
                    >
                      {habit.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={() => setStep(3)}
                disabled={selectedHabits.size === 0}
              >
                <Text style={styles.buttonText}>
                  Continue ({selectedHabits.size}/3)
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => setStep(3)}
              >
                <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Reminder */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Set a Reminder</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Get a daily reminder to complete your habits
            </Text>

            <TouchableOpacity
              style={[
                styles.reminderToggle,
                {
                  backgroundColor: enableReminder ? theme.primary : theme.card,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setEnableReminder(!enableReminder)}
            >
              <Text
                style={[
                  styles.reminderText,
                  { color: enableReminder ? '#FFFFFF' : theme.text },
                ]}
              >
                {enableReminder ? '✓ Reminder Enabled' : 'Enable Reminder'}
              </Text>
            </TouchableOpacity>

            {enableReminder && (
              <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={[styles.timeText, { color: theme.text }]}>
                  {reminderTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
              </TouchableOpacity>
            )}

            {showTimePicker && (
              <DateTimePicker
                value={reminderTime}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={(event, selectedDate) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setReminderTime(selectedDate);
                  }
                }}
              />
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={handleFinish}
              >
                <Text style={styles.buttonText}>Get Started</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleFinish}
              >
                <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 17,
    marginBottom: 32,
  },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  habitCard: {
    width: '47%',
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  habitIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  reminderToggle: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  reminderText: {
    fontSize: 17,
    fontWeight: '600',
  },
  timeButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 32,
  },
  timeText: {
    fontSize: 24,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
  },
});
