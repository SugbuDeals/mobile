import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, typography } from "@/styles/theme";

/**
 * Props for the SectionHeader component
 */
export interface SectionHeaderProps {
  /** Header title */
  title: string;
  /** Optional link text */
  linkText?: string;
  /** Link onPress handler */
  onPress?: () => void;
}

/**
 * A section header component with optional link action.
 * 
 * Provides consistent header styling with title and optional action link.
 * 
 * @component
 * @example
 * ```tsx
 * <SectionHeader
 *   title="Featured Products"
 *   linkText="See All"
 *   onPress={handleSeeAll}
 * />
 * ```
 * 
 * @param {SectionHeaderProps} props - SectionHeader component props
 * @returns {JSX.Element} SectionHeader component
 */
export default function SectionHeader({
  title,
  linkText,
  onPress,
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {linkText && (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          <Text style={styles.link}>{linkText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
  },
  link: {
    fontSize: typography.fontSize.sm,
    color: colors.secondaryDark,
    fontWeight: typography.fontWeight.medium,
  },
});

