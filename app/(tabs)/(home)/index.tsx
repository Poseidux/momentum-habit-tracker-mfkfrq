
import React, { useState, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, withSpring, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { IconSymbol } from '@/components/IconSymbol';
import { useHabits } from '@/contexts/HabitContext';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import {
  getTodayString,
  isHabitScheduledForDate,
  calculateStreak,
} from '@/utils/habitUtils';
import { authenticatedGet, authenticatedPost } from '@/utils/api';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function FuturisticCompletionRing({ progress, size = 120 }: { progress: number; size?: number }) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;
  
  const rotation = useSharedValue(0);
  
  useEffect(() => {
    rotation.value = withSpring(progress * 360, {
      damping: 15,
      stiffness: 100,
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      <View style={[styles.ringOuter, { 
        borderColor: theme.border,
        width: size,
        height: size,
        borderRadius: size / 2,
      }]}>
        <Animated.View style={[
          styles.ringProgress,
          {
            borderColor: theme.primary,
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          animatedStyle,
        ]} />
      </View>
      <View style={styles.ringCenter}>
        <Text style={[styles.ringPercentage, { color: theme.text }]}>
          {Math.round(progress * 100)}%
        </Text>
        <Text style={[styles.ringLabel, { color: theme.textSecondary }]}>
          Complete
        </Text>
      </View>
    </View>
  );
}

export default function TodayScreen() {
  const { habits, toggleCompletion } = useHabits();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;
  const [userGroups, setUserGroups] = useState<any[]>([]);

  const today = getTodayString();
  const todayDate = new Date();

  const todayHabits = habits.filter(habit => 
    isHabitScheduledForDate(habit, todayDate)
  );

  const completedCount = todayHabits.filter(habit => 
    habit.completions[today]
  ).length;

  const progress = todayHabits.length > 0 ? completedCount / todayHabits.length : 0;

  useEffect(() => {
    if (user) {
      fetchUserGroups();
    }
  }, [user]);

  async function fetchUserGroups() {
    try {
      const groups = await authenticatedGet('/api/groups');
      setUserGroups(groups || []);
    } catch (error) {
      console.error('Error fetching user groups:', error);
    }
  }

  async function syncCompletionToGroups(habitName: string, completed: boolean) {
    if (!user || userGroups.length === 0) return;

    // TODO: Backend Integration - Sync habit completion to all user groups
    try {
      for (const group of userGroups) {
        await authenticatedPost(`/api/groups/${group.id}/completions`, {
          habitName,
          completed,
          date: today,
        });
      }
    } catch (error) {
      console.error('Error syncing completion to groups:', error);
    }
  }

  async function handleToggleCompletion(habitId: string) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const wasCompleted = habit.completions[today];
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleCompletion(habitId, today);

    // Sync to groups if user is authenticated
    if (user) {
      await syncCompletionToGroups(habit.name, !wasCompleted);
    }
  }

  function handleEditHabit(habitId: string) {
    router.push({
      pathname: '/edit-habit',
      params: { habitId },
    });
  }

  function formatDate(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              {formatDate(todayDate)}
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>
              Today&apos;s Habits
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/manage-habits')}
            style={[styles.manageButton, { backgroundColor: theme.surface }]}
          >
            <IconSymbol
              ios_icon_name="slider.horizontal.3"
              android_material_icon_name="tune"
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Progress Ring */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.progressSection}>
          <FuturisticCompletionRing progress={progress} />
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
            {completedCount} of {todayHabits.length} completed
          </Text>
        </Animated.View>

        {/* Habits List */}
        <View style={styles.habitsSection}>
          {todayHabits.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No habits scheduled for today
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/add-habit')}
                style={[styles.addButton, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.addButtonText}>Add Your First Habit</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            todayHabits.map((habit, index) => {
              const isCompleted = habit.completions[today];
              const streak = calculateStreak(habit);

              return (
                <AnimatedTouchable
                  key={habit.id}
                  entering={FadeInDown.delay(400 + index * 100).duration(600)}
                  onPress={() => handleToggleCompletion(habit.id)}
                  onLongPress={() => handleEditHabit(habit.id)}
                  style={[
                    styles.habitCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: isCompleted ? habit.color : theme.border,
                      borderWidth: isCompleted ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.habitLeft}>
                    {habit.customIconUri ? (
                      <Image
                        source={{ uri: habit.customIconUri }}
                        style={[styles.habitIconCustom, { backgroundColor: habit.color + '20' }]}
                      />
                    ) : (
                      <View style={[styles.habitIcon, { backgroundColor: habit.color + '20' }]}>
                        <Text style={{ fontSize: 24 }}>{habit.icon}</Text>
                      </View>
                    )}
                    <View style={styles.habitInfo}>
                      <Text style={[styles.habitName, { color: theme.text }]}>
                        {habit.name}
                      </Text>
                      {streak > 0 && (
                        <View style={styles.streakBadge}>
                          <Text style={styles.streakText}>🔥 {streak} day streak</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={[
                    styles.checkButton,
                    {
                      backgroundColor: isCompleted ? habit.color : theme.surface,
                    },
                  ]}>
                    {isCompleted && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={24}
                        color="#FFFFFF"
                      />
                    )}
                  </View>
                </AnimatedTouchable>
              );
            })
          )}
        </View>

        {/* Add Habit Button */}
        {todayHabits.length > 0 && (
          <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.addSection}>
            <TouchableOpacity
              onPress={() => router.push('/add-habit')}
              style={[styles.addHabitButton, { backgroundColor: theme.primary }]}
            >
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.addHabitText}>Add Habit</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 20 : 10,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  manageButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  ringContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  ringOuter: {
    borderWidth: 8,
    position: 'absolute',
  },
  ringProgress: {
    borderWidth: 8,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  ringCenter: {
    alignItems: 'center',
  },
  ringPercentage: {
    fontSize: 32,
    fontWeight: '700',
  },
  ringLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  progressText: {
    fontSize: 16,
  },
  habitsSection: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  addButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  habitCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  habitLeft: {
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
  habitIconCustom: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  streakBadge: {
    alignSelf: 'flex-start',
  },
  streakText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  checkButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  addHabitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  addHabitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
