import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, typography } from "@/styles/theme";

export type RecommendationTab = "best" | "cheapest" | "closest";

interface RecommendationTabsProps {
  activeTab: RecommendationTab;
  onTabChange: (tab: RecommendationTab) => void;
  resultsCount?: number;
}

export default function RecommendationTabs({
  activeTab,
  onTabChange,
  resultsCount,
}: RecommendationTabsProps) {
  return (
    <View>
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => onTabChange("best")}
          style={[styles.tabBtn, activeTab === "best" && styles.tabBtnActive]}
          accessibilityRole="button"
        >
          <Text
            style={[styles.tabText, activeTab === "best" && styles.tabTextActive]}
          >
            Best Match
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onTabChange("cheapest")}
          style={[
            styles.tabBtn,
            activeTab === "cheapest" && styles.tabBtnActive,
          ]}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "cheapest" && styles.tabTextActive,
            ]}
          >
            Cheapest
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onTabChange("closest")}
          style={[
            styles.tabBtn,
            activeTab === "closest" && styles.tabBtnActive,
          ]}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "closest" && styles.tabTextActive,
            ]}
          >
            Closest
          </Text>
        </TouchableOpacity>
      </View>
      {resultsCount !== undefined && resultsCount > 0 && (
        <Text style={styles.resultsCount}>{resultsCount} results found</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  tabBtn: {
    paddingVertical: spacing.sm,
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.gray600,
    fontWeight: typography.fontWeight.semibold,
  },
  tabTextActive: {
    color: colors.gray900,
  },
  resultsCount: {
    color: colors.gray500,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
  },
});

