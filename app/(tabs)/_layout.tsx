import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Platform } from 'react-native';


// Web uses standard Tabs, native uses NativeTabs
const isWeb = Platform.OS === 'web';

// Conditionally import NativeTabs (native-only)
let NativeTabs: any, Icon: any, Label: any, VectorIcon: any;
if (!isWeb) {
  const nativeTabs = require('expo-router/unstable-native-tabs');
  NativeTabs = nativeTabs.NativeTabs;
  Icon = nativeTabs.Icon;
  Label = nativeTabs.Label;
  VectorIcon = nativeTabs.VectorIcon;
}

// Web-compatible Tabs
import { Tabs } from 'expo-router';

function WebTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#fd297b',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { borderTopColor: '#eee' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'デート案',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'カタログ',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'スケジュール',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'チケット',
          tabBarIcon: ({ color, size }) => <Ionicons name="ticket-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'マイページ',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

function NativeTabLayout() {
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
        <Label>スケジュール</Label>
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

export default function TabLayout() {
  return isWeb ? <WebTabLayout /> : <NativeTabLayout />;
}

