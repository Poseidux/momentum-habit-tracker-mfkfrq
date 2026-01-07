
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedGet, authenticatedPost, authenticatedDelete } from '@/utils/api';
import { router } from 'expo-router';

interface Group {
  id: string;
  name: string;
  inviteCode: string;
  members?: Member[];
  memberCount?: number;
  createdAt: string;
  creatorId?: string;
}

interface Member {
  id: string;
  userId: string;
  userName: string;
  name?: string;
  completedToday?: number;
  totalToday?: number;
  weeklyStreak?: number;
  joinedAt?: string;
}

interface TodayCompletion {
  userId: string;
  userName: string;
  habits: {
    habitName: string;
    completed: boolean;
  }[];
}

interface WeeklyCompletion {
  userId: string;
  userName: string;
  habits: {
    habitName: string;
    completedDays: number;
    totalDays: number;
  }[];
}

export default function SocialScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { user, loading: authLoading } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [groupDetailsLoading, setGroupDetailsLoading] = useState(false);
  const [todayCompletions, setTodayCompletions] = useState<TodayCompletion[]>([]);
  const [weeklyCompletions, setWeeklyCompletions] = useState<WeeklyCompletion[]>([]);

  // Fetch groups on mount
  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [authLoading, user]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      console.log('[Social] Fetching groups...');
      const data = await authenticatedGet<Group[]>('/api/groups');
      console.log('[Social] Groups fetched:', data);
      setGroups(data);
    } catch (error) {
      console.error('[Social] Error fetching groups:', error);
      Alert.alert('Error', 'Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async (groupId: string) => {
    try {
      setGroupDetailsLoading(true);
      console.log('[Social] Fetching group details for:', groupId);
      
      // Fetch group details with members
      const groupData = await authenticatedGet<Group>(`/api/groups/${groupId}`);
      console.log('[Social] Group details:', groupData);
      
      // Fetch today's completions
      const todayData = await authenticatedGet<TodayCompletion[]>(`/api/groups/${groupId}/completions/today`);
      console.log('[Social] Today completions:', todayData);
      setTodayCompletions(todayData);
      
      // Fetch weekly completions
      const weeklyData = await authenticatedGet<WeeklyCompletion[]>(`/api/groups/${groupId}/completions/weekly`);
      console.log('[Social] Weekly completions:', weeklyData);
      setWeeklyCompletions(weeklyData);
      
      setSelectedGroup(groupData);
    } catch (error) {
      console.error('[Social] Error fetching group details:', error);
      Alert.alert('Error', 'Failed to load group details. Please try again.');
    } finally {
      setGroupDetailsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading(true);
      
      console.log('[Social] Creating group:', groupName);
      const newGroup = await authenticatedPost<Group>('/api/groups', { name: groupName });
      console.log('[Social] Group created:', newGroup);

      setGroups([...groups, newGroup]);
      setGroupName('');
      setShowCreateGroup(false);

      Alert.alert(
        'Group Created!',
        `Share this invite code with friends:\n\n${newGroup.inviteCode}\n\nMax 10 members per group.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[Social] Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading(true);
      
      console.log('[Social] Joining group with code:', inviteCode);
      const result = await authenticatedPost<{ message: string; group: Group }>('/api/groups/join', { 
        inviteCode: inviteCode.trim().toUpperCase() 
      });
      console.log('[Social] Joined group:', result);

      Alert.alert('Success', result.message || 'Joined group successfully!');
      setInviteCode('');
      setShowJoinGroup(false);
      
      // Refresh groups list
      await fetchGroups();
    } catch (error) {
      console.error('[Social] Error joining group:', error);
      Alert.alert('Error', 'Failed to join group. Please check the invite code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = (groupId: string) => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setLoading(true);
              
              console.log('[Social] Leaving group:', groupId);
              const result = await authenticatedPost<{ message: string }>(`/api/groups/${groupId}/leave`, {});
              console.log('[Social] Left group:', result);
              
              setGroups(groups.filter(g => g.id !== groupId));
              setSelectedGroup(null);
              
              Alert.alert('Success', result.message || 'Left group successfully');
            } catch (error) {
              console.error('[Social] Error leaving group:', error);
              Alert.alert('Error', 'Failed to leave group. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (selectedGroup) {
    const memberCount = selectedGroup.members?.length || selectedGroup.memberCount || 0;
    
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: theme.background }]} 
        edges={['top']}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedGroup(null);
              setTodayCompletions([]);
              setWeeklyCompletions([]);
            }}
            style={styles.backButton}
          >
            <IconSymbol
              android_material_icon_name="arrow-back"
              ios_icon_name="chevron.left"
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>
            {selectedGroup.name}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {groupDetailsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading group details...
            </Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Invite Code Card */}
            <Animated.View 
              entering={FadeIn}
              style={[
                styles.card,
                { 
                  backgroundColor: theme.card,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                }
              ]}
            >
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Invite Code
              </Text>
              <Text style={[styles.inviteCodeText, { color: theme.primary }]}>
                {selectedGroup.inviteCode}
              </Text>
              <Text style={[styles.caption, { color: theme.textSecondary }]}>
                Share this code to invite friends ({memberCount}/10 members)
              </Text>
            </Animated.View>

            {/* Members List */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Members
            </Text>

            {selectedGroup.members && selectedGroup.members.length > 0 ? (
              selectedGroup.members.map((member, index) => {
                // Find today's completions for this member
                const memberToday = todayCompletions.find(c => c.userId === member.userId);
                const completedToday = memberToday?.habits.filter(h => h.completed).length || 0;
                const totalToday = memberToday?.habits.length || 0;
                
                // Find weekly completions for this member
                const memberWeekly = weeklyCompletions.find(c => c.userId === member.userId);
                const weeklyStreak = memberWeekly?.habits.reduce((sum, h) => sum + h.completedDays, 0) || 0;
                
                return (
                  <Animated.View
                    key={member.id}
                    entering={FadeInDown.delay(index * 50)}
                    style={[
                      styles.memberCard,
                      {
                        backgroundColor: theme.card,
                        borderWidth: 1,
                        borderColor: theme.cardBorder,
                      }
                    ]}
                  >
                    <View style={styles.memberInfo}>
                      <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
                        <IconSymbol
                          android_material_icon_name="person"
                          ios_icon_name="person"
                          size={24}
                          color={theme.primary}
                        />
                      </View>
                      <View style={styles.memberDetails}>
                        <Text style={[styles.memberName, { color: theme.text }]}>
                          {member.userName || member.name || 'Unknown'}
                        </Text>
                        <Text style={[styles.memberStats, { color: theme.textSecondary }]}>
                          Today: {completedToday}/{totalToday} • Week: {weeklyStreak} completed
                        </Text>
                      </View>
                    </View>
                  </Animated.View>
                );
              })
            ) : (
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                No members yet
              </Text>
            )}

            {/* Leave Group Button */}
            <TouchableOpacity
              style={[
                styles.buttonSecondary,
                {
                  borderColor: colors.light.error,
                  marginTop: 32,
                }
              ]}
              onPress={() => handleLeaveGroup(selectedGroup.id)}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: colors.light.error }]}>
                {loading ? 'Leaving...' : 'Leave Group'}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: theme.background }]} 
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Redirect to auth handled in useEffect
  if (!user) {
    return null;
  }

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
        <Animated.View entering={FadeIn} style={styles.headerSection}>
          <Text style={[styles.title, { color: theme.text }]}>Social</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Stay accountable with friends
          </Text>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.buttonPrimary,
              { backgroundColor: theme.primary, opacity: loading ? 0.6 : 1 }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCreateGroup(true);
            }}
            disabled={loading}
          >
            <IconSymbol
              android_material_icon_name="add"
              ios_icon_name="plus"
              size={20}
              color="#FFFFFF"
            />
            <Text style={[styles.buttonText, { color: '#FFFFFF', marginLeft: 8 }]}>
              Create Group
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.buttonSecondary,
              {
                borderColor: theme.border,
                backgroundColor: theme.card,
                opacity: loading ? 0.6 : 1,
              }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowJoinGroup(true);
            }}
            disabled={loading}
          >
            <IconSymbol
              android_material_icon_name="group-add"
              ios_icon_name="person.badge.plus"
              size={20}
              color={theme.text}
            />
            <Text style={[styles.buttonText, { color: theme.text, marginLeft: 8 }]}>
              Join Group
            </Text>
          </TouchableOpacity>
        </View>

        {/* Create Group Form */}
        {showCreateGroup && (
          <Animated.View 
            entering={FadeInDown}
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Create New Group
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              placeholder="Group name"
              placeholderTextColor={theme.textSecondary}
              value={groupName}
              onChangeText={setGroupName}
              maxLength={30}
            />
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[
                  styles.formButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: loading ? 0.6 : 1,
                  }
                ]}
                onPress={handleCreateGroup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                    Create
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.formButton,
                  {
                    backgroundColor: theme.highlight,
                  }
                ]}
                onPress={() => {
                  setShowCreateGroup(false);
                  setGroupName('');
                }}
                disabled={loading}
              >
                <Text style={[styles.buttonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Join Group Form */}
        {showJoinGroup && (
          <Animated.View 
            entering={FadeInDown}
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Join Group
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              placeholder="Enter invite code"
              placeholderTextColor={theme.textSecondary}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              maxLength={6}
            />
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[
                  styles.formButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: loading ? 0.6 : 1,
                  }
                ]}
                onPress={handleJoinGroup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                    Join
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.formButton,
                  {
                    backgroundColor: theme.highlight,
                  }
                ]}
                onPress={() => {
                  setShowJoinGroup(false);
                  setInviteCode('');
                }}
                disabled={loading}
              >
                <Text style={[styles.buttonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Groups List */}
        {loading && groups.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading groups...
            </Text>
          </View>
        ) : groups.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Your Groups
            </Text>

            {groups.map((group, index) => {
              const memberCount = group.members?.length || group.memberCount || 0;
              return (
                <Animated.View
                  key={group.id}
                  entering={FadeInDown.delay(index * 50)}
                >
                  <TouchableOpacity
                    style={[
                      styles.groupCard,
                      {
                        backgroundColor: theme.card,
                        borderWidth: 1,
                        borderColor: theme.cardBorder,
                      }
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      fetchGroupDetails(group.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.groupInfo}>
                      <View style={[styles.groupIcon, { backgroundColor: theme.primary + '20' }]}>
                        <IconSymbol
                          android_material_icon_name="group"
                          ios_icon_name="person.3"
                          size={24}
                          color={theme.primary}
                        />
                      </View>
                      <View style={styles.groupDetails}>
                        <Text style={[styles.groupName, { color: theme.text }]}>
                          {group.name}
                        </Text>
                        <Text style={[styles.groupMembers, { color: theme.textSecondary }]}>
                          {memberCount} {memberCount === 1 ? 'member' : 'members'}
                        </Text>
                      </View>
                    </View>
                    <IconSymbol
                      android_material_icon_name="chevron-right"
                      ios_icon_name="chevron.right"
                      size={24}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </>
        ) : null}

        {groups.length === 0 && !showCreateGroup && !showJoinGroup && (
          <Animated.View entering={FadeIn.delay(200)} style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.highlight }]}>
              <IconSymbol
                android_material_icon_name="group"
                ios_icon_name="person.3"
                size={48}
                color={theme.textSecondary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No groups yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Create a group or join one with an invite code to start tracking habits together
            </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    marginBottom: 28,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 32,
    marginBottom: 16,
  },
  actionButtons: {
    gap: 12,
  },
  buttonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 52,
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
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  buttonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 52,
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginTop: 16,
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
    marginBottom: 16,
  },
  input: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 17,
    borderWidth: 1,
    marginBottom: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteCodeText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  caption: {
    fontSize: 14,
    textAlign: 'center',
  },
  groupCard: {
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
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  groupMembers: {
    fontSize: 14,
  },
  memberCard: {
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
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberStats: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
