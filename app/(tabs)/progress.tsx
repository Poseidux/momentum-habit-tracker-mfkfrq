
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
import { colors } from '@/styles/commonStyles';
import { useHabits } from '@/contexts/HabitContext';
import {
  getTodayString,
  getWeeklyStats,
  getCompletionPercentage,
  calculateStreak,
} from '@/utils/habitUtils';

export default function ProgressScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  const { habits } = useHabits();
  const weeklyStats = getWeeklyStats(habits);

  // Generate last 30 days for calendar
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const percentage = getCompletionPercentage(habits, dateString);
      
      days.push({
        date,
        dateString,
        percentage,
        day: date.getDate(),
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const getIntensityColor = (percentage: number) => {
    if (percentage === 0) {
      return theme.highlight;
    }
    if (percentage < 33) {
      return isDark ? '#4C1D95' : '#E9D5FF';
    }
    if (percentage < 66) {
      return isDark ? '#7C3AED' : '#C084FC';
    }
    return theme.primary;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Progress</Text>
        </View>

        {/* Weekly Summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>This Week</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {weeklyStats.completedThisWeek}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Completed
              </Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.accent }]}>
                {weeklyStats.bestDay}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Best Day
              </Text>
            </View>
          </View>
        </View>

        {/* Calendar Heatmap */}
        <View style={[styles.calendarCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Last 30 Days</Text>
          
          <View style={styles.calendar}>
            {calendarDays.map((day, index) => (
              <View
                key={day.dateString}
                style={[
                  styles.calendarDay,
                  {
                    backgroundColor: getIntensityColor(day.percentage),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    {
                      color: day.percentage > 50 ? '#FFFFFF' : theme.textSecondary,
                    },
                  ]}
                >
                  {day.day}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.legend}>
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Less</Text>
            <View style={styles.legendColors}>
              <View style={[styles.legendBox, { backgroundColor: theme.highlight }]} />
              <View style={[styles.legendBox, { backgroundColor: isDark ? '#4C1D95' : '#E9D5FF' }]} />
              <View style={[styles.legendBox, { backgroundColor: isDark ? '#7C3AED' : '#C084FC' }]} />
              <View style={[styles.legendBox, { backgroundColor: theme.primary }]} />
            </View>
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>More</Text>
          </View>
        </View>

        {/* Habit Streaks */}
        <View style={[styles.streaksCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Current Streaks</Text>
          
          {habits.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No habits yet
            </Text>
          ) : (
            habits.map(habit => {
              const streak = calculateStreak(habit);
              return (
                <View key={habit.id} style={styles.streakItem}>
                  <View style={styles.streakLeft}>
                    <Text style={styles.streakIcon}>{habit.icon}</Text>
                    <Text style={[styles.streakName, { color: theme.text }]}>
                      {habit.name}
                    </Text>
                  </View>
                  <View style={styles.streakRight}>
                    <Text style={[styles.streakValue, { color: theme.primary }]}>
                      {streak}
                    </Text>
                    <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>
                      {streak === 1 ? 'day' : 'days'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
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
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
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
  divider: {
    width: 1,
    height: 40,
  },
  calendarCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  calendarDay: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: '600',
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
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  streaksCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  streakItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  streakIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  streakName: {
    fontSize: 17,
    fontWeight: '500',
  },
  streakRight: {
    alignItems: 'flex-end',
  },
  streakValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  streakLabel: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
