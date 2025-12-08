import React, { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, typography } from "@/styles/theme";

/**
 * Props for the EmptyState component
 */
export interface EmptyStateProps {
  /** Icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Icon color */
  iconColor?: string;
  /** Empty state title */
  title: string;
  /** Empty state message */
  message?: string;
  /** Optional action button or element */
  action?: ReactNode;
}

/**
 * An empty state component for displaying when there's no content.
 * 
 * Provides a consistent way to show empty states with icon, title, message, and optional action.
 * 
 * @component
 * @example
 * ```tsx
 * <EmptyState
 *   icon="bag-outline"
 *   title="No Products"
 *   message="Start adding products to see them here"
 *   action={<Button onPress={handleAdd}>Add Product</Button>}
 * />
 * ```
 * 
 * @param {EmptyStateProps} props - EmptyState component props
 * @returns {JSX.Element} EmptyState component
 */
export default function EmptyState({
  icon = "document-outline",
  iconColor = colors.gray400,
  title,
  message,
  action,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={iconColor} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray700,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.gray500,
    marginTop: spacing.sm,
    textAlign: "center",
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
  },
  actionContainer: {
    marginTop: spacing.xl,
  },
});

