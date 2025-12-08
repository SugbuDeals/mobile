import React, { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "@/styles/theme";
import Button from "./Button";

/**
 * Props for the FormActions component
 */
export interface FormActionsProps {
  /** Primary button label */
  primaryLabel?: string;
  /** Primary button onPress handler */
  primaryOnPress?: () => void;
  /** Primary button variant */
  primaryVariant?: "primary" | "outline" | "secondary" | "danger" | "success";
  /** Primary button loading state */
  primaryLoading?: boolean;
  /** Primary button disabled state */
  primaryDisabled?: boolean;
  /** Secondary button label */
  secondaryLabel?: string;
  /** Secondary button onPress handler */
  secondaryOnPress?: () => void;
  /** Secondary button variant */
  secondaryVariant?: "primary" | "outline" | "secondary" | "danger" | "success";
  /** Secondary button loading state */
  secondaryLoading?: boolean;
  /** Secondary button disabled state */
  secondaryDisabled?: boolean;
  /** Custom children to render instead of buttons */
  children?: ReactNode;
  /** Make container full width */
  fullWidth?: boolean;
}

/**
 * A form actions component that provides primary and secondary button layouts.
 * 
 * Useful for forms where you need consistent button placement and styling.
 * 
 * @component
 * @example
 * ```tsx
 * <FormActions
 *   primaryLabel="Submit"
 *   primaryOnPress={handleSubmit}
 *   primaryLoading={isSubmitting}
 *   secondaryLabel="Cancel"
 *   secondaryOnPress={handleCancel}
 * />
 * ```
 * 
 * @param {FormActionsProps} props - FormActions component props
 * @returns {JSX.Element} FormActions component
 */
export default function FormActions({
  primaryLabel,
  primaryOnPress,
  primaryVariant = "primary",
  primaryLoading = false,
  primaryDisabled = false,
  secondaryLabel,
  secondaryOnPress,
  secondaryVariant = "outline",
  secondaryLoading = false,
  secondaryDisabled = false,
  children,
  fullWidth = false,
}: FormActionsProps) {
  if (children) {
    return <View style={styles.container}>{children}</View>;
  }

  return (
    <View style={[styles.container, fullWidth && styles.fullWidth]}>
      {secondaryLabel && (
        <Button
          variant={secondaryVariant}
          onPress={secondaryOnPress}
          loading={secondaryLoading}
          disabled={secondaryDisabled}
          style={styles.secondaryButton}
        >
          {secondaryLabel}
        </Button>
      )}
      {primaryLabel && (
        <Button
          variant={primaryVariant}
          onPress={primaryOnPress}
          loading={primaryLoading}
          disabled={primaryDisabled}
          style={styles.primaryButton}
          fullWidth={!secondaryLabel}
        >
          {primaryLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  fullWidth: {
    width: "100%",
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
  },
});

