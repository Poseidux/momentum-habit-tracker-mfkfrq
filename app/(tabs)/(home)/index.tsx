
import { useHabits } from '@/contexts/HabitContext';
import React, { useState } from 'react';
import {
  getTodayString,
  isHabitScheduledForDate,
  toggleHabitCompletion,
  calculateStreak,
} from '@/utils/habitUtils';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { ProgressRing } from '@/components/ProgressRing';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
} from 'react-native';
import { router } from 'expo-router';

export default function TodayScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { habits, updateHabit } = useHabits();
  const [today] = useState(getTodayString());

  const todayHabits = habits.filter((h) => isHabitScheduledForDate(h, new Date()));
  const completedCount = todayHabits.filter((h) => h.completions?.includes(today)).length;
  const totalCount = todayHabits.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const handleToggleCompletion = async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = toggleHabitCompletion(habit, today);
    updateHabit(updated);
  };

  const handleEditHabit = (habitId: string) => {
    router.push({ pathname: '/edit-habit', params: { habitId } });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn} style={styles.header}>
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {formatDate(new Date())}
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>Today</Text>
        </Animated.View>

        {totalCount > 0 && (
          <Animated.View entering={FadeIn.delay(100)} style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <View style={styles.summaryText}>
                <Text style={[styles.summaryTitle, { color: theme.text }]}>
                  {completedCount} of {totalCount} completed
                </Text>
                <Text style={[styles.summarySubtitle, { color: theme.textSecondary }]}>
                  {progress === 1 ? "Perfect day! 🎉" : "Keep going!"}
                </Text>
              </View>
              <ProgressRing progress={progress} size={60} strokeWidth={6} />
            </View>
          </Animated.View>
        )}

        <View style={styles.habitsList}>
          {todayHabits.map((habit, index) => {
            const isCompleted = habit.completions?.includes(today);
            const streak = calculateStreak(habit);
            
            return (
              <Animated.View 
                key={habit.id}
                entering={FadeInDown.delay(index * 50).duration(400)}
              >
                <TouchableOpacity
                  style={[
                    styles.habitCard,
                    { 
                      backgroundColor: theme.card,
                      borderColor: isCompleted ? habit.color : theme.border,
                      borderWidth: isCompleted ? 2 : 1,
                    }
                  ]}
                  onPress={() => handleToggleCompletion(habit.id)}
                  onLongPress={() => handleEditHabit(habit.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.habitHeader}>
                    <View style={styles.habitInfo}>
                      <View style={[styles.iconCircle, { backgroundColor: habit.color + '20' }]}>
                        <Text style={styles.icon}>{habit.icon}</Text>
                      </View>
                      <View style={styles.habitText}>
                        <Text style={[styles.habitName, { color: theme.text }]}>
                          {habit.name}
                        </Text>
                        {streak > 0 && (
                          <Text style={[styles.streak, { color: theme.textSecondary }]}>
                            🔥 {streak} day streak
                          </Text>
                        )}
                      </View>
                    </View>
                    <View
                      style={[
                        styles.checkButton,
                        {
                          backgroundColor: isCompleted ? habit.color : theme.border + '40',
                        }
                      ]}
                    >
                      {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {totalCount === 0 && (
          <Animated.View entering={FadeIn.delay(200)} style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No habits for today
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Add your first habit to get started
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/add-habit')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
  header: {
    marginBottom: 24,
  },
  date: {
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
  },
  habitsList: {
    gap: 12,
  },
  habitCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  habitText: {
    flex: 1,
  },
  habitName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  streak: {
    fontSize: 13,
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fabIcon: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
});
