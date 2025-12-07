import React, { ReactNode } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, spacing, typography } from "@/styles/theme";

interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: ReactNode;
  containerStyle?: ViewStyle;
}

export default function FormField({
  label,
  required = false,
  error,
  helperText,
  children,
  containerStyle,
}: FormFieldProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      {children}
      {error && <Text style={styles.error}>{error}</Text>}
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray700,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error,
  },
  error: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
});

