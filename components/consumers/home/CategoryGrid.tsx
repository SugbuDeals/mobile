import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, borderRadius, typography } from "@/styles/theme";
import type { Category } from "@/features/catalog/types";
import { SectionHeader } from "@/components/shared";

interface CategoryGridProps {
  categories: Category[];
  showAllLink?: boolean;
}

export default function CategoryGrid({
  categories,
  showAllLink = true,
}: CategoryGridProps) {
  const router = useRouter();

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Categories"
        linkText={showAllLink ? "See All" : undefined}
        onPress={showAllLink ? () => router.push("/(consumers)/categories") : undefined}
      />
      <View style={styles.grid}>
        {categories.map((cat) => (
          <View key={cat.id} style={styles.gridItem}>
            <TouchableOpacity activeOpacity={0.8}>
              <View style={styles.iconWrap}>
                <Image
                  source={require("@/assets/images/icon.png")}
                  style={styles.icon}
                />
              </View>
            </TouchableOpacity>
            <Text style={styles.caption} numberOfLines={1}>
              {cat.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  gridItem: {
    width: "22%",
    alignItems: "center",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  caption: {
    fontSize: typography.fontSize.xs,
    color: colors.gray700,
    textAlign: "center",
  },
});

