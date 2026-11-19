import { createThemedValue } from "@/theme/usePalette";
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ListSeparatorProps {
  height?: number;
}

export function ListSeparator({ height = 1 }: ListSeparatorProps) {
  const styles = useStyles();

  return <View style={[styles.separator, { height }]} />;
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  separator: {
    backgroundColor: palette.border,
    marginHorizontal: 16,
  },
}));
