
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { colors, habitColors, habitIcons } from '@/styles/commonStyles';
import { useHabits } from '@/contexts/HabitContext';
import { Habit } from '@/types/habit';

const DAYS_OF_WEEK = [
  { label: 'Mon', value: 1, name: 'Monday' },
  { label: 'Tue', value: 2, name: 'Tuesday' },
  { label: 'Wed', value: 3, name: 'Wednesday' },
  { label: 'Thu', value: 4, name: 'Thursday' },
  { label: 'Fri', value: 5, name: 'Friday' },
  { label: 'Sat', value: 6, name: 'Saturday' },
  { label: 'Sun', value: 0, name: 'Sunday' },
];

export default function EditHabitScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  const { id } = useLocalSearchParams<{ id: string }>();
  const { habits, updateHabit, deleteHabit } = useHabits();

  const habit = habits.find(h => h.id === id);

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(habitColors[0]);
  const [selectedIcon, setSelectedIcon] = useState(habitIcons[0]);
  const [schedule, setSchedule] = useState<'daily' | 'specific'>('daily');
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5, 6]));
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setSelectedColor(habit.color);
      setSelectedIcon(habit.icon);
      setSchedule(habit.schedule);
      setSelectedDays(new Set(habit.scheduledDays || [0, 1, 2, 3, 4, 5, 6]));
      setHasReminder(!!habit.reminderTime);
      
      if (habit.reminderTime) {
        const [hours, minutes] = habit.reminderTime.split(':').map(Number);
        const time = new Date();
        time.setHours(hours);
        time.setMinutes(minutes);
        setReminderTime(time);
      }
    }
  }, [habit]);

  if (!habit) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Edit Habit',
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerShadowVisible: false,
          }}
        />
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: theme.text }]}>Habit not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const toggleDay = (day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDays = new Set(selectedDays);
    if (newDays.has(day)) {
      newDays.delete(day);
    } else {
      newDays.add(day);
    }
    setSelectedDays(newDays);
    setValidationError('');
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      setValidationError('Please enter a habit name');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (schedule === 'specific' && selectedDays.size === 0) {
      setValidationError('Select at least one day');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Success haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const updatedHabit: Habit = {
      ...habit,
      name: name.trim(),
      color: selectedColor,
      icon: selectedIcon,
      schedule,
      scheduledDays: schedule === 'specific' ? Array.from(selectedDays) : undefined,
      reminderTime: hasReminder
        ? `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`
        : undefined,
    };

    await updateHabit(updatedHabit);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await deleteHabit(habit.id);
            router.back();
          },
        },
      ]
    );
  };

  const isFormValid = name.trim() && (schedule === 'daily' || selectedDays.size > 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Habit',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          animation: 'slide_from_bottom',
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Validation Error */}
        {validationError ? (
          <View style={[styles.errorBanner, { backgroundColor: theme.error + '20' }]}>
            <Text style={[styles.errorText, { color: theme.error }]}>{validationError}</Text>
          </View>
        ) : null}

        {/* Habit Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Habit Name *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.card,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Drink water"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={(text) => {
              setName(text);
              setValidationError('');
            }}
            maxLength={50}
          />
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Schedule *</Text>
          
          <View style={styles.scheduleButtons}>
            <TouchableOpacity
              style={[
                styles.scheduleButton,
                {
                  backgroundColor: schedule === 'daily' ? theme.primary : theme.card,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSchedule('daily');
                setValidationError('');
              }}
            >
              <Text
                style={[
                  styles.scheduleButtonText,
                  { color: schedule === 'daily' ? '#FFFFFF' : theme.text },
                ]}
              >
                Daily
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.scheduleButton,
                {
                  backgroundColor: schedule === 'specific' ? theme.primary : theme.card,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSchedule('specific');
                setValidationError('');
              }}
            >
              <Text
                style={[
                  styles.scheduleButtonText,
                  { color: schedule === 'specific' ? '#FFFFFF' : theme.text },
                ]}
              >
                Specific Days
              </Text>
            </TouchableOpacity>
          </View>

          {schedule === 'specific' && (
            <View style={styles.daysGrid}>
              {DAYS_OF_WEEK.map(day => (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.dayButton,
                    {
                      backgroundColor: selectedDays.has(day.value) ? theme.primary : theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => toggleDay(day.value)}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      { color: selectedDays.has(day.value) ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Reminder */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Reminder</Text>
          
          <TouchableOpacity
            style={[
              styles.reminderToggle,
              {
                backgroundColor: hasReminder ? theme.primary : theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setHasReminder(!hasReminder);
            }}
          >
            <Text
              style={[
                styles.reminderText,
                { color: hasReminder ? '#FFFFFF' : theme.text },
              ]}
            >
              {hasReminder ? '✓ Reminder Enabled' : 'Enable Reminder'}
            </Text>
          </TouchableOpacity>

          {hasReminder && (
            <TouchableOpacity
              style={[styles.timeButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowTimePicker(true);
              }}
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
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
            />
          )}
        </View>

        {/* Color Picker */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Color</Text>
          <View style={styles.colorGrid}>
            {habitColors.map(color => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  {
                    backgroundColor: color,
                    borderWidth: selectedColor === color ? 3 : 0,
                    borderColor: theme.text,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedColor(color);
                }}
              />
            ))}
          </View>
        </View>

        {/* Icon Picker */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Icon</Text>
          <View style={styles.iconGrid}>
            {habitIcons.map(icon => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: selectedIcon === icon ? theme.primary : theme.card,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedIcon(icon);
                }}
              >
                <Text style={styles.iconText}>{icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.error + '20', borderColor: theme.error }]}
          onPress={handleDelete}
        >
          <Text style={[styles.deleteButtonText, { color: theme.error }]}>Delete Habit</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky Save Button */}
      <View style={[styles.bottomBar, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: isFormValid ? theme.primary : theme.highlight,
            },
          ]}
          onPress={handleSave}
          disabled={!isFormValid}
        >
          <Text style={[styles.saveButtonText, { opacity: isFormValid ? 1 : 0.5 }]}>
            Save Changes
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120,
  },
  errorBanner: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 17,
  },
  scheduleButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  scheduleButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  scheduleButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  dayButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  reminderToggle: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
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
  },
  timeText: {
    fontSize: 24,
    fontWeight: '600',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 28,
  },
  deleteButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
