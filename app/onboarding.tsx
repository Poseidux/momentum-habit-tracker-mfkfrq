
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, habitColors, habitIcons } from '@/styles/commonStyles';
import { useHabits } from '@/contexts/HabitContext';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { requestNotificationPermissions } from '@/utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STARTER_HABITS = [
  { name: 'Morning Exercise', icon: '🏃', color: habitColors[0] },
  { name: 'Drink Water', icon: '💧', color: habitColors[6] },
  { name: 'Read 10 Pages', icon: '📚', color: habitColors[7] },
  { name: 'Meditate', icon: '🧘', color: habitColors[1] },
  { name: 'Healthy Meal', icon: '🥗', color: habitColors[4] },
  { name: 'Sleep Early', icon: '😴', color: habitColors[2] },
];

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;
  const { addHabit, updateSettings } = useHabits();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedHabits, setSelectedHabits] = useState<number[]>([]);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [enableReminders, setEnableReminders] = useState(false);

  function toggleHabit(index: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (selectedHabits.includes(index)) {
      setSelectedHabits(selectedHabits.filter(i => i !== index));
    } else {
      if (selectedHabits.length < 3) {
        setSelectedHabits([...selectedHabits, index]);
      }
    }
  }

  async function handleFinish() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Save user name if provided
    if (name.trim()) {
      await updateSettings({ userName: name.trim() });
    }

    // Request notification permissions if enabled
    if (enableReminders) {
      const granted = await requestNotificationPermissions();
      await updateSettings({ notificationsEnabled: granted });
    }

    // Add selected starter habits
    const timeStr = enableReminders 
      ? `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`
      : undefined;

    for (const index of selectedHabits) {
      const habit = STARTER_HABITS[index];
      await addHabit({
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        schedule: 'daily',
        reminderTime: timeStr,
      });
    }

    // Mark onboarding as complete
    await updateSettings({ hasCompletedOnboarding: true });
    await AsyncStorage.setItem('@onboarded', 'true');

    // Navigate to main app
    router.replace('/(tabs)');
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Indicator */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: theme.primary,
                    width: `${(step / 3) * 100}%`,
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              Step {step} of 3
            </Text>
          </Animated.View>

          {/* Step 1: Welcome & Name */}
          {step === 1 && (
            <Animated.View entering={FadeInDown.duration(600)} style={styles.stepContainer}>
              <Text style={[styles.emoji, { marginBottom: 24 }]}>👋</Text>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                Welcome to Momentum
              </Text>
              <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
                Build better habits, one day at a time. Let&apos;s get started!
              </Text>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  What&apos;s your name? (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setStep(2);
                }}
                style={[styles.button, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Step 2: Select Starter Habits */}
          {step === 2 && (
            <Animated.View entering={FadeInDown.duration(600)} style={styles.stepContainer}>
              <Text style={[styles.emoji, { marginBottom: 24 }]}>🎯</Text>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                Choose Your Habits
              </Text>
              <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
                Select up to 3 habits to get started. You can add more later!
              </Text>

              <View style={styles.habitsGrid}>
                {STARTER_HABITS.map((habit, index) => {
                  const isSelected = selectedHabits.includes(index);
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => toggleHabit(index)}
                      style={[
                        styles.habitOption,
                        {
                          backgroundColor: isSelected ? habit.color + '20' : theme.surface,
                          borderColor: isSelected ? habit.color : theme.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                    >
                      <Text style={styles.habitOptionIcon}>{habit.icon}</Text>
                      <Text style={[styles.habitOptionName, { color: theme.text }]}>
                        {habit.name}
                      </Text>
                      {isSelected && (
                        <View style={[styles.checkmark, { backgroundColor: habit.color }]}>
                          <IconSymbol
                            ios_icon_name="checkmark"
                            android_material_icon_name="check"
                            size={16}
                            color="#FFFFFF"
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setStep(1);
                  }}
                  style={[styles.buttonSecondary, { borderColor: theme.border }]}
                >
                  <Text style={[styles.buttonSecondaryText, { color: theme.text }]}>
                    Back
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setStep(3);
                  }}
                  style={[styles.button, { backgroundColor: theme.primary, flex: 1 }]}
                >
                  <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Step 3: Reminders */}
          {step === 3 && (
            <Animated.View entering={FadeInDown.duration(600)} style={styles.stepContainer}>
              <Text style={[styles.emoji, { marginBottom: 24 }]}>⏰</Text>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                Set Reminders
              </Text>
              <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
                Get daily reminders to stay on track with your habits.
              </Text>

              <View style={styles.reminderOptions}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setEnableReminders(true);
                    setShowTimePicker(true);
                  }}
                  style={[
                    styles.reminderOption,
                    {
                      backgroundColor: enableReminders ? theme.primary + '20' : theme.surface,
                      borderColor: enableReminders ? theme.primary : theme.border,
                      borderWidth: enableReminders ? 2 : 1,
                    },
                  ]}
                >
                  <IconSymbol
                    ios_icon_name="bell.fill"
                    android_material_icon_name="notifications"
                    size={32}
                    color={enableReminders ? theme.primary : theme.text}
                  />
                  <Text style={[styles.reminderOptionTitle, { color: theme.text }]}>
                    Enable Reminders
                  </Text>
                  {enableReminders && (
                    <Text style={[styles.reminderTime, { color: theme.primary }]}>
                      {reminderTime.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setEnableReminders(false);
                  }}
                  style={[
                    styles.reminderOption,
                    {
                      backgroundColor: !enableReminders ? theme.primary + '20' : theme.surface,
                      borderColor: !enableReminders ? theme.primary : theme.border,
                      borderWidth: !enableReminders ? 2 : 1,
                    },
                  ]}
                >
                  <IconSymbol
                    ios_icon_name="bell.slash"
                    android_material_icon_name="notifications-off"
                    size={32}
                    color={!enableReminders ? theme.primary : theme.text}
                  />
                  <Text style={[styles.reminderOptionTitle, { color: theme.text }]}>
                    Skip for Now
                  </Text>
                </TouchableOpacity>
              </View>

              {showTimePicker && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={reminderTime}
                  mode="time"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    setShowTimePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setReminderTime(selectedDate);
                    }
                  }}
                />
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setStep(2);
                  }}
                  style={[styles.buttonSecondary, { borderColor: theme.border }]}
                >
                  <Text style={[styles.buttonSecondaryText, { color: theme.text }]}>
                    Back
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleFinish}
                  style={[styles.button, { backgroundColor: theme.primary, flex: 1 }]}
                >
                  <Text style={styles.buttonText}>Get Started</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
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
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  progressContainer: {
    marginBottom: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  habitOption: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    position: 'relative',
  },
  habitOptionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  habitOptionName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderOptions: {
    gap: 16,
    marginBottom: 32,
  },
  reminderOption: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  reminderOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  reminderTime: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  button: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonSecondary: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 24,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
