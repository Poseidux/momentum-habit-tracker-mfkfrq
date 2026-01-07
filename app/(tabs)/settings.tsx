
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
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/IconSymbol';
import { requestNotificationPermissions, cancelAllHabitNotifications } from '@/utils/notifications';
import { colors } from '@/styles/commonStyles';
import React, { useState, useEffect } from 'react';
import { useHabits } from '@/contexts/HabitContext';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { settings, updateSettings, resetAll } = useHabits();
  const { user, signOut } = useAuth();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);

  useEffect(() => {
    setNotificationsEnabled(settings.notificationsEnabled);
  }, [settings.notificationsEnabled]);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('Permission Denied', 'Please enable notifications in Settings');
        return;
      }
    } else {
      await cancelAllHabitNotifications();
    }
    
    setNotificationsEnabled(value);
    await updateSettings({ notificationsEnabled: value });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your habits and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetAll();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Animated.View entering={FadeIn} style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {user && (
          <Animated.View entering={FadeInDown.delay(100)} style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
            <View style={styles.accountInfo}>
              <IconSymbol ios_icon_name="person.circle.fill" android_material_icon_name="account-circle" size={48} color={theme.accent} />
              <View style={styles.accountText}>
                <Text style={[styles.accountName, { color: theme.text }]}>{user.name || 'User'}</Text>
                <Text style={[styles.accountEmail, { color: theme.textSecondary }]}>{user.email}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.border }]}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(200)} style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="bell.fill" android_material_icon_name="notifications" size={20} color={theme.text} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
              ios_backgroundColor={theme.border}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/manage-habits')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="list.bullet" android_material_icon_name="list" size={20} color={theme.text} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Manage Habits</Text>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Data</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleResetData}
            activeOpacity={0.7}
          >
            <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={18} color="#fff" />
            <Text style={styles.dangerButtonText}>Reset All Data</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>Momentum v1.0.0</Text>
        </View>
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
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
    opacity: 0.6,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  accountText: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    gap: 8,
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 13,
  },
});
