
import { useHabits } from '@/contexts/HabitContext';
import {
  getTodayString,
  getWeeklyStats,
  getCompletionPercentage,
  calculateStreak,
} from '@/utils/habitUtils';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function ProgressScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { habits } = useHabits();

  const weeklyStats = getWeeklyStats(habits);
  const today = getTodayString();

  const generateCalendarDays = () => {
    const days = [];
    const currentDate = new Date();
    
    // Generate last 35 days (5 weeks)
    for (let i = 34; i >= 0; i--) {
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

  const getIntensityColor = (percentage: number) => {
    if (percentage === 0) return theme.border;
    if (percentage < 33) return theme.primary + '40';
    if (percentage < 66) return theme.primary + '70';
    return theme.primary;
  };

  const calendarDays = generateCalendarDays();

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      edges={['top']}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn} style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Progress</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Track your consistency
          </Text>
        </Animated.View>

        {/* Weekly Summary */}
        <Animated.View 
          entering={FadeIn.delay(100)}
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.card,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            }
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            This Week
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {weeklyStats.completedThisWeek}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Completed
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {weeklyStats.bestDay}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Best Day
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {Math.round(weeklyStats.averageCompletion)}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Average
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Calendar Heatmap */}
        <Animated.View entering={FadeIn.delay(200)}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Last 5 Weeks
          </Text>
          <View 
            style={[
              styles.calendarCard,
              {
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }
            ]}
          >
            <View style={styles.calendar}>
              {calendarDays.map((day, index) => (
                <View
                  key={day.date}
                  style={[
                    styles.calendarDay,
                    {
                      backgroundColor: getIntensityColor(day.percentage),
                    }
                  ]}
                >
                  {day.percentage > 0 && (
                    <Text style={styles.dayNumber}>{day.day}</Text>
                  )}
                </View>
              ))}
            </View>
            <View style={styles.legend}>
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                Less
              </Text>
              <View style={[styles.legendBox, { backgroundColor: theme.border }]} />
              <View style={[styles.legendBox, { backgroundColor: theme.primary + '40' }]} />
              <View style={[styles.legendBox, { backgroundColor: theme.primary + '70' }]} />
              <View style={[styles.legendBox, { backgroundColor: theme.primary }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                More
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Habit Streaks */}
        {habits.length > 0 && (
          <Animated.View entering={FadeIn.delay(300)}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Current Streaks
            </Text>
            {habits.map((habit, index) => {
              const streak = calculateStreak(habit);
              if (streak === 0) return null;

              return (
                <Animated.View
                  key={habit.id}
                  entering={FadeInDown.delay(index * 50)}
                  style={[
                    styles.streakCard,
                    {
                      backgroundColor: theme.card,
                      borderWidth: 1,
                      borderColor: theme.cardBorder,
                    }
                  ]}
                >
                  <View style={styles.streakInfo}>
                    <View style={[styles.habitIcon, { backgroundColor: habit.color + '15' }]}>
                      <Text style={styles.icon}>{habit.icon}</Text>
                    </View>
                    <View style={styles.streakDetails}>
                      <Text style={[styles.habitName, { color: theme.text }]}>
                        {habit.name}
                      </Text>
                      <Text style={[styles.streakText, { color: theme.textSecondary }]}>
                        🔥 {streak} day streak
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.streakBadge, { backgroundColor: habit.color + '20' }]}>
                    <Text style={[styles.streakNumber, { color: habit.color }]}>
                      {streak}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

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
    marginBottom: 28,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 32,
    marginBottom: 16,
  },
  summaryCard: {
    padding: 24,
    borderRadius: 20,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  calendarCard: {
    padding: 20,
    borderRadius: 20,
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
    gap: 6,
    marginBottom: 16,
  },
  calendarDay: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 8px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  streakDetails: {
    flex: 1,
  },
  habitName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  streakText: {
    fontSize: 14,
  },
  streakBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
});
