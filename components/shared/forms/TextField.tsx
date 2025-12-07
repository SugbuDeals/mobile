import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { colors, spacing, borderRadius, typography } from "@/styles/theme";

interface TextFieldProps extends TextInputProps {
  label?: string;
  icon?: any;
  iconComponent?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export default function TextField({
  label,
  icon,
  iconComponent,
  style,
  error,
  helperText,
  ...props
}: TextFieldProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          error && styles.inputContainerError,
        ]}
      >
        {icon && <Image source={icon} style={styles.icon} />}
        {iconComponent && (
          <View style={styles.iconContainer}>{iconComponent}</View>
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.gray400}
          {...props}
        />
      </View>
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
  icon: {
    width: 18,
    height: 18,
    marginRight: spacing.sm,
    resizeMode: "contain",
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.gray900,
    fontSize: typography.fontSize.base,
  },
  error: {
    color: colors.error,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  helperText: {
    color: colors.gray500,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
});

