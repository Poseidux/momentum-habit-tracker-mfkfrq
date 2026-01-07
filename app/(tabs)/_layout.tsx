
import React from 'react';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Today',
    },
    {
      name: 'progress',
      route: '/(tabs)/progress',
      icon: 'show-chart',
      label: 'Progress',
    },
    {
      name: 'settings',
      route: '/(tabs)/settings',
      icon: 'settings',
      label: 'Settings',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="(home)" />
        <Stack.Screen name="progress" />
        <Stack.Screen name="settings" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
