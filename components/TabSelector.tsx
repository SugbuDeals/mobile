import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTabs } from "@/hooks/useTabs";

/**
 * Tab configuration
 */
export interface Tab {
  /** Unique identifier for the tab */
  key: string;
  /** Display label for the tab */
  label: string;
  /** Optional badge count or text to display on tab */
  badge?: number | string;
  /** Whether the tab is disabled */
  disabled?: boolean;
  /** Optional icon name for the tab */
  icon?: string;
}

/**
 * Props for the TabSelector component
 */
export interface TabSelectorProps {
  /** Array of tab configurations */
  tabs: Tab[];
  /** Initial active tab key */
  initialTab?: string;
  /** Callback fired when tab changes */
  onTabChange?: (tab: string) => void;
  /** Custom style for container */
  style?: any;
  /** Custom style for individual tabs */
  tabStyle?: any;
  /** Custom style for active tab */
  activeTabStyle?: any;
  /** Custom style for tab text */
  textStyle?: any;
  /** Custom style for active tab text */
  activeTextStyle?: any;
  /** Custom style for badge */
  badgeStyle?: any;
  /** Custom style for active tab badge */
  activeBadgeStyle?: any;
}

/**
 * A tab selector component with badge support, disabled states, and customizable styling.
 * 
 * Manages tab state internally and provides callbacks for tab changes.
 * Supports badges, disabled tabs, and custom styling options.
 * 
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <TabSelector
 *   tabs={[
 *     { key: "all", label: "All" },
 *     { key: "active", label: "Active" },
 *     { key: "archived", label: "Archived" },
 *   ]}
 *   onTabChange={(tab) => console.log('Selected:', tab)}
 * />
 * 
 * // With badges
 * <TabSelector
 *   tabs={[
 *     { key: "inbox", label: "Inbox", badge: 5 },
 *     { key: "sent", label: "Sent", badge: 12 },
 *     { key: "drafts", label: "Drafts", badge: "99+" },
 *   ]}
 * />
 * 
 * // With disabled tabs
 * <TabSelector
 *   tabs={[
 *     { key: "available", label: "Available" },
 *     { key: "coming-soon", label: "Coming Soon", disabled: true },
 *   ]}
 * />
 * ```
 * 
 * @param {TabSelectorProps} props - TabSelector component props
 * @returns {JSX.Element} TabSelector component
 */
export function TabSelector({
  tabs,
  initialTab,
  onTabChange,
  style,
  tabStyle,
  activeTabStyle,
  textStyle,
  activeTextStyle,
  badgeStyle,
  activeBadgeStyle,
}: TabSelectorProps) {
  const defaultTab = initialTab || tabs[0]?.key || "";
  const { activeTab, setActiveTab, isActive } = useTabs(defaultTab);

  const handleTabPress = (tabKey: string, disabled?: boolean) => {
    if (disabled) return;
    setActiveTab(tabKey);
    onTabChange?.(tabKey);
  };

  const formatBadge = (badge: number | string | undefined): string | null => {
    if (badge === undefined || badge === null) return null;
    if (typeof badge === "number") {
      return badge > 99 ? "99+" : badge.toString();
    }
    return badge;
  };

  return (
    <View style={[styles.container, style]}>
      {tabs.map((tab) => {
        const active = isActive(tab.key);
        const disabled = tab.disabled;
        const badgeText = formatBadge(tab.badge);

        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => handleTabPress(tab.key, disabled)}
            disabled={disabled}
            style={[
              styles.tab,
              tabStyle,
              active && styles.tabActive,
              active && activeTabStyle,
              disabled && styles.tabDisabled,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                textStyle,
                active && styles.tabTextActive,
                active && activeTextStyle,
                disabled && styles.tabTextDisabled,
              ]}
            >
              {tab.label}
            </Text>
            {badgeText && (
              <View
                style={[
                  styles.badge,
                  badgeStyle,
                  active && styles.badgeActive,
                  active && activeBadgeStyle,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    active && styles.badgeTextActive,
                  ]}
                >
                  {badgeText}
                </Text>
              </View>
            )}
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
    flexWrap: "wrap",
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    position: "relative",
  },
  tabActive: {
    backgroundColor: "#FFBE5D",
  },
  tabDisabled: {
    opacity: 0.5,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  tabTextDisabled: {
    color: "#9ca3af",
  },
  badge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeActive: {
    backgroundColor: "#ffffff",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  badgeTextActive: {
    color: "#FFBE5D",
  },
});

