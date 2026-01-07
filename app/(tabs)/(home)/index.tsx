
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, withSpring, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import {
  getTodayString,
  isHabitScheduledForDate,
  toggleHabitCompletion,
  calculateStreak,
} from '@/utils/habitUtils';
import { useHabits } from '@/contexts/HabitContext';
import React, { useState, useEffect } from 'react';
import { authenticatedGet, authenticatedPost } from '@/utils/api';

function FuturisticCompletionRing({ progress, size = 200 }: { progress: number; size?: number }) {
  const scale = useSharedValue(0);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  useEffect(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Animated.View style={[styles.completionRingContainer, animatedStyle, { width: size, height: size }]}>
      <View style={styles.ringWrapper}>
        {/* Background ring */}
        <View 
          style={[
            styles.ringBackground, 
            { 
              width: size, 
              height: size, 
              borderRadius: size / 2, 
              borderColor: theme.border,
              borderWidth: 8,
            }
          ]} 
        />
        
        {/* Center content */}
        <View style={styles.ringCenter}>
          <Text style={[styles.progressPercentage, { color: theme.text }]}>{Math.round(progress)}%</Text>
          <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Complete</Text>
        </View>

        {/* Glow effect for 100% */}
        {progress === 100 && (
          <View style={[styles.glowEffect, { backgroundColor: theme.accent, width: size, height: size, borderRadius: size / 2 }]} />
        )}
      </View>
    </Animated.View>
  );
}

export default function TodayScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { habits, updateHabit } = useHabits();
  const { user } = useAuth();
  const [userGroups, setUserGroups] = useState<string[]>([]);

  const today = getTodayString();
  const todayHabits = habits.filter((h) => isHabitScheduledForDate(h, today));
  const completedCount = todayHabits.filter((h) => h.completions.includes(today)).length;
  const progress = todayHabits.length > 0 ? (completedCount / todayHabits.length) * 100 : 0;

  useEffect(() => {
    if (user) {
      fetchUserGroups();
    }
  }, [user]);

  const fetchUserGroups = async () => {
    try {
      const groups = await authenticatedGet('/api/groups');
      setUserGroups(groups.map((g: any) => g.id));
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const syncCompletionToGroups = async (habitName: string, completed: boolean) => {
    if (!user || userGroups.length === 0) return;

    try {
      for (const groupId of userGroups) {
        await authenticatedPost(`/api/groups/${groupId}/completions`, {
          habitName,
          completed,
          date: today,
        });
      }
    } catch (error) {
      console.error('Failed to sync completion:', error);
    }
  };

  const handleToggleCompletion = async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const wasCompleted = habit.completions.includes(today);
    const updatedHabit = toggleHabitCompletion(habit, today);
    updateHabit(updatedHabit);

    await syncCompletionToGroups(habit.name, !wasCompleted);

    Haptics.impactAsync(
      wasCompleted ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
  };

  const handleEditHabit = (habitId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/edit-habit?id=${habitId}`);
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
      <Animated.View entering={FadeIn} style={styles.header}>
        <Text style={[styles.date, { color: theme.textSecondary }]}>{formatDate(new Date())}</Text>
        <Text style={[styles.title, { color: theme.text }]}>Today</Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {todayHabits.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100)} style={styles.progressSection}>
            <FuturisticCompletionRing progress={progress} size={200} />
            <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
              {completedCount} of {todayHabits.length} completed
            </Text>
          </Animated.View>
        )}

        <View style={styles.habitsSection}>
          {todayHabits.map((habit, index) => {
            const isCompleted = habit.completions.includes(today);
            const streak = calculateStreak(habit);

            return (
              <Animated.View
                key={habit.id}
                entering={FadeInDown.delay(200 + index * 100)}
                style={[
                  styles.habitCard,
                  { backgroundColor: theme.card },
                  isCompleted && { opacity: 0.7 },
                ]}
              >
                <TouchableOpacity
                  style={styles.habitContent}
                  onPress={() => handleEditHabit(habit.id)}
                  onLongPress={() => handleEditHabit(habit.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.habitLeft}>
                    <View style={[styles.habitIcon, { backgroundColor: habit.color + '20' }]}>
                      {habit.customIconUri ? (
                        <Image source={{ uri: habit.customIconUri }} style={styles.customIcon} />
                      ) : (
                        <Text style={styles.habitIconText}>{habit.icon}</Text>
                      )}
                    </View>
                    <View style={styles.habitInfo}>
                      <Text style={[styles.habitName, { color: theme.text }]}>{habit.name}</Text>
                      {streak > 0 && (
                        <Text style={[styles.streakText, { color: theme.textSecondary }]}>
                          🔥 {streak} day streak
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.checkButton,
                    { backgroundColor: isCompleted ? theme.accent : theme.border },
                  ]}
                  onPress={() => handleToggleCompletion(habit.id)}
                  activeOpacity={0.7}
                >
                  {isCompleted && (
                    <IconSymbol ios_icon_name="checkmark" android_material_icon_name="check" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          {/* Add Habit Card - styled like habit cards but with transparent background */}
          <Animated.View entering={FadeInDown.delay(200 + todayHabits.length * 100)}>
            <TouchableOpacity
              style={[
                styles.addHabitCard, 
                { 
                  backgroundColor: 'transparent', 
                  borderColor: theme.border, 
                  borderWidth: 2, 
                  borderStyle: 'dashed' 
                }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/add-habit');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.addHabitContent}>
                <View style={[styles.addHabitIcon, { backgroundColor: theme.border }]}>
                  <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={28} color={theme.text} />
                </View>
                <Text style={[styles.addHabitText, { color: theme.textSecondary }]}>Add New Habit</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {todayHabits.length === 0 && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No habits scheduled for today
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Tap the button below to add your first habit
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  date: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  completionRingContainer: {
    marginBottom: 16,
  },
  ringWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  ringBackground: {
    position: 'absolute',
  },
  ringCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  progressPercentage: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
  },
  glowEffect: {
    position: 'absolute',
    opacity: 0.15,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  habitsSection: {
    gap: 12,
  },
  habitCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  habitContent: {
    flex: 1,
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  habitIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitIconText: {
    fontSize: 24,
  },
  customIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '500',
  },
  checkButton: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  addHabitCard: {
    borderRadius: 16,
    padding: 16,
    minHeight: 80,
    justifyContent: 'center',
  },
  addHabitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addHabitIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addHabitText: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
  },
});
