import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, borderRadius, typography, shadows } from "@/styles/theme";

interface ChatResponseProps {
  content: string;
  style?: View["props"]["style"];
}

export default function ChatResponse({ content, style }: ChatResponseProps) {
  // Simple text formatting - split by newlines and render as paragraphs
  const paragraphs = content.split("\n").filter((p) => p.trim().length > 0);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
        </View>
        <Text style={styles.headerText}>AI Assistant</Text>
      </View>
      <View style={styles.contentContainer}>
        {paragraphs.length > 0 ? (
          paragraphs.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph.trim()}
            </Text>
          ))
        ) : (
          <Text style={styles.paragraph}>{content}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
  },
  contentContainer: {
    gap: spacing.sm,
  },
  paragraph: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.gray700,
    textAlign: "left",
  },
});

