
import React, { useState } from 'react';
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
import { colors } from '@/styles/commonStyles';
import { useHabits } from '@/contexts/HabitContext';
import { requestNotificationPermissions, cancelAllHabitNotifications } from '@/utils/notifications';

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  const { settings, updateSettings, resetAllData, habits } = useHabits();
  const [isResetting, setIsResetting] = useState(false);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await updateSettings({ notificationsEnabled: true });
      } else {
        Alert.alert(
          'Permission Denied',
          'Please enable notifications in your device settings to receive reminders.'
        );
      }
    } else {
      await cancelAllHabitNotifications();
      await updateSettings({ notificationsEnabled: false });
    }
  };

  const handleToggleDarkMode = async (value: boolean) => {
    await updateSettings({ darkMode: value });
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your habits and progress. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            await resetAllData();
            setIsResetting(false);
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        </View>

        {/* User Info */}
        {settings.name && (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.greeting, { color: theme.text }]}>
              Hello, {settings.name}! 👋
            </Text>
          </View>
        )}

        {/* Preferences */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>
                  Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Daily reminders for your habits
                </Text>
              </View>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: theme.highlight, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🌙</Text>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Use dark theme
                </Text>
              </View>
            </View>
            <Switch
              value={settings.darkMode || isDark}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: theme.highlight, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Stats</Text>
          
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total Habits
            </Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {habits.length}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total Completions
            </Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {habits.reduce((sum, h) => sum + h.completions.length, 0)}
            </Text>
          </View>
        </View>

        {/* Manage Habits */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Manage</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/manage-habits')}
          >
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={[styles.actionLabel, { color: theme.text }]}>
              Edit Habits
            </Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.error }]}>Danger Zone</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleResetData}
            disabled={isResetting}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={[styles.actionLabel, { color: theme.error }]}>
              {isResetting ? 'Resetting...' : 'Reset All Data'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Momentum v1.0
          </Text>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Made with ❤️ for building better habits
          </Text>
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
  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statLabel: {
    fontSize: 17,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionLabel: {
    fontSize: 17,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
