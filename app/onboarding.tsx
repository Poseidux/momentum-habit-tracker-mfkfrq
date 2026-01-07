
import { useHabits } from '@/contexts/HabitContext';
import { colors, habitColors, habitIcons } from '@/styles/commonStyles';
import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
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
import { requestNotificationPermissions } from '@/utils/notifications';
import { Habit } from '@/types/habit';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const STARTER_HABITS = [
  { name: 'Drink Water', icon: '💧', color: habitColors[6] },
  { name: 'Exercise', icon: '💪', color: habitColors[0] },
  { name: 'Read', icon: '📚', color: habitColors[1] },
  { name: 'Meditate', icon: '🧘', color: habitColors[2] },
  { name: 'Journal', icon: '✍️', color: habitColors[3] },
  { name: 'Sleep Early', icon: '😴', color: habitColors[4] },
];

export default function OnboardingScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { addHabit, updateSettings } = useHabits();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedHabits, setSelectedHabits] = useState<number[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const toggleHabit = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedHabits(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleFinish = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Save user name if provided
    if (name.trim()) {
      await updateSettings({ name: name.trim() });
    }

    // Create selected habits
    const timeString = reminderEnabled
      ? `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`
      : undefined;

    for (const index of selectedHabits) {
      const starter = STARTER_HABITS[index];
      const habit: Habit = {
        id: `${Date.now()}-${index}`,
        name: starter.name,
        color: starter.color,
        icon: starter.icon,
        schedule: 'daily',
        reminderTime: timeString,
        completions: [],
        createdAt: new Date().toISOString(),
      };
      await addHabit(habit);
    }

    // Request notification permissions if reminder enabled
    if (reminderEnabled) {
      await requestNotificationPermissions();
      await updateSettings({ notificationsEnabled: true });
    }

    // Mark onboarding as complete
    await updateSettings({ hasCompletedOnboarding: true });

    // Navigate to main app
    router.replace('/(tabs)/(home)/');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                {
                  backgroundColor: s <= step ? theme.primary : theme.border,
                }
              ]}
            />
          ))}
        </View>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <Animated.View entering={FadeIn} style={styles.stepContainer}>
            <Text style={[styles.emoji, { marginBottom: 24 }]}>👋</Text>
            <Text style={[styles.title, { color: theme.text }]}>
              Welcome to Momentum
            </Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              Build better habits, one day at a time. Let's get started by personalizing your experience.
            </Text>

            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.text }]}>
                What's your name? (Optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border,
                  }
                ]}
                placeholder="Enter your name"
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={setName}
                maxLength={30}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setStep(2);
              }}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep(2);
              }}
            >
              <Text style={[styles.skipText, { color: theme.textSecondary }]}>
                Skip
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Step 2: Choose Habits */}
        {step === 2 && (
          <Animated.View entering={FadeIn} style={styles.stepContainer}>
            <Text style={[styles.emoji, { marginBottom: 24 }]}>🎯</Text>
            <Text style={[styles.title, { color: theme.text }]}>
              Choose Your Habits
            </Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              Select up to 3 habits to get started. You can always add more later.
            </Text>

            <View style={styles.habitsGrid}>
              {STARTER_HABITS.map((habit, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(index * 50)}
                >
                  <TouchableOpacity
                    style={[
                      styles.habitCard,
                      {
                        backgroundColor: selectedHabits.includes(index)
                          ? habit.color + '20'
                          : theme.card,
                        borderColor: selectedHabits.includes(index)
                          ? habit.color
                          : theme.border,
                        borderWidth: selectedHabits.includes(index) ? 2 : 1,
                      }
                    ]}
                    onPress={() => toggleHabit(index)}
                    disabled={!selectedHabits.includes(index) && selectedHabits.length >= 3}
                  >
                    <Text style={styles.habitIcon}>{habit.icon}</Text>
                    <Text style={[styles.habitName, { color: theme.text }]}>
                      {habit.name}
                    </Text>
                    {selectedHabits.includes(index) && (
                      <View style={[styles.checkBadge, { backgroundColor: habit.color }]}>
                        <IconSymbol
                          android_material_icon_name="check"
                          ios_icon_name="checkmark"
                          size={16}
                          color="#FFFFFF"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.buttonSecondary,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.card,
                  }
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStep(1);
                }}
              >
                <Text style={[styles.buttonTextSecondary, { color: theme.text }]}>
                  Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.primary, flex: 1 }
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setStep(3);
                }}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Step 3: Reminders */}
        {step === 3 && (
          <Animated.View entering={FadeIn} style={styles.stepContainer}>
            <Text style={[styles.emoji, { marginBottom: 24 }]}>🔔</Text>
            <Text style={[styles.title, { color: theme.text }]}>
              Set a Reminder
            </Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              Get a daily notification to help you stay on track with your habits.
            </Text>

            <View 
              style={[
                styles.reminderCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }
              ]}
            >
              <View style={styles.reminderHeader}>
                <View style={styles.reminderInfo}>
                  <IconSymbol
                    android_material_icon_name="notifications"
                    ios_icon_name="bell"
                    size={24}
                    color={theme.primary}
                  />
                  <Text style={[styles.reminderLabel, { color: theme.text }]}>
                    Daily Reminder
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    reminderEnabled && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setReminderEnabled(!reminderEnabled);
                  }}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      reminderEnabled && styles.toggleThumbActive
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {reminderEnabled && (
                <TouchableOpacity
                  style={[
                    styles.timeButton,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    }
                  ]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <IconSymbol
                    android_material_icon_name="access-time"
                    ios_icon_name="clock"
                    size={20}
                    color={theme.primary}
                  />
                  <Text style={[styles.timeText, { color: theme.text }]}>
                    {reminderTime.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
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
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(Platform.OS === 'ios');
                    if (selectedTime) {
                      setReminderTime(selectedTime);
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.buttonSecondary,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.card,
                  }
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStep(2);
                }}
              >
                <Text style={[styles.buttonTextSecondary, { color: theme.text }]}>
                  Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.primary, flex: 1 }
                ]}
                onPress={handleFinish}
              >
                <Text style={styles.buttonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 48,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepContainer: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  inputSection: {
    width: '100%',
    marginBottom: 32,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 17,
    borderWidth: 1,
  },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
    justifyContent: 'center',
  },
  habitCard: {
    width: 110,
    height: 110,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  habitIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  habitName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reminderLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 17,
    fontWeight: '600',
  },
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 200,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonSecondary: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 1.5,
  },
  buttonTextSecondary: {
    fontSize: 17,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
