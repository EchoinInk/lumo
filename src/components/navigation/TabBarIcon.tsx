import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createThemedValue } from "@/theme/usePalette";
import { Spacing } from '@/theme/tokens';

interface TabBarIconProps {
  focused: boolean;
  children: React.ReactNode;
}

export function TabBarIcon({ focused, children }: TabBarIconProps) {
  const styles = useStyles();

  return (
    <View style={[styles.container, focused && styles.containerFocused]}>
      <View style={[styles.iconWrapper, focused && styles.iconWrapperFocused]}>
        {children}
      </View>
    </View>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  containerFocused: {
    opacity: 1,
  },
  iconWrapper: {
    padding: Spacing.sm,
    borderRadius: 12,
  },
  iconWrapperFocused: {
    backgroundColor: palette.cardGlass,
  },
}));
