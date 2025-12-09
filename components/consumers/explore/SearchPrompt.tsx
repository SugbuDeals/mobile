import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, borderRadius, typography } from "@/styles/theme";
import { Select, type SelectOption } from "@/components/Select";

interface SearchPromptProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  radius?: 5 | 10 | 15;
  onRadiusChange?: (radius: 5 | 10 | 15) => void;
  hasLocation?: boolean;
}

const radiusOptions: SelectOption<5 | 10 | 15>[] = [
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "15 km", value: 15 },
];

export default function SearchPrompt({
  searchQuery,
  onSearchChange,
  onSubmit,
  placeholder = "Searching for something?",
  radius = 5,
  onRadiusChange,
  hasLocation = false,
}: SearchPromptProps) {
  return (
    <View>
      <View style={styles.searchBox}>
        <Ionicons
          name="search"
          size={20}
          color="#6b7280"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#6b7280"
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          accessibilityLabel="Search input"
          multiline={false}
          numberOfLines={1}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={onSubmit}
            accessibilityRole="button"
            accessibilityLabel="Submit search"
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
      {(hasLocation || onRadiusChange) && (
        <View style={styles.bottomRow}>
          {hasLocation && (
            <View style={styles.locationIndicator}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={styles.locationText}>Location enabled</Text>
            </View>
          )}
          {onRadiusChange && (
            <View style={styles.radiusSelector}>
              <Select<5 | 10 | 15>
                options={radiusOptions}
                value={radius}
                onValueChange={onRadiusChange}
                placeholder="Radius"
                style={styles.radiusSelect}
                containerStyle={styles.radiusSelectContainer}
                maxHeight={150}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    color: "#374151",
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 20,
    maxHeight: 20,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  searchIcon: {
    marginRight: 10,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 12,
    gap: spacing.sm,
  },
  locationIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  locationText: {
    fontSize: typography.fontSize.xs,
    color: colors.primaryDark,
    fontWeight: typography.fontWeight.medium,
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

