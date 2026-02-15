import Ionicons from '@expo/vector-icons/Ionicons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import React from 'react';

import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon src={<VectorIcon family={Ionicons} name="flame" />} />
        <Label>Discovery</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <Icon src={<VectorIcon family={Ionicons} name="grid" />} />
        <Label>Explore</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="schedule">
        <Icon src={<VectorIcon family={Ionicons} name="calendar" />} />
        <Label>Schedule</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="matches">
        <Icon src={<VectorIcon family={Ionicons} name="chatbubbles" />} />
        <Label>Matches</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon src={<VectorIcon family={Ionicons} name="person" />} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
