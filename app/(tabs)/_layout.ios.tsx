
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger key="today" name="(home)">
        <Icon sf="checkmark.circle.fill" />
        <Label>Today</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="progress" name="progress">
        <Icon sf="chart.bar.fill" />
        <Label>Progress</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="social" name="social">
        <Icon sf="person.3.fill" />
        <Label>Social</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="settings" name="settings">
        <Icon sf="gearshape.fill" />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
