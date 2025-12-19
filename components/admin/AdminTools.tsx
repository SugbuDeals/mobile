import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";


export interface AdminTool {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}

interface AdminToolsProps {
  tools?: AdminTool[];
  onRefresh?: () => void;
  onExport?: () => void;
  onSearch?: () => void;
  showRefresh?: boolean;
  showExport?: boolean;
  showSearch?: boolean;
  showSettings?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right";
  compact?: boolean;
}

export default function AdminTools({
  tools = [],
  onRefresh,
  onExport,
  onSearch,
  showRefresh = true,
  showExport = true,
  showSearch = true,
  showSettings = true,
  position = "bottom-left",
  compact = false,
}: AdminToolsProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  // Build default tools (excluding settings - it's the main button)
  const defaultTools: AdminTool[] = [];

  if (showRefresh && onRefresh) {
    defaultTools.push({
      id: "refresh",
      label: "Refresh",
      icon: "refresh",
      onPress: onRefresh,
      color: "#277874",
    });
  }

  if (showSearch && onSearch) {
    defaultTools.push({
      id: "search",
      label: "Search",
      icon: "search",
      onPress: onSearch,
      color: "#3B82F6",
    });
  }

  if (showExport && onExport) {
    defaultTools.push({
      id: "export",
      label: "Export",
      icon: "download",
      onPress: onExport,
      color: "#10B981",
    });
  }

  // Combine default tools with custom tools (excluding settings)
  const otherTools = [...defaultTools, ...tools.filter(t => t.id !== "settings")];

  // Don't render if settings is disabled and no other tools
  if (!showSettings && otherTools.length === 0) {
    return null;
  }

  const handleSettingsPress = () => {
    if (isExpanded) {
      // If expanded, navigate to settings
      router.push("/(admin)/settings");
      setTimeout(() => setIsExpanded(false), 200);
    } else {
      // If collapsed, expand to show other tools
      toggleExpanded();
    }
  };

  const toggleExpanded = () => {
    const toValue = isExpanded ? 1 : 0.95;
    Animated.spring(scaleAnim, {
      toValue,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
    setIsExpanded(!isExpanded);
  };

  const handleToolPress = (tool: AdminTool) => {
    if (tool.disabled) return;
    
    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    tool.onPress();
    
    // Auto-collapse after action
    if (otherTools.length > 0) {
      setTimeout(() => setIsExpanded(false), 300);
    }
  };

  // Calculate bottom offset to avoid tabbar (tabbar height: iOS ~85px, Android ~65px)
  const bottomOffset = Platform.OS === "ios" ? 105 : 85; // tabbar height + safe padding

  const positionStyles = {
    "bottom-right": { bottom: bottomOffset, right: 20 },
    "bottom-left": { bottom: bottomOffset, left: 20 },
    "top-right": { top: 20, right: 20 },
  };

  // If no other tools, just show settings button
  if (otherTools.length === 0 && showSettings) {
    return (
      <View style={[styles.container, positionStyles[position]]}>
        <TouchableOpacity
          style={styles.mainButtonWithGradient}
          onPress={() => router.push("/(admin)/settings")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["rgba(255, 190, 93, 0.3)", "rgba(39, 120, 116, 0.3)"]}
            style={styles.mainButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="settings" size={24} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // If settings is disabled, show tools in compact mode
  if (!showSettings) {
    if (compact || otherTools.length === 1) {
      const tool = otherTools[0];
      return (
        <View style={[styles.container, positionStyles[position]]}>
          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: tool.color || "#277874" }]}
            onPress={() => handleToolPress(tool)}
            activeOpacity={0.8}
          >
            <Ionicons name={tool.icon} size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.container, positionStyles[position]]}>
        {isExpanded && (
          <View style={styles.toolsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.toolsContainer}
              style={styles.toolsScroll}
            >
              {otherTools.map((tool) => (
                <TouchableOpacity
                  key={tool.id}
                  style={[
                    styles.toolButton,
                    { backgroundColor: tool.color || "#277874" },
                    tool.disabled && styles.toolButtonDisabled,
                  ]}
                  onPress={() => handleToolPress(tool)}
                  disabled={tool.disabled}
                  activeOpacity={0.8}
                >
                  <Ionicons name={tool.icon} size={20} color="#ffffff" />
                  {!compact && (
                    <Text style={styles.toolButtonText}>{tool.label}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[styles.mainButton, isExpanded && styles.mainButtonExpanded]}
            onPress={toggleExpanded}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isExpanded ? "close" : "construct"}
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // Main layout: Settings button in corner, expands to show other tools
  const isTopPosition = position === "top-right";
  
  const toolsList = isExpanded && otherTools.length > 0 && (
    <View style={isTopPosition ? styles.toolsWrapperTop : styles.toolsWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolsContainer}
        style={styles.toolsScroll}
      >
        {otherTools.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={[
              styles.toolButton,
              { backgroundColor: tool.color || "#277874" },
              tool.disabled && styles.toolButtonDisabled,
            ]}
            onPress={() => handleToolPress(tool)}
            disabled={tool.disabled}
            activeOpacity={0.8}
          >
            <Ionicons name={tool.icon} size={20} color="#ffffff" />
            {!compact && (
              <Text style={styles.toolButtonText}>{tool.label}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, positionStyles[position]]}>
      {/* For bottom positions: tools above button */}
      {!isTopPosition && toolsList}

      {/* Settings Button (Main Button) */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: 0.3 }}>
        <TouchableOpacity
          style={styles.mainButtonWithGradient}
          onPress={handleSettingsPress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#FFBE5D", "#277874"]}
            style={styles.mainButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons
              name={isExpanded ? "close" : "settings"}
              size={24}
              color="#ffffff"
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* For top positions: tools below button */}
      {isTopPosition && toolsList}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 1000,
    alignItems: "flex-end",
  },
  toolsWrapper: {
    marginBottom: 12,
  },
  toolsWrapperTop: {
    marginTop: 12,
  },
  toolsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingRight: 0,
  },
  toolsScroll: {
    maxHeight: 60,
  },
  toolButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    minWidth: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  toolButtonWithGradient: {
    backgroundColor: "transparent",
  },
  toolButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    width: "100%",
    height: "100%",
  },
  toolButtonDisabled: {
    opacity: 0.5,
  },
  toolButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFBE5D",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  mainButtonWithGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  mainButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainButtonExpanded: {
    backgroundColor: "#277874",
  },
});
