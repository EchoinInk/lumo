import { brandFont } from "@/theme/brandFonts";
import { usePalette } from "@/theme/usePalette";
import { Typography } from '@/theme/tokens';
import React from 'react';
import { Text as RNText, StyleSheet, TextProps } from 'react-native';

type TextVariant = 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'bodyLarge' | 'caption' | 'small' | 'label';

interface TextPropsExtended extends TextProps {
  variant?: TextVariant;
  color?: string;
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export function Text({ 
  variant = 'body', 
  color,
  textAlign = 'left',
  className = '',
  children, 
  style,
  ...props 
}: TextPropsExtended) {
  const palette = usePalette();

  const typographyStyle = Typography[variant] || Typography.body;

  const caller = StyleSheet.flatten(style);
  const display = ["display", "title", "heading", "subheading"].includes(variant);
  const weight = caller?.fontWeight ?? typographyStyle.fontWeight;
  return (
    <RNText
      className={className}
      style={[
        styles.text,
        {
          ...typographyStyle,
          color: color ?? palette.textPrimary,
          textAlign,
        },
        style,
        !caller?.fontFamily && brandFont(display, weight === "bold" || Number(weight) >= 600),
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  text: {
    // Base text styles
  },
});
