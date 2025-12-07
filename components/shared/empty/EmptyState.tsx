import React, { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, typography } from "@/styles/theme";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  message?: string;
  action?: ReactNode;
}

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

