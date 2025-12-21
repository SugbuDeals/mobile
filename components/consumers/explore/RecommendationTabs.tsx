import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${tab.label} tab, ${tab.count} items`}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 30,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 30,
  },
  activeTab: {
    backgroundColor: "#277874",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  activeTabText: {
    color: "#ffffff",
  },
});

