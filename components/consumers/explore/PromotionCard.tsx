import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, borderRadius, typography, shadows } from "@/styles/theme";
import type { PromotionRecommendationItemDto } from "@/services/api/types/swagger";

interface PromotionCardProps {
  promotion: PromotionRecommendationItemDto;
  onPress?: () => void;
}

export default function PromotionCard({ promotion, onPress }: PromotionCardProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateDaysLeft = useMemo(() => {
    if (!promotion.endsAt) return null;
    const today = new Date();
    const end = new Date(promotion.endsAt);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [promotion.endsAt]);

  const isActive = useMemo(() => {
    const now = new Date();
    const startsAt = new Date(promotion.startsAt);
    const endsAt = promotion.endsAt ? new Date(promotion.endsAt) : null;
    return now >= startsAt && (!endsAt || now <= endsAt);
  }, [promotion.startsAt, promotion.endsAt]);

  const discountText = useMemo(() => {
    const promoType = promotion.type?.toUpperCase() || "PERCENTAGE";
    if (promoType === "PERCENTAGE" || promoType === "percentage") {
      return `${promotion.discount}% OFF`;
    }
    return `₱${promotion.discount} OFF`;
  }, [promotion.type, promotion.discount]);

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    // PromotionRecommendationItemDto doesn't have productId, only productCount
    // Navigate to promotions list or handle differently
    // For now, just do nothing or navigate to a promotions page
    // TODO: Implement proper navigation for multi-product promotions
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Promotion: ${promotion.title}`}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.storeRow}>
          <View style={styles.storeLogo}>
            <Ionicons name="pricetag-outline" size={22} color="#277874" />
          </View>
          <View style={{ maxWidth: 220 }}>
            <Text style={styles.storeName} numberOfLines={1}>
              {promotion.title}
            </Text>
            <Text style={styles.storeLocation} numberOfLines={2}>
              {promotion.description || "Promotion"}
            </Text>
          </View>
        </View>
        <View style={styles.discountBadge}>
          <Text style={styles.discountBadgeText}>{discountText}</Text>
        </View>
      </View>

      <View style={styles.cardBottomRow}>
        <View style={[styles.activePill, !isActive && styles.inactivePill]}>
          <Text style={[styles.activePillText, !isActive && styles.inactivePillText]}>
            {isActive ? "Active" : "Ended"}
          </Text>
        </View>
        {calculateDaysLeft !== null && calculateDaysLeft > 0 && (
          <View style={styles.daysLeftBadge}>
            <Ionicons name="time-outline" size={12} color="#92400E" />
            <Text style={styles.daysLeftText}>
              {calculateDaysLeft} day{calculateDaysLeft !== 1 ? "s" : ""} left
            </Text>
          </View>
        )}
        <View style={styles.spacer} />
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handlePress}
        >
          <Ionicons name="arrow-forward-circle" size={20} color="#277874" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  storeLogo: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  storeName: {
    fontWeight: "700",
    fontSize: 16,
    maxWidth: 200,
  },
  storeLocation: {
    color: "#6B7280",
    fontSize: 13,
    textTransform: "capitalize",
  },
  discountBadge: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
  },
  discountBadgeText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  cardBottomRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  activePill: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  activePillText: {
    color: "#1B6F5D",
    fontWeight: "600",
    fontSize: 12,
  },
  inactivePill: {
    backgroundColor: "#FEE2E2",
  },
  inactivePillText: {
    color: "#991B1B",
  },
  daysLeftBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    marginLeft: 8,
  },
  daysLeftText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#92400E",
  },
  spacer: {
    flex: 1,
  },
  actionButton: {
    padding: 8,
  },
});

