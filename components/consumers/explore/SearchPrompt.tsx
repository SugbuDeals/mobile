import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, borderRadius } from "@/styles/theme";

interface SearchPromptProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export default function SearchPrompt({
  searchQuery,
  onSearchChange,
  onSubmit,
  placeholder = "Searching for something?",
}: SearchPromptProps) {
  return (
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
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor={colors.gray500}
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={onSubmit}
          accessibilityRole="button"
        >
          <Ionicons name="send" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
      <View style={styles.bottomRow}>
        <View style={styles.progressLines}>
          <View style={styles.progressLine1} />
          <View style={styles.progressLine2} />
        </View>
      </View>
    </View>
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
  searchInput: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.gray900,
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
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
});

