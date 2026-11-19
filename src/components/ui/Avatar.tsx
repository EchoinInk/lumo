import { usePalette } from "@/theme/usePalette";
import { Radius, Shadows } from '@/theme/tokens';
import React from 'react';
import { Image, ImageProps, StyleSheet, View, ViewProps } from 'react-native';
import { Text } from './Text';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps extends ViewProps {
  source?: ImageProps['source'];
  size?: AvatarSize;
  initials?: string;
  alt?: string;
}

export function Avatar({ 
  source, 
  size = 'md', 
  initials, 
  alt = 'Avatar',
  className = '',
  style,
  ...props 
}: AvatarProps) {
  const palette = usePalette();

  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return { width: 24, height: 24, fontSize: 10 };
      case 'sm':
        return { width: 32, height: 32, fontSize: 12 };
      case 'lg':
        return { width: 48, height: 48, fontSize: 16 };
      case 'xl':
        return { width: 64, height: 64, fontSize: 20 };
      case '2xl':
        return { width: 96, height: 96, fontSize: 28 };
      default:
        return { width: 40, height: 40, fontSize: 14 };
    }
  };

  const sizeStyles = getSizeStyles();

  if (source) {
    return (
      <Image
        source={source}
        style={[
          styles.image,
          {
            width: sizeStyles.width,
            height: sizeStyles.height,
            borderRadius: Radius.full,
          },
        ]}
        accessibilityLabel={alt}
      />
    );
  }

  return (
    <View
      className={className}
      style={[
        styles.container,
        {
          width: sizeStyles.width,
          height: sizeStyles.height,
          borderRadius: Radius.full,
          backgroundColor: palette.secondary,
        },
        style,
      ]}
      {...props}
    >
      {initials && (
        <Text
          variant="body"
          color={palette.textInverse}
          style={[
            styles.initials,
            { fontSize: sizeStyles.fontSize },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  image: {
    shadowColor: Shadows.sm.shadowColor,
    shadowOffset: Shadows.sm.shadowOffset,
    shadowOpacity: Shadows.sm.shadowOpacity,
    shadowRadius: Shadows.sm.shadowRadius,
    elevation: Shadows.sm.elevation,
  },
  initials: {
    fontWeight: '600' as const,
  },
});
