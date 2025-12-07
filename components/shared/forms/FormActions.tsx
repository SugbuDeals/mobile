import React, { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "@/styles/theme";
import Button from "./Button";

interface FormActionsProps {
  primaryLabel?: string;
  primaryOnPress?: () => void;
  primaryVariant?: "primary" | "outline" | "secondary" | "danger" | "success";
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  secondaryOnPress?: () => void;
  secondaryVariant?: "primary" | "outline" | "secondary" | "danger" | "success";
  secondaryLoading?: boolean;
  secondaryDisabled?: boolean;
  children?: ReactNode;
  fullWidth?: boolean;
}

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

