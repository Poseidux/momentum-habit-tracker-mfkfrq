
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getTodayString,
  getWeeklyStats,
  getCompletionPercentage,
  calculateStreak,
} from '@/utils/habitUtils';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { useHabits } from '@/contexts/HabitContext';
import React from 'react';

export default function ProgressScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { habits } = useHabits();

  const today = getTodayString();
  const weeklyStats = getWeeklyStats(habits);

  const generateCalendarDays = () => {
    const days = [];
    const currentDate = new Date();
    
    // Show last 42 days (6 weeks)
    for (let i = 41; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const percentage = getCompletionPercentage(habits, dateString);
      
      days.push({
        date: dateString,
        day: date.getDate(),
        percentage,
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const getIntensityColor = (percentage: number) => {
    if (percentage === 0) return theme.border;
    if (percentage < 33) return theme.primary + '40';
    if (percentage < 66) return theme.primary + '70';
    if (percentage < 100) return theme.primary + 'B0';
    return theme.primary;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn} style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Progress</Text>
        </Animated.View>

        {/* This Week Summary */}
        <Animated.View
          entering={FadeIn.delay(100)}
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>This Week</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {weeklyStats.completedThisWeek}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Completed
              </Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {weeklyStats.bestDay || 'None'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Best Day
              </Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {Math.round(weeklyStats.weeklyCompletionRate)}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Success Rate
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Calendar Heatmap */}
        <Animated.View
          entering={FadeIn.delay(200)}
          style={[
            styles.calendarCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Activity</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Last 6 weeks
          </Text>

          <View style={styles.calendar}>
            {calendarDays.map((day, index) => (
              <View
                key={day.date}
                style={[
                  styles.calendarDay,
                  {
                    backgroundColor: getIntensityColor(day.percentage),
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.legend}>
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Less</Text>
            <View style={styles.legendColors}>
              <View style={[styles.legendBox, { backgroundColor: theme.border }]} />
              <View style={[styles.legendBox, { backgroundColor: theme.primary + '40' }]} />
              <View style={[styles.legendBox, { backgroundColor: theme.primary + '70' }]} />
              <View style={[styles.legendBox, { backgroundColor: theme.primary + 'B0' }]} />
              <View style={[styles.legendBox, { backgroundColor: theme.primary }]} />
            </View>
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>More</Text>
          </View>
        </Animated.View>

        {/* Habit Streaks */}
        {habits.length > 0 && (
          <Animated.View
            entering={FadeIn.delay(300)}
            style={[
              styles.streaksCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Current Streaks</Text>

            <View style={styles.streaksList}>
              {habits
                .map((habit) => ({
                  ...habit,
                  streak: calculateStreak(habit),
                }))
                .sort((a, b) => b.streak - a.streak)
                .map((habit, index) => (
                  <Animated.View
                    key={habit.id}
                    entering={FadeInDown.delay(300 + index * 50).duration(400)}
                    style={styles.streakItem}
                  >
                    <View style={styles.streakLeft}>
                      <View style={[styles.streakIcon, { backgroundColor: habit.color + '15' }]}>
                        <Text style={styles.streakEmoji}>{habit.icon}</Text>
                      </View>
                      <Text style={[styles.streakName, { color: theme.text }]}>
                        {habit.name}
                      </Text>
                    </View>
                    <View style={styles.streakRight}>
                      {habit.streak > 0 ? (
                        <>
                          <Text style={styles.streakFire}>🔥</Text>
                          <Text style={[styles.streakNumber, { color: theme.primary }]}>
                            {habit.streak}
                          </Text>
                        </>
                      ) : (
                        <Text style={[styles.streakZero, { color: theme.textTertiary }]}>
                          No streak
                        </Text>
                      )}
                    </View>
                  </Animated.View>
                ))}
            </View>
          </Animated.View>
        )}

        {/* Extra padding for tab bar */}
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
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  summaryCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  calendarCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 16,
  },
  calendarDay: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  legendText: {
    fontSize: 12,
  },
  legendColors: {
    flexDirection: 'row',
    gap: 4,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  streaksCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  streaksList: {
    marginTop: 16,
    gap: 12,
  },
  streakItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  streakIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  streakEmoji: {
    fontSize: 20,
  },
  streakName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  streakRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakFire: {
    fontSize: 18,
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  streakZero: {
    fontSize: 14,
  },
});
