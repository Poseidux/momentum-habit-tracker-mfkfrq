
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { authenticatedGet, authenticatedPost, authenticatedDelete } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
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
import { IconSymbol } from '@/components/IconSymbol';
import React, { useState, useEffect } from 'react';

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

// Marketing/Preview Screen for Non-Authenticated Users
function SocialMarketingScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  const features = [
    {
      icon: 'group-add',
      title: 'Create Habit Groups',
      description: 'Start groups with up to 10 friends or family members',
    },
    {
      icon: 'trending-up',
      title: 'Track Together',
      description: 'See each other\'s progress and stay motivated',
    },
    {
      icon: 'emoji-events',
      title: 'Leaderboards',
      description: 'Friendly competition with weekly rankings',
    },
    {
      icon: 'notifications-active',
      title: 'Stay Accountable',
      description: 'Get notified when friends complete their habits',
    },
    {
      icon: 'insights',
      title: 'Group Analytics',
      description: 'View collective progress and celebrate wins together',
    },
    {
      icon: 'lock',
      title: 'Privacy First',
      description: 'Your data stays private - only share what you want',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.marketingContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn} style={styles.marketingHeader}>
          <View style={[styles.marketingBadge, { backgroundColor: theme.primary + '20' }]}>
            <IconSymbol
              android_material_icon_name="group"
              ios_icon_name="person.3.fill"
              size={40}
              color={theme.primary}
            />
          </View>
          <Text style={[styles.marketingTitle, { color: theme.text }]}>
            Social Habits
          </Text>
          <Text style={[styles.marketingSubtitle, { color: theme.textSecondary }]}>
            Build better habits together with friends and family
          </Text>
        </Animated.View>

        {/* Features */}
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.delay(index * 80).duration(400)}
              style={[
                styles.featureCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: theme.primary + '15' }]}>
                <IconSymbol
                  android_material_icon_name={feature.icon}
                  ios_icon_name={feature.icon}
                  size={28}
                  color={theme.primary}
                />
              </View>
              <Text style={[styles.featureTitle, { color: theme.text }]}>
                {feature.title}
              </Text>
              <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                {feature.description}
              </Text>
            </Animated.View>
          ))}
        </View>

        {/* CTA */}
        <Animated.View entering={FadeIn.delay(600)} style={styles.ctaContainer}>
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/auth');
            }}
          >
            <Text style={styles.ctaButtonText}>Create Account to Get Started</Text>
          </TouchableOpacity>
          <Text style={[styles.ctaDisclaimer, { color: theme.textSecondary }]}>
            Social features require an account for privacy and security
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Main Social Screen Component
export default function SocialScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { user, loading: authLoading } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchGroups();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  // Show marketing screen if user is not authenticated
  if (!authLoading && !user) {
    return <SocialMarketingScreen />;
  }

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await authenticatedGet<Group[]>('/api/groups');
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
      const data = await authenticatedGet<Group>(`/api/groups/${groupId}`);
      setSelectedGroup(data);
    } catch (error) {
      console.error('[Social] Error fetching group details:', error);
      Alert.alert('Error', 'Failed to load group details.');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await authenticatedPost('/api/groups', { name: groupName.trim() });
      setGroupName('');
      setShowCreateModal(false);
      await fetchGroups();
      Alert.alert('Success', 'Group created successfully!');
    } catch (error: any) {
      console.error('[Social] Error creating group:', error);
      Alert.alert('Error', error.message || 'Failed to create group');
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await authenticatedPost(`/api/groups/join/${inviteCode.trim()}`);
      setInviteCode('');
      setShowJoinModal(false);
      await fetchGroups();
      Alert.alert('Success', 'Joined group successfully!');
    } catch (error: any) {
      console.error('[Social] Error joining group:', error);
      Alert.alert('Error', error.message || 'Failed to join group');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
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
              await authenticatedDelete(`/api/groups/${groupId}/leave`);
              await fetchGroups();
              setSelectedGroup(null);
              Alert.alert('Success', 'Left group successfully');
            } catch (error: any) {
              console.error('[Social] Error leaving group:', error);
              Alert.alert('Error', error.message || 'Failed to leave group');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Social</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowJoinModal(true);
            }}
          >
            <IconSymbol
              android_material_icon_name="group-add"
              ios_icon_name="person.badge.plus"
              size={20}
              color={theme.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCreateModal(true);
            }}
          >
            <IconSymbol
              android_material_icon_name="add"
              ios_icon_name="plus"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groups.length === 0 ? (
          <Animated.View entering={FadeIn} style={styles.emptyState}>
            <IconSymbol
              android_material_icon_name="group"
              ios_icon_name="person.3"
              size={64}
              color={theme.textTertiary}
            />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No Groups Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Create a group or join one with an invite code
            </Text>
          </Animated.View>
        ) : (
          <View style={styles.groupsList}>
            {groups.map((group, index) => (
              <Animated.View
                key={group.id}
                entering={FadeInDown.delay(index * 80).duration(400)}
              >
                <TouchableOpacity
                  style={[
                    styles.groupCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    fetchGroupDetails(group.id);
                  }}
                >
                  <View style={styles.groupHeader}>
                    <View style={[styles.groupIcon, { backgroundColor: theme.primary + '15' }]}>
                      <IconSymbol
                        android_material_icon_name="group"
                        ios_icon_name="person.3.fill"
                        size={24}
                        color={theme.primary}
                      />
                    </View>
                    <View style={styles.groupInfo}>
                      <Text style={[styles.groupName, { color: theme.text }]}>
                        {group.name}
                      </Text>
                      <Text style={[styles.groupMeta, { color: theme.textSecondary }]}>
                        {group.memberCount || 0} members • Code: {group.inviteCode}
                      </Text>
                    </View>
                    <IconSymbol
                      android_material_icon_name="chevron-right"
                      ios_icon_name="chevron.right"
                      size={20}
                      color={theme.textSecondary}
                    />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Extra padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Group Modal */}
      {showCreateModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Create Group</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Group name"
              placeholderTextColor={theme.textSecondary}
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.background }]}
                onPress={() => {
                  setShowCreateModal(false);
                  setGroupName('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={handleCreateGroup}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Join Group</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Invite code"
              placeholderTextColor={theme.textSecondary}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              maxLength={8}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.background }]}
                onPress={() => {
                  setShowJoinModal(false);
                  setInviteCode('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={handleJoinGroup}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  marketingContent: {
    padding: 20,
    paddingBottom: 100,
  },
  marketingHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  marketingBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  marketingTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  marketingSubtitle: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresGrid: {
    gap: 16,
    marginBottom: 40,
  },
  featureCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 15,
    lineHeight: 21,
  },
  ctaContainer: {
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  ctaDisclaimer: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  groupsList: {
    gap: 12,
  },
  groupCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupMeta: {
    fontSize: 14,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 17,
    borderWidth: 1,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
