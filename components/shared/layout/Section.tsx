import React, { ReactNode } from "react";
import { StyleSheet, Text, View, StyleProp, ViewStyle } from "react-native";
import { colors, spacing, typography } from "@/styles/theme";

interface SectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  showDivider?: boolean;
}

export default function Section({
  title,
  subtitle,
  children,
  style,
  headerStyle,
  showDivider = false,
}: SectionProps) {
  return (
    <View style={[styles.container, style]}>
      {(title || subtitle) && (
        <View style={[styles.header, headerStyle]}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {showDivider && <View style={styles.divider} />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray600,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginBottom: spacing.md,
  },
});

