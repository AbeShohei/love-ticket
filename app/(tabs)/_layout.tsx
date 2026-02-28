import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#fd297b',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { borderTopColor: '#eee', backgroundColor: '#fff' },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tabs.catalog'),
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.dateIdeas'),
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: t('tabs.tickets'),
          tabBarIcon: ({ color, size }) => <Ionicons name="ticket-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: t('tabs.schedule'),
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.myPage'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

function NativeTabLayout() {
  const { t } = useTranslation();

  return (
    <NativeTabs
      scrollEdgeAppearance="transparent"
      blurEffect="systemUltraThinMaterial"
      tintColor="#fd297b"
    >
      <NativeTabs.Trigger name="explore">
        <Icon src={<VectorIcon family={Ionicons} name="add-circle-outline" />} />
        <Label>{t('tabs.catalog')}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="index">
        <Icon src={<VectorIcon family={Ionicons} name="heart-outline" />} />
        <Label>{t('tabs.dateIdeas')}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="matches">
        <Icon src={<VectorIcon family={Ionicons} name="ticket-outline" />} />
        <Label>{t('tabs.tickets')}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="schedule">
        <Icon src={<VectorIcon family={Ionicons} name="calendar-outline" />} />
        <Label>{t('tabs.schedule')}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon src={<VectorIcon family={Ionicons} name="person-circle-outline" />} />
        <Label>{t('tabs.myPage')}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default function TabLayout() {
  return isWeb ? <WebTabLayout /> : <NativeTabLayout />;
}
