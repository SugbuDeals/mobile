import React from "react";
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { colors, spacing, borderRadius, typography } from "@/styles/theme";
import FormField from "./FormField";

/**
 * Props for the FormInput component
 */
export interface FormInputProps extends TextInputProps {
  /** Input label */
  label?: string;
  /** Show required indicator */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Left icon component */
  leftIcon?: React.ReactNode;
  /** Right icon component */
  rightIcon?: React.ReactNode;
}

/**
 * A form input component with built-in FormField wrapper.
 * 
 * Provides consistent styling, error handling, and icon support.
 * 
 * @component
 * @example
 * ```tsx
 * <FormInput
 *   label="Email"
 *   required
 *   error={errors.email}
 *   placeholder="Enter your email"
 *   keyboardType="email-address"
 *   leftIcon={<Ionicons name="mail" />}
 * />
 * ```
 * 
 * @param {FormInputProps} props - FormInput component props
 * @returns {JSX.Element} FormInput component
 */
export default function FormInput({
  label,
  required,
  error,
  helperText,
  leftIcon,
  rightIcon,
  style,
  ...props
}: FormInputProps) {
  return (
    <FormField
      label={label}
      required={required}
      error={error}
      helperText={helperText}
    >
      <View
        style={[
          styles.inputContainer,
          error && styles.inputContainerError,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.gray400}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
    </FormField>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  inputContainerError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  input: {
    flex: 1,
    color: colors.gray900,
    fontSize: typography.fontSize.base,
    paddingVertical: spacing.sm,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
});

