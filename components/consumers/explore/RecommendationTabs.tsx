import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, typography, borderRadius } from "@/styles/theme";

export type RecommendationTab = "all" | "products" | "stores" | "promotions";

interface TabData {
  key: RecommendationTab;
  label: string;
  count: number;
}

interface RecommendationTabsProps {
  activeTab: RecommendationTab;
  onTabChange: (tab: RecommendationTab) => void;
  productsCount: number;
  storesCount: number;
  promotionsCount: number;
}

export default function RecommendationTabs({
  activeTab,
  onTabChange,
  productsCount,
  storesCount,
  promotionsCount,
}: RecommendationTabsProps) {
  const totalCount = productsCount + storesCount + promotionsCount;

  const tabs: TabData[] = [
    { key: "all" as RecommendationTab, label: "All", count: totalCount },
    { key: "products" as RecommendationTab, label: "Products", count: productsCount },
    { key: "stores" as RecommendationTab, label: "Stores", count: storesCount },
    { key: "promotions" as RecommendationTab, label: "Promotions", count: promotionsCount },
  ].filter((tab) => tab.count > 0 || tab.key === "all");

  // Don't show tabs if there's no data
  if (totalCount === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabsRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={[
              styles.tabBtn,
              activeTab === tab.key && styles.tabBtnActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${tab.label} tab, ${tab.count} items`}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View
                style={[
                  styles.badge,
                  activeTab === tab.key && styles.badgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    activeTab === tab.key && styles.badgeTextActive,
                  ]}
                >
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  tabsRow: {
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.gray600,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  tabTextActive: {
    color: colors.white,
  },
  badge: {
    backgroundColor: colors.gray300,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 20,
    alignItems: "center",
  },
  badgeActive: {
    backgroundColor: colors.white,
  },
  badgeText: {
    color: colors.gray700,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  badgeTextActive: {
    color: colors.primary,
  },
});

