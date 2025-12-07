import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTabs } from "@/hooks/useTabs";

export interface Tab {
  key: string;
  label: string;
}

export interface TabSelectorProps {
  tabs: Tab[];
  initialTab?: string;
  onTabChange?: (tab: string) => void;
  style?: any;
  tabStyle?: any;
  activeTabStyle?: any;
  textStyle?: any;
  activeTextStyle?: any;
}

export function TabSelector({
  tabs,
  initialTab,
  onTabChange,
  style,
  tabStyle,
  activeTabStyle,
  textStyle,
  activeTextStyle,
}: TabSelectorProps) {
  const defaultTab = initialTab || tabs[0]?.key || "";
  const { activeTab, setActiveTab, isActive } = useTabs(defaultTab);

  const handleTabPress = (tabKey: string) => {
    setActiveTab(tabKey);
    onTabChange?.(tabKey);
  };

  return (
    <View style={[styles.container, style]}>
      {tabs.map((tab) => {
        const active = isActive(tab.key);
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => handleTabPress(tab.key)}
            style={[
              styles.tab,
              tabStyle,
              active && styles.tabActive,
              active && activeTabStyle,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                textStyle,
                active && styles.tabTextActive,
                active && activeTextStyle,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    marginTop: 6,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  tabActive: {
    backgroundColor: "#FFBE5D",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#ffffff",
  },
});

