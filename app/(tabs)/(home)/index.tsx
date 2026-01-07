
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, ScaleIn } from 'react-native-reanimated';
import { colors } from '@/styles/commonStyles';
import { useHabits } from '@/contexts/HabitContext';
import { ProgressRing } from '@/components/ProgressRing';
import {
  getTodayString,
  isHabitScheduledForDate,
  toggleHabitCompletion,
  calculateStreak,
} from '@/utils/habitUtils';

export default function TodayScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  const { habits, updateHabit } = useHabits();
  const [refreshKey, setRefreshKey] = useState(0);

  const today = new Date();
  const todayString = getTodayString();
  
  const todayHabits = habits.filter(h => isHabitScheduledForDate(h, today));
  const completedCount = todayHabits.filter(h => h.completions.includes(todayString)).length;
  const totalCount = todayHabits.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggleCompletion = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) {
      return;
    }

    const updated = toggleHabitCompletion(habit, todayString);
    await updateHabit(updated);
    setRefreshKey(prev => prev + 1);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {formatDate(today)}
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>Today</Text>
        </View>

        {/* Progress Summary */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.summaryCard, { backgroundColor: theme.card }]}
        >
          <View style={styles.summaryContent}>
            <View style={styles.summaryText}>
              <Text style={[styles.summaryTitle, { color: theme.text }]}>
                {completedCount} of {totalCount} completed
              </Text>
              <Text style={[styles.summarySubtitle, { color: theme.textSecondary }]}>
                {progress === 100 && totalCount > 0
                  ? '🎉 Perfect day!'
                  : progress >= 50
                  ? 'Keep going!'
                  : 'Let\'s get started!'}
              </Text>
            </View>
            <ProgressRing
              size={80}
              strokeWidth={8}
              progress={progress}
              color={theme.primary}
              backgroundColor={theme.highlight}
            />
          </View>
        </Animated.View>

        {/* Habits List */}
        <View style={styles.habitsSection}>
          {todayHabits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No habits scheduled for today
              </Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/add-habit')}
              >
                <Text style={styles.addButtonText}>Add Your First Habit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            todayHabits.map((habit, index) => {
              const isCompleted = habit.completions.includes(todayString);
              const streak = calculateStreak(habit);

              return (
                <Animated.View
                  key={habit.id}
                  entering={ScaleIn.delay(index * 100).duration(300)}
                >
                  <TouchableOpacity
                    style={[
                      styles.habitCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: isCompleted ? habit.color : theme.border,
                        borderWidth: isCompleted ? 2 : 1,
                      },
                    ]}
                    onPress={() => handleToggleCompletion(habit.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.habitLeft}>
                      <Text style={styles.habitIcon}>{habit.icon}</Text>
                      <View style={styles.habitInfo}>
                        <Text style={[styles.habitName, { color: theme.text }]}>
                          {habit.name}
                        </Text>
                        {streak > 0 && (
                          <Text style={[styles.habitStreak, { color: theme.textSecondary }]}>
                            🔥 {streak} day streak
                          </Text>
                        )}
                      </View>
                    </View>

                    <View
                      style={[
                        styles.checkButton,
                        {
                          backgroundColor: isCompleted ? habit.color : theme.highlight,
                        },
                      ]}
                    >
                      {isCompleted && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </View>

        {/* Add Habit Button */}
        {todayHabits.length > 0 && (
          <TouchableOpacity
            style={[styles.floatingAddButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/add-habit')}
          >
            <Text style={styles.floatingAddText}>+ Add Habit</Text>
          </TouchableOpacity>
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
    paddingTop: Platform.OS === 'android' ? 16 : 0,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  date: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 15,
  },
  habitsSection: {
    gap: 12,
  },
  habitCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  habitStreak: {
    fontSize: 14,
  },
  checkButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
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
  floatingAddButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  floatingAddText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
