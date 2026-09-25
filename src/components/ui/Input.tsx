import { Colors, Radius, Shadows, Spacing } from '@/theme/tokens';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({ 
  label, 
  error, 
  helperText, 
  leftIcon, 
  rightIcon,
  className = '',
  style,
  accessibilityLabel,
  accessibilityHint,
  onFocus,
  onBlur,
  nativeID,
  ...props 
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = !!error;
  const inputId = nativeID ?? (label ? `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-input` : undefined);

  const getBorderColor = () => {
    if (hasError) return Colors.danger;
    if (isFocused) return Colors.primary;
    return Colors.border;
  };

  return (
    <View className={className}>
      {label && (
        <Text variant="label" color={Colors.textSecondary} style={styles.label}>
          {label}
        </Text>
      )}
      <View style={[styles.inputContainer, { borderColor: getBorderColor() }]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          {...props}
          nativeID={inputId}
          style={[styles.input, style]}
          placeholderTextColor={Colors.textTertiary}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={error ?? accessibilityHint ?? helperText}
          aria-invalid={hasError}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && (
        <Text
          variant="small"
          color={Colors.danger}
          style={styles.errorText}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
      {helperText && !error && (
        <Text variant="small" color={Colors.textTertiary} style={styles.helperText}>
          {helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
    ...Shadows.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
  errorText: {
    marginTop: Spacing.xs,
  },
  helperText: {
    marginTop: Spacing.xs,
  },
});
