
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Alert,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { useHabits } from '@/contexts/HabitContext';

export default function ManageHabitsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  const { habits, deleteHabit } = useHabits();

  const handleDelete = (habitId: string, habitName: string) => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habitName}"? This will remove all progress.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteHabit(habitId);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Manage Habits',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No habits yet
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/add-habit')}
            >
              <Text style={styles.addButtonText}>Add Your First Habit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          habits.map(habit => (
            <View
              key={habit.id}
              style={[styles.habitCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={styles.habitLeft}>
                <View style={[styles.colorDot, { backgroundColor: habit.color }]} />
                <Text style={styles.habitIcon}>{habit.icon}</Text>
                <View style={styles.habitInfo}>
                  <Text style={[styles.habitName, { color: theme.text }]}>
                    {habit.name}
                  </Text>
                  <Text style={[styles.habitSchedule, { color: theme.textSecondary }]}>
                    {habit.schedule === 'daily' ? 'Daily' : 'Specific days'}
                    {habit.reminderTime && ` • ${habit.reminderTime}`}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: theme.highlight }]}
                onPress={() => handleDelete(habit.id, habit.name)}
              >
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 17,
    marginBottom: 24,
    textAlign: 'center',
  },
  addButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  habitCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  habitIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  habitSchedule: {
    fontSize: 14,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 20,
  },
});
