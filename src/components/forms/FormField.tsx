/**
 * FormField
 * 
 * Accessible form field wrapper with clear labels and calm spacing.
 * Supports inline validation and predictable keyboard behavior.
 */

import { UX } from '@/constants/ux';
import { usePalette } from "@/theme/usePalette";
import { Spacing } from '@/theme/tokens';
import React from 'react';
import { Text, TextInput, TextInputProps, View, ViewProps } from 'react-native';

interface FormFieldProps extends ViewProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function FormField({
  label,
  children,
  error,
  hint,
  required = false,
  className = '',
  ...props
}: FormFieldProps) {
  const palette = usePalette();

  return (
    <View
      className={className}
      style={{
        marginBottom: Spacing.md,
      }}
      {...props}
    >
      <View style={{ marginBottom: Spacing.xs }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: palette.textPrimary,
          }}
          accessible
          accessibilityRole="text"
        >
          {label}
          {required && (
            <Text style={{ color: palette.danger }}> *</Text>
          )}
        </Text>
      </View>
      
      {children}
      
      {(error || hint) && (
        <View style={{ marginTop: Spacing.xs }}>
          <Text
            style={{
              fontSize: 12,
              color: error ? palette.danger : palette.textSecondary,
            }}
            accessible
            accessibilityRole={error ? 'alert' : 'text'}
          >
            {error || hint}
          </Text>
        </View>
      )}
    </View>
  );
}

interface AccessibleTextInputProps extends TextInputProps {
  label: string;
  error?: boolean;
}

export function AccessibleTextInput({
  label,
  error = false,
  style,
  ...props
}: AccessibleTextInputProps) {
  const palette = usePalette();

  return (
    <TextInput
      style={{
        height: UX.form.preferredInputHeight,
        borderWidth: 1,
        borderColor: error ? palette.danger : palette.border,
        borderRadius: 8,
        paddingHorizontal: Spacing.md,
        fontSize: 16,
        color: palette.textPrimary,
        backgroundColor: palette.card,
        ...style,
      }}
      placeholderTextColor={palette.textTertiary}
      accessible
      accessibilityLabel={label}
      accessibilityHint={error ? 'Contains error' : undefined}
      {...props}
    />
  );
}
