
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  useColorScheme,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { IconSymbol } from '@/components/IconSymbol';
import { useHabits } from '@/contexts/HabitContext';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { requestNotificationPermissions, cancelAllHabitNotifications } from '@/utils/notifications';

export default function SettingsScreen() {
  const { settings, updateSettings, habits } = useHabits();
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;
  const [localNotificationsEnabled, setLocalNotificationsEnabled] = useState(settings.notificationsEnabled);

  useEffect(() => {
    setLocalNotificationsEnabled(settings.notificationsEnabled);
  }, [settings.notificationsEnabled]);

  async function handleToggleNotifications(value: boolean) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (value) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        setLocalNotificationsEnabled(true);
        await updateSettings({ notificationsEnabled: true });
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive habit reminders.',
          [{ text: 'OK' }]
        );
      }
    } else {
      setLocalNotificationsEnabled(false);
      await updateSettings({ notificationsEnabled: false });
      await cancelAllHabitNotifications();
    }
  }

  function handleResetData() {
    Alert.alert(
      'Reset All Data',
      'This will delete all your habits and progress. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await updateSettings({ hasCompletedOnboarding: false });
            router.replace('/onboarding');
          },
        },
      ]
    );
  }

  async function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            Alert.alert('Signed Out', 'You have been signed out successfully.');
          },
        },
      ]
    );
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
          <Text style={[styles.title, { color: theme.text }]}>
            Settings
          </Text>
        </Animated.View>

        {/* User Info */}
        {user && (
          <Animated.View 
            entering={FadeInDown.delay(200).duration(600)} 
            style={[styles.userCard, { backgroundColor: theme.card }]}
          >
            <View style={[styles.userAvatar, { backgroundColor: theme.primary + '20' }]}>
              <Text style={{ fontSize: 24 }}>👤</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.text }]}>
                {user.name || 'User'}
              </Text>
              <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
                {user.email}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Settings Sections */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            PREFERENCES
          </Text>
          
          <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <IconSymbol
                  ios_icon_name="bell.fill"
                  android_material_icon_name="notifications"
                  size={24}
                  color={theme.text}
                />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    Notifications
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Receive habit reminders
                  </Text>
                </View>
              </View>
              <Switch
                value={localNotificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: theme.border, true: theme.primary + '60' }}
                thumbColor={localNotificationsEnabled ? theme.primary : '#f4f3f4'}
              />
            </View>
          </View>
        </Animated.View>

        {/* Account Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            ACCOUNT
          </Text>
          
          <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
            {!user ? (
              <TouchableOpacity
                onPress={() => router.push('/auth')}
                style={styles.settingRow}
              >
                <View style={styles.settingLeft}>
                  <IconSymbol
                    ios_icon_name="person.circle"
                    android_material_icon_name="account-circle"
                    size={24}
                    color={theme.text}
                  />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: theme.text }]}>
                      Sign In
                    </Text>
                    <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                      Sync across devices
                    </Text>
                  </View>
                </View>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron-right"
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSignOut}
                style={styles.settingRow}
              >
                <View style={styles.settingLeft}>
                  <IconSymbol
                    ios_icon_name="arrow.right.square"
                    android_material_icon_name="logout"
                    size={24}
                    color={theme.error}
                  />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: theme.error }]}>
                      Sign Out
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Data Section */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            DATA
          </Text>
          
          <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
            <TouchableOpacity
              onPress={handleResetData}
              style={styles.settingRow}
            >
              <View style={styles.settingLeft}>
                <IconSymbol
                  ios_icon_name="trash"
                  android_material_icon_name="delete"
                  size={24}
                  color={theme.error}
                />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.error }]}>
                    Reset All Data
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Delete all habits and progress
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* App Info */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: theme.textSecondary }]}>
            Momentum v1.0.0
          </Text>
          <Text style={[styles.appInfoText, { color: theme.textSecondary }]}>
            Build better habits, one day at a time
          </Text>
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
  },
  settingCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appInfoText: {
    fontSize: 12,
    marginBottom: 4,
  },
});
