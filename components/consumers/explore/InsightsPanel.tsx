import React, { useState } from "react";
import { StyleSheet, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, borderRadius, typography } from "@/styles/theme";
import FormattedInsightText from "./FormattedInsightText";

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
}: InsightsPanelProps) {
  const [isScrollingInsight, setIsScrollingInsight] = useState(false);

  const displaySummary =
    summary ||
    (lastSubmittedQuery && recommendationsCount > 0
      ? `I found the best deals for ${lastSubmittedQuery}`
      : lastSubmittedQuery && recommendationsCount === 0
      ? "I cannot find the product you looking for"
      : null) ||
    text ||
    "I found the best deals near you";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onEditPrompt}
      accessibilityRole="button"
    >
      <View style={styles.searchBox}>
        <View style={styles.topRow}>
          <LinearGradient
            colors={[colors.secondary, colors.primary]}
            style={styles.searchIconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="logo-android" size={24} color={colors.white} />
          </LinearGradient>
          <View style={styles.insightHeadlineContainer}>
            <Text style={styles.insightHeadline}>{displaySummary}</Text>
          </View>
          <TouchableOpacity
            style={styles.expandPill}
            onPress={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            accessibilityRole="button"
          >
            <Text style={styles.expandPillText}>
              {isExpanded ? "Hide" : "Details"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.progressLines}>
            <View style={styles.progressLine1} />
            <View style={styles.progressLine2} />
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.secondaryDark}
          />
        </View>
        {isExpanded && (
          <View style={styles.insightsBody}>
            <ScrollView
              style={styles.insightsScrollView}
              contentContainerStyle={styles.insightsScrollContent}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              bounces={true}
              scrollEnabled={true}
              onTouchStart={() => setIsScrollingInsight(true)}
              onTouchEnd={() => setIsScrollingInsight(false)}
              onScrollBeginDrag={() => setIsScrollingInsight(true)}
              onScrollEndDrag={() => setIsScrollingInsight(false)}
              onMomentumScrollEnd={() => setIsScrollingInsight(false)}
            >
              {highlight || elaboration || text ? (
                <FormattedInsightText
                  text={text ?? null}
                  highlight={highlight ?? null}
                  elaboration={elaboration ?? null}
                />
              ) : (
                <Text style={styles.insightsTextMuted}>
                  Sorry, we couldn't find the product you're looking for.
                </Text>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    backgroundColor: "#F3E5BC",
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    gap: spacing.md,
  },
  searchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  insightHeadlineContainer: {
    flex: 1,
    marginHorizontal: spacing.sm,
    transform: [{ scale: 0.88 }],
    justifyContent: "center",
  },
  insightHeadline: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    lineHeight: 16,
    flexWrap: "wrap",
  },
  expandPill: {
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryDark,
  },
  expandPillText: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(231, 167, 72, 0.2)",
  },
  progressLines: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  progressLine1: {
    width: 120,
    height: 4,
    backgroundColor: colors.secondary,
    borderRadius: 2,
  },
  progressLine2: {
    width: 60,
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  insightsBody: {
    marginTop: spacing.md,
    maxHeight: 300,
  },
  insightsScrollView: {
    flex: 1,
  },
  insightsScrollContent: {
    paddingBottom: spacing.md,
  },
  insightsTextMuted: {
    color: colors.gray500,
    fontSize: typography.fontSize.base,
    fontStyle: "italic",
  },
});

