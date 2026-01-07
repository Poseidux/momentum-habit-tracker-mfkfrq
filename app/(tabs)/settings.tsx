
import { useHabits } from '@/contexts/HabitContext';
import { requestNotificationPermissions, cancelAllHabitNotifications } from '@/utils/notifications';
import React, { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
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
import { IconSymbol } from '@/components/IconSymbol';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { settings, updateSettings, resetAllData } = useHabits();
  const [isResetting, setIsResetting] = useState(false);

  const handleToggleNotifications = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (value) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await updateSettings({ notificationsEnabled: true });
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive habit reminders.'
        );
      }
    } else {
      await updateSettings({ notificationsEnabled: false });
      await cancelAllHabitNotifications();
    }
  };

  const handleToggleDarkMode = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateSettings({ darkMode: value });
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your habits and progress. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await resetAllData();
            setIsResetting(false);
            router.replace('/onboarding');
          },
        },
      ]
    );
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
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Customize your experience
          </Text>
        </Animated.View>

        {/* Preferences Section */}
        <Animated.View entering={FadeIn.delay(100)}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Preferences
          </Text>

          <View 
            style={[
              styles.settingsCard,
              {
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }
            ]}
          >
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                  <IconSymbol
                    android_material_icon_name="notifications"
                    ios_icon_name="bell"
                    size={22}
                    color={theme.primary}
                  />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>
                    Notifications
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Receive habit reminders
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: theme.border, true: theme.primary + '60' }}
                thumbColor={settings.notificationsEnabled ? theme.primary : '#f4f3f4'}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                  <IconSymbol
                    android_material_icon_name={isDark ? 'dark-mode' : 'light-mode'}
                    ios_icon_name={isDark ? 'moon' : 'sun.max'}
                    size={22}
                    color={theme.primary}
                  />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>
                    Dark Mode
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Use dark theme
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.darkMode}
                onValueChange={handleToggleDarkMode}
                trackColor={{ false: theme.border, true: theme.primary + '60' }}
                thumbColor={settings.darkMode ? theme.primary : '#f4f3f4'}
              />
            </View>
          </View>
        </Animated.View>

        {/* Manage Section */}
        <Animated.View entering={FadeIn.delay(200)}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Manage
          </Text>

          <TouchableOpacity
            style={[
              styles.actionCard,
              {
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/manage-habits');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.actionInfo}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                <IconSymbol
                  android_material_icon_name="edit"
                  ios_icon_name="pencil"
                  size={22}
                  color={theme.primary}
                />
              </View>
              <View style={styles.actionText}>
                <Text style={[styles.actionLabel, { color: theme.text }]}>
                  Manage Habits
                </Text>
                <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>
                  Edit or delete your habits
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

        {/* Danger Zone */}
        <Animated.View entering={FadeIn.delay(300)}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Danger Zone
          </Text>

          <TouchableOpacity
            style={[
              styles.dangerCard,
              {
                backgroundColor: theme.card,
                borderWidth: 1.5,
                borderColor: colors.light.error + '40',
              }
            ]}
            onPress={handleResetData}
            disabled={isResetting}
            activeOpacity={0.7}
          >
            <View style={styles.actionInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.light.error + '15' }]}>
                <IconSymbol
                  android_material_icon_name="delete"
                  ios_icon_name="trash"
                  size={22}
                  color={colors.light.error}
                />
              </View>
              <View style={styles.actionText}>
                <Text style={[styles.actionLabel, { color: colors.light.error }]}>
                  Reset All Data
                </Text>
                <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>
                  Permanently delete all habits
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* App Info */}
        <Animated.View entering={FadeIn.delay(400)} style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: theme.textSecondary }]}>
            Momentum v1.0.0
          </Text>
          <Text style={[styles.appInfoText, { color: theme.textTertiary }]}>
            Built with ❤️ for better habits
          </Text>
        </Animated.View>

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
  settingsCard: {
    borderRadius: 16,
    overflow: 'hidden',
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginLeft: 76,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
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
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
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
  actionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 48,
    gap: 4,
  },
  appInfoText: {
    fontSize: 14,
  },
});
