import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, typography } from "@/styles/theme";

interface SectionHeaderProps {
  title: string;
  linkText?: string;
  onPress?: () => void;
}

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

