import Ionicons from '@expo/vector-icons/Ionicons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import React from 'react';

import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon src={<VectorIcon family={Ionicons} name="heart-outline" />} />
        <Label>デート案</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <Icon src={<VectorIcon family={Ionicons} name="add-circle-outline" />} />
        <Label>カタログ</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="schedule">
        <Icon src={<VectorIcon family={Ionicons} name="calendar-outline" />} />
        <Label>予定</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="matches">
        <Icon src={<VectorIcon family={Ionicons} name="ticket-outline" />} />
        <Label>チケット</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon src={<VectorIcon family={Ionicons} name="person-circle-outline" />} />
        <Label>マイページ</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
