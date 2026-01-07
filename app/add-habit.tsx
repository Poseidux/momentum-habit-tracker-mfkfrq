
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

const DAYS_OF_WEEK = [
  { label: 'S', value: 0, name: 'Sunday' },
  { label: 'M', value: 1, name: 'Monday' },
  { label: 'T', value: 2, name: 'Tuesday' },
  { label: 'W', value: 3, name: 'Wednesday' },
  { label: 'T', value: 4, name: 'Thursday' },
  { label: 'F', value: 5, name: 'Friday' },
  { label: 'S', value: 6, name: 'Saturday' },
];

export default function AddHabitScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  const { addHabit } = useHabits();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(habitColors[0]);
  const [selectedIcon, setSelectedIcon] = useState(habitIcons[0]);
  const [schedule, setSchedule] = useState<'daily' | 'specific'>('daily');
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5, 6]));
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const toggleDay = (day: number) => {
    const newDays = new Set(selectedDays);
    if (newDays.has(day)) {
      newDays.delete(day);
    } else {
      newDays.add(day);
    }
    setSelectedDays(newDays);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }

    const habit: Habit = {
      id: `habit-${Date.now()}`,
      name: name.trim(),
      color: selectedColor,
      icon: selectedIcon,
      schedule,
      scheduledDays: schedule === 'specific' ? Array.from(selectedDays) : undefined,
      reminderTime: hasReminder
        ? `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`
        : undefined,
      completions: [],
      createdAt: new Date().toISOString(),
    };

    await addHabit(habit);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Add Habit',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Habit Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.card,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="e.g., Morning Exercise"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
            autoFocus
          />
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
                onPress={() => setSelectedIcon(icon)}
              >
                <Text style={styles.iconText}>{icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Schedule</Text>
          
          <View style={styles.scheduleButtons}>
            <TouchableOpacity
              style={[
                styles.scheduleButton,
                {
                  backgroundColor: schedule === 'daily' ? theme.primary : theme.card,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setSchedule('daily')}
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
              onPress={() => setSchedule('specific')}
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
            onPress={() => setHasReminder(!hasReminder)}
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
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: name.trim() ? theme.primary : theme.highlight,
            },
          ]}
          onPress={handleSave}
          disabled={!name.trim()}
        >
          <Text style={styles.saveButtonText}>Create Habit</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
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
  saveButton: {
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
