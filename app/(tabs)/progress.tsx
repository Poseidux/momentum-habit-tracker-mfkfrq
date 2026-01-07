
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useHabits } from '@/contexts/HabitContext';
import { colors } from '@/styles/commonStyles';
import {
  getTodayString,
  getWeeklyStats,
  getCompletionPercentage,
  calculateStreak,
} from '@/utils/habitUtils';

export default function ProgressScreen() {
  const { habits } = useHabits();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const weeklyStats = getWeeklyStats(habits);
  const weeklyPercentage = weeklyStats.total > 0 
    ? Math.round((weeklyStats.completed / weeklyStats.total) * 100) 
    : 0;

  function generateCalendarDays() {
    const days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    
    return days;
  }

  function getIntensityColor(percentage: number): string {
    if (percentage === 0) return theme.border;
    if (percentage < 25) return theme.primary + '40';
    if (percentage < 50) return theme.primary + '60';
    if (percentage < 75) return theme.primary + '80';
    return theme.primary;
  }

  const calendarDays = generateCalendarDays();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Progress
          </Text>
        </Animated.View>

        {/* Weekly Summary */}
        <Animated.View 
          entering={FadeInDown.delay(200).duration(600)} 
          style={[styles.summaryCard, { backgroundColor: theme.card }]}
        >
          <Text style={[styles.summaryTitle, { color: theme.text }]}>
            This Week
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {weeklyPercentage}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Completion Rate
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.success }]}>
                {weeklyStats.completed}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Completed
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Calendar Heatmap */}
        <Animated.View 
          entering={FadeInDown.delay(400).duration(600)} 
          style={styles.calendarSection}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Last 30 Days
          </Text>
          <View style={styles.calendar}>
            {calendarDays.map((date, index) => {
              const dateStr = date.toISOString().split('T')[0];
              let dayTotal = 0;
              let dayCompleted = 0;

              habits.forEach(habit => {
                if (habit.completions[dateStr]) {
                  dayCompleted++;
                  dayTotal++;
                } else {
                  dayTotal++;
                }
              });

              const percentage = dayTotal > 0 ? (dayCompleted / dayTotal) * 100 : 0;
              const intensity = getIntensityColor(percentage);

              return (
                <View
                  key={index}
                  style={[
                    styles.calendarDay,
                    { backgroundColor: intensity },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.calendarLegend}>
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>
              Less
            </Text>
            <View style={styles.legendDots}>
              <View style={[styles.legendDot, { backgroundColor: theme.border }]} />
              <View style={[styles.legendDot, { backgroundColor: theme.primary + '40' }]} />
              <View style={[styles.legendDot, { backgroundColor: theme.primary + '60' }]} />
              <View style={[styles.legendDot, { backgroundColor: theme.primary + '80' }]} />
              <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
            </View>
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>
              More
            </Text>
          </View>
        </Animated.View>

        {/* Habit Stats */}
        <Animated.View 
          entering={FadeInDown.delay(600).duration(600)} 
          style={styles.habitsSection}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Habit Stats
          </Text>
          {habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No habits yet. Add your first habit to see progress!
              </Text>
            </View>
          ) : (
            habits.map((habit, index) => {
              const streak = calculateStreak(habit);
              const completion30 = getCompletionPercentage(habit, 30);

              return (
                <View
                  key={habit.id}
                  style={[styles.habitStatCard, { backgroundColor: theme.card }]}
                >
                  <View style={styles.habitStatHeader}>
                    <View style={[styles.habitStatIcon, { backgroundColor: habit.color + '20' }]}>
                      <Text style={{ fontSize: 20 }}>{habit.icon}</Text>
                    </View>
                    <View style={styles.habitStatInfo}>
                      <Text style={[styles.habitStatName, { color: theme.text }]}>
                        {habit.name}
                      </Text>
                      <Text style={[styles.habitStatSchedule, { color: theme.textSecondary }]}>
                        {habit.schedule === 'daily' ? 'Daily' : 'Custom Schedule'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.habitStatMetrics}>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricValue, { color: theme.primary }]}>
                        {streak}
                      </Text>
                      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                        Day Streak
                      </Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricValue, { color: theme.success }]}>
                        {completion30}%
                      </Text>
                      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                        30-Day Rate
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </Animated.View>

        {/* Bottom Padding for Tab Bar */}
        <View style={{ height: 100 }} />
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
    paddingHorizontal: 20,
  },
  header: {
    marginTop: Platform.OS === 'android' ? 20 : 10,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  summaryCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  calendarSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calendarDay: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  calendarLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  legendText: {
    fontSize: 12,
  },
  legendDots: {
    flexDirection: 'row',
    gap: 4,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  habitsSection: {
    marginBottom: 24,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  habitStatCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  habitStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  habitStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitStatInfo: {
    flex: 1,
  },
  habitStatName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  habitStatSchedule: {
    fontSize: 14,
  },
  habitStatMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
  },
});
