
import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol 
              ios_icon_name="checkmark.circle" 
              android_material_icon_name="check-circle"
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol 
              ios_icon_name="chart.bar" 
              android_material_icon_name="bar-chart"
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol 
              ios_icon_name="person.2" 
              android_material_icon_name="group"
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol 
              ios_icon_name="gearshape" 
              android_material_icon_name="settings"
              size={size} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
