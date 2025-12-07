import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/styles/theme";

interface GreetingProps {
  name: string;
}

export default function Greeting({ name }: GreetingProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.greetingTitle}>Hello, {name}! 👋</Text>
      <Text style={styles.greetingSubtitle}>
        What would you like to shop today?
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  greetingTitle: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  greetingSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray600,
  },
});

