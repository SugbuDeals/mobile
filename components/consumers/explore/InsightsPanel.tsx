import { borderRadius, colors, spacing, typography } from "@/styles/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface InsightsPanelProps {
  summary?: string | null;
  text?: string | null;
  highlight?: string | null;
  elaboration?: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEditPrompt: () => void;
  lastSubmittedQuery?: string | null;
  recommendationsCount?: number;
  intent?: "product" | "store" | "promotion" | "chat";
  // Note: isExpanded and onToggleExpand are kept for backward compatibility but not used
}

export default function InsightsPanel({
  summary,
  text,
  highlight,
  elaboration,
  isExpanded,
  onToggleExpand,
  onEditPrompt,
  lastSubmittedQuery,
  recommendationsCount = 0,
  intent,
}: InsightsPanelProps) {

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onEditPrompt}
      accessibilityRole="button"
      accessibilityLabel="Edit search query"
    >
      <View style={styles.queryContainer}>
        <Text style={styles.queryText} numberOfLines={2}>
          {lastSubmittedQuery || "Your search query"}
        </Text>
        <Ionicons name="create-outline" size={18} color={colors.gray500} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  queryContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.secondaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.secondary,
    minHeight: 48,
  },
  queryText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray900,
    marginRight: spacing.sm,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
  },
});

