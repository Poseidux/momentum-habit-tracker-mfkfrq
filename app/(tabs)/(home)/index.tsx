
import { useHabits } from '@/contexts/HabitContext';
import React, { useState, useEffect } from 'react';
import {
  getTodayString,
  isHabitScheduledForDate,
  toggleHabitCompletion,
  calculateStreak,
} from '@/utils/habitUtils';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, withSpring, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
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
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedGet, authenticatedPost } from '@/utils/api';

// Futuristic Completion Ring Component
function FuturisticCompletionRing({ progress, size = 120 }: { progress: number; size?: number }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (progress === 100) {
      scale.value = withSequence(
        withSpring(1.1, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
      rotation.value = withTiming(360, { duration: 800 });
    }
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const radius = (size - 12) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Animated.View style={[styles.completionRingContainer, animatedStyle]}>
      {/* Outer glow effect */}
      {progress === 100 && (
        <View style={[styles.glowOuter, { width: size + 20, height: size + 20 }]}>
          <LinearGradient
            colors={[theme.primary + '40', theme.primary + '00']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />
        </View>
      )}
      
      {/* Main ring container */}
      <View style={[styles.ringContent, { width: size, height: size }]}>
        {/* Background ring */}
        <View style={[styles.backgroundRing, { width: size, height: size, borderRadius: size / 2, borderColor: theme.border }]} />
        
        {/* Progress ring with gradient */}
        <View style={[styles.progressRing, { width: size, height: size }]}>
          <svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.primary}
              strokeWidth={12}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                filter: progress === 100 ? `drop-shadow(0 0 8px ${theme.primary})` : 'none',
              }}
            />
          </svg>
        </View>

        {/* Center content */}
        <View style={styles.centerContent}>
          {progress === 100 ? (
            <>
              <IconSymbol
                android_material_icon_name="check-circle"
                ios_icon_name="checkmark.circle.fill"
                size={36}
                color={theme.primary}
              />
              <Text style={[styles.completionText, { color: theme.primary }]}>
                Perfect!
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.progressNumber, { color: theme.text }]}>
                {Math.round(progress)}%
              </Text>
              <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                Complete
              </Text>
            </>
          )}
        </View>
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
  const [today] = useState(getTodayString());
  const [userGroups, setUserGroups] = useState<any[]>([]);

  const todayHabits = habits.filter((h) => isHabitScheduledForDate(h, new Date()));
  const completedCount = todayHabits.filter((h) => h.completions?.includes(today)).length;
  const totalCount = todayHabits.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Fetch user's groups to sync completions
  useEffect(() => {
    if (user) {
      fetchUserGroups();
    }
  }, [user]);

  const fetchUserGroups = async () => {
    try {
      const groups = await authenticatedGet<any[]>('/api/groups');
      setUserGroups(groups);
    } catch (error) {
      console.error('[Home] Error fetching groups:', error);
      // Silently fail - groups are optional
    }
  };

  const syncCompletionToGroups = async (habitName: string, completed: boolean) => {
    // Sync completion to all groups the user is in
    for (const group of userGroups) {
      try {
        await authenticatedPost(`/api/groups/${group.id}/completions`, {
          habitName,
          completed,
          date: today,
        });
        console.log(`[Home] Synced ${habitName} completion to group ${group.name}`);
      } catch (error) {
        console.error(`[Home] Error syncing to group ${group.name}:`, error);
        // Continue with other groups even if one fails
      }
    }
  };

  const handleToggleCompletion = async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = toggleHabitCompletion(habit, today);
    updateHabit(updated);

    // Sync to backend groups if user is authenticated
    if (user && userGroups.length > 0) {
      const isCompleted = updated.completions?.includes(today);
      await syncCompletionToGroups(habit.name, isCompleted || false);
    }
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
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {formatDate(new Date())}
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>Today</Text>
        </Animated.View>

        {totalCount > 0 && (
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
            <View style={styles.summaryContent}>
              <View style={styles.summaryText}>
                <Text style={[styles.summaryTitle, { color: theme.text }]}>
                  <Text style={{ fontWeight: '700', fontSize: 24 }}>{completedCount}</Text>
                  <Text style={{ color: theme.textSecondary }}> of </Text>
                  <Text style={{ fontWeight: '700', fontSize: 24 }}>{totalCount}</Text>
                </Text>
                <Text style={[styles.summarySubtitle, { color: theme.textSecondary }]}>
                  {progress === 100 ? "Perfect day! 🎉" : "habits completed"}
                </Text>
              </View>
              <FuturisticCompletionRing progress={progress} size={90} />
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
                      borderColor: isCompleted ? habit.color : theme.cardBorder,
                      borderWidth: isCompleted ? 2 : 1,
                    }
                  ]}
                  onPress={() => handleToggleCompletion(habit.id)}
                  onLongPress={() => handleEditHabit(habit.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.habitHeader}>
                    <View style={styles.habitInfo}>
                      <View style={[styles.iconCircle, { backgroundColor: habit.color + '15' }]}>
                        {habit.customIconUri ? (
                          <Image source={{ uri: habit.customIconUri }} style={styles.customIcon} />
                        ) : (
                          <Text style={styles.icon}>{habit.icon}</Text>
                        )}
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
                          backgroundColor: isCompleted ? habit.color : theme.highlight,
                          borderWidth: isCompleted ? 0 : 1.5,
                          borderColor: theme.border,
                        }
                      ]}
                    >
                      {isCompleted && (
                        <IconSymbol
                          android_material_icon_name="check"
                          ios_icon_name="checkmark"
                          size={20}
                          color="#FFFFFF"
                        />
                      )}
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
              Tap the + button below to add your first habit
            </Text>
          </Animated.View>
        )}

        {/* Extra padding for floating button */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Add Button with Circular Ring */}
      <View style={styles.fabContainer}>
        <View style={[styles.fabRing, { borderColor: theme.primary + '30' }]} />
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/add-habit');
          }}
          activeOpacity={0.8}
        >
          <IconSymbol
            android_material_icon_name="add"
            ios_icon_name="plus"
            size={32}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
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
    paddingBottom: 20,
  },
  header: {
    marginBottom: 24,
  },
  date: {
    fontSize: 15,
    marginBottom: 4,
    fontWeight: '500',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  summaryCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 28,
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
  completionRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    borderRadius: 999,
  },
  ringContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundRing: {
    position: 'absolute',
    borderWidth: 12,
  },
  progressRing: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  progressLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  completionText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  habitsList: {
    gap: 12,
  },
  habitCard: {
    padding: 20,
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
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  icon: {
    fontSize: 26,
  },
  customIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  habitText: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  streak: {
    fontSize: 14,
    marginTop: 2,
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
});
