import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, borderRadius, typography } from "@/styles/theme";
import { Select, type SelectOption } from "@/components/Select";

interface SearchPromptProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  radius?: number;
  onRadiusChange?: (radius: number) => void;
  hasLocation?: boolean;
  showRadiusSelector?: boolean; // Allow hiding radius selector for consumers
}

export default function SearchPrompt({
  searchQuery,
  onSearchChange,
  onSubmit,
  placeholder = "Ask me anything...",
  radius,
  onRadiusChange,
  hasLocation = false,
  showRadiusSelector = false, // Default to false - consumers shouldn't select radius
}: SearchPromptProps) {
  return (
    <View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <View style={styles.searchIconContainer}>
            <LinearGradient
              colors={["#FFBE5D", "#277874"]}
              style={styles.aiIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons
                name="sparkles"
                size={20}
                color="#ffffff"
              />
            </LinearGradient>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
            onSubmitEditing={onSubmit}
            accessibilityLabel="AI search input"
            multiline={false}
            numberOfLines={1}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              style={styles.sendButtonContainer}
              onPress={onSubmit}
              accessibilityRole="button"
              accessibilityLabel="Submit search"
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#FFBE5D", "#277874"]}
                style={styles.sendButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="send" size={18} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholderIconContainer}>
              <Ionicons name="mic-outline" size={20} color="#9ca3af" />
            </View>
          )}
        </View>
        {hasLocation && (
          <View style={styles.bottomRow}>
            <View style={styles.locationIndicator}>
              <Ionicons name="location" size={14} color="#277874" />
              <Text style={styles.locationText}>Location enabled</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    width: "100%",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
    paddingVertical: 0,
    paddingHorizontal: 12,
    minHeight: 22,
    maxHeight: 22,
    fontWeight: "500",
  },
  searchIconContainer: {
    marginRight: 4,
  },
  aiIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonContainer: {
    marginLeft: 8,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 10,
    gap: spacing.sm,
  },
  locationIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1fae5",
  },
  locationText: {
    fontSize: 12,
    color: "#277874",
    fontWeight: "600",
  },
  radiusSelector: {
    minWidth: 120,
    flexShrink: 0,
  },
  radiusSelect: {
    minHeight: 32,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  radiusSelectContainer: {
    marginVertical: 0,
  },
});

