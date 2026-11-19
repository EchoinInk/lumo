import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';

import { usePalette } from "@/theme/usePalette";

export default function AppTabs() {
  const palette = usePalette();



  return (
    <NativeTabs
      backgroundColor={palette.background}
      indicatorColor={palette.taskPanel}
      labelStyle={{ selected: { color: palette.textPrimary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
