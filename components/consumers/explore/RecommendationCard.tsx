import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, borderRadius, typography } from "@/styles/theme";
import type { RecommendationTab } from "./RecommendationTabs";

interface RecommendationItem {
  id?: number;
  name?: string;
  title?: string;
  price?: number | string;
  discount?: number;
  imageUrl?: string;
  storeId?: number;
  store?: { id?: number; name?: string };
  storeName?: string;
  description?: string;
  distance?: number;
}

interface RecommendationCardProps {
  item: RecommendationItem;
  activeTab: RecommendationTab;
  distance?: number;
  onPress?: () => void;
}

const DEFAULT_DISTANCE_KM = 1.3;

export default function RecommendationCard({
  item,
  activeTab,
  distance,
  onPress,
}: RecommendationCardProps) {
  const router = useRouter();
  const displayDistance =
    distance != null && Number.isFinite(distance)
      ? distance
      : DEFAULT_DISTANCE_KM;
  const formattedDistance = `${displayDistance.toFixed(2)} km`;

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push({
      pathname: "/(consumers)/product",
      params: {
        name: item?.name || item?.title || "",
        storeId: item?.storeId || item?.store?.id || "",
        price: item?.price || "",
        description: item?.description || "",
        productId: item?.id || "",
        imageUrl: item?.imageUrl || "",
      },
    });
  };

  const getBadgeStyle = () => {
    switch (activeTab) {
      case "best":
        return styles.badgeGreen;
      case "cheapest":
        return styles.badgeYellow;
      case "closest":
        return styles.badgeTeal;
      default:
        return styles.badgeGreen;
    }
  };

  const getBadgeText = () => {
    switch (activeTab) {
      case "best":
        return "Best Deal";
      case "cheapest":
        return "Cheapest";
      case "closest":
        return "Closest";
      default:
        return "Best Deal";
    }
  };

  return (
    <View style={styles.resultCard}>
      <View style={styles.resultHeaderRow}>
        <View style={[styles.badge, getBadgeStyle()]}>
          <Text style={styles.badgeText}>{getBadgeText()}</Text>
        </View>
        {item?.discount && (
          <View style={styles.badgeOff}>
            <Text style={styles.badgeOffText}>{`${item.discount}% OFF`}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBodyRow}>
        {item?.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.resultImage} />
        ) : (
          <View style={styles.placeholderImage} />
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item?.name || item?.title || "Product"}
          </Text>
          <Text style={styles.cardMeta}>
            {item?.store?.name || item?.storeName || "Store"}
          </Text>
          <Text style={styles.cardMeta}>• {formattedDistance}</Text>
          {typeof item?.price !== "undefined" && (
            <Text style={styles.cardPrice}>
              ₱ {Number(item.price).toFixed(2)}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.detailsBtn}
          accessibilityRole="button"
          onPress={handlePress}
        >
          <Text style={styles.detailsBtnText}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  badgeGreen: {
    backgroundColor: colors.successLight,
  },
  badgeYellow: {
    backgroundColor: colors.warningLight,
  },
  badgeTeal: {
    backgroundColor: "#ccfbf1",
  },
  badgeText: {
    color: colors.successDark,
    fontWeight: typography.fontWeight.extrabold,
    fontSize: typography.fontSize.xs,
  },
  badgeOff: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  badgeOffText: {
    color: colors.white,
    fontWeight: typography.fontWeight.extrabold,
    fontSize: typography.fontSize.xs,
  },
  cardBodyRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  placeholderImage: {
    width: 110,
    height: 90,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
  },
  resultImage: {
    width: 110,
    height: 90,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  cardMeta: {
    color: colors.gray500,
    fontSize: typography.fontSize.sm,
  },
  cardPrice: {
    color: colors.successDark,
    fontWeight: typography.fontWeight.extrabold,
    marginTop: spacing.sm,
    fontSize: typography.fontSize.base,
  },
  cardActions: {
    alignItems: "flex-end",
    marginTop: spacing.sm,
  },
  detailsBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  detailsBtnText: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.sm,
  },
});

