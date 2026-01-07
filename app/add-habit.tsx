
import { useHabits } from '@/contexts/HabitContext';
import { colors, habitColors, habitIcons } from '@/styles/commonStyles';
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
  Alert,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Habit } from '@/types/habit';
import { IconSymbol } from '@/components/IconSymbol';
import { usePremium } from '@/contexts/PremiumContext';
import { PaywallModal } from '@/components/PaywallModal';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AddHabitScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { addHabit, habits } = useHabits();
  const { isPremium } = usePremium();

  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState<'daily' | 'specific'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(habitColors[0]);
  const [selectedIcon, setSelectedIcon] = useState(habitIcons[0]);
  const [customIconUri, setCustomIconUri] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const toggleDay = (day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handlePickCustomIcon = async () => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Custom icons are available for Premium users only.',
        [{ text: 'OK' }]
      );
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library access to upload custom icons.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCustomIconUri(result.assets[0].uri);
      setSelectedIcon(''); // Clear emoji selection
    }
  };

  const handleSave = async () => {
    // Check habit limit for free users
    if (!isPremium && habits.length >= 3) {
      setShowPaywall(true);
      return;
    }

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    if (schedule === 'specific' && selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: name.trim(),
      color: selectedColor,
      icon: customIconUri || selectedIcon,
      customIconUri: customIconUri || undefined,
      schedule,
      scheduledDays: schedule === 'specific' ? selectedDays : undefined,
      reminderTime: reminderEnabled
        ? `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`
        : undefined,
      completions: [],
      createdAt: new Date().toISOString(),
    };

    await addHabit(newHabit);
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
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Habit Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Habit Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.card,
                color: theme.text,
                borderColor: theme.border,
              }
            ]}
            placeholder="e.g., Drink water"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Schedule</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segment,
                schedule === 'daily' && { backgroundColor: theme.primary },
                { borderColor: theme.border }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSchedule('daily');
              }}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: schedule === 'daily' ? '#FFFFFF' : theme.text }
                ]}
              >
                Daily
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segment,
                schedule === 'specific' && { backgroundColor: theme.primary },
                { borderColor: theme.border }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSchedule('specific');
              }}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: schedule === 'specific' ? '#FFFFFF' : theme.text }
                ]}
              >
                Specific Days
              </Text>
            </TouchableOpacity>
          </View>

          {schedule === 'specific' && (
            <View style={styles.daysContainer}>
              {DAYS_OF_WEEK.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayChip,
                    selectedDays.includes(index) && { backgroundColor: theme.primary },
                    {
                      borderColor: selectedDays.includes(index) ? theme.primary : theme.border,
                      backgroundColor: selectedDays.includes(index) ? theme.primary : theme.card,
                    }
                  ]}
                  onPress={() => toggleDay(index)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: selectedDays.includes(index) ? '#FFFFFF' : theme.text }
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Reminder */}
        <View style={styles.section}>
          <View style={styles.reminderHeader}>
            <Text style={[styles.label, { color: theme.text }]}>Reminder</Text>
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
                  backgroundColor: theme.card,
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

        {/* Color */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Color</Text>
          <View style={styles.colorGrid}>
            {habitColors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedColor(color);
                }}
              >
                {selectedColor === color && (
                  <IconSymbol
                    android_material_icon_name="check"
                    ios_icon_name="checkmark"
                    size={20}
                    color="#FFFFFF"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Icon */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <Text style={[styles.label, { color: theme.text }]}>Icon</Text>
            {isPremium && (
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: theme.primary + '15', borderColor: theme.primary }]}
                onPress={handlePickCustomIcon}
              >
                <IconSymbol
                  android_material_icon_name="photo-library"
                  ios_icon_name="photo"
                  size={16}
                  color={theme.primary}
                />
                <Text style={[styles.uploadButtonText, { color: theme.primary }]}>
                  Upload Custom
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {customIconUri && (
            <View style={styles.customIconPreview}>
              <Image source={{ uri: customIconUri }} style={styles.customIconImage} />
              <TouchableOpacity
                style={[styles.removeCustomIcon, { backgroundColor: theme.error }]}
                onPress={() => {
                  setCustomIconUri(null);
                  setSelectedIcon(habitIcons[0]);
                }}
              >
                <IconSymbol
                  android_material_icon_name="close"
                  ios_icon_name="xmark"
                  size={12}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.iconGrid}>
            {habitIcons.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconOption,
                  {
                    backgroundColor: theme.card,
                    borderColor: selectedIcon === icon && !customIconUri ? theme.primary : theme.border,
                    borderWidth: selectedIcon === icon && !customIconUri ? 2 : 1,
                  }
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedIcon(icon);
                  setCustomIconUri(null);
                }}
              >
                <Text style={styles.iconText}>{icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Habit</Text>
        </TouchableOpacity>
      </View>

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
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
    paddingBottom: 100,
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
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 17,
    borderWidth: 1,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 12,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '600',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  dayChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '600',
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginTop: 12,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 17,
    fontWeight: '600',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  iconHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  customIconPreview: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    position: 'relative',
  },
  customIconImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  removeCustomIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 26,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  saveButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
