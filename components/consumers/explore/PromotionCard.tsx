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

    if (promotion.productId) {
      router.push({
        pathname: "/(consumers)/product",
        params: {
          productId: promotion.productId.toString(),
        },
      });
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Promotion: ${promotion.title}`}
    >
      <View style={styles.cardContent}>
        {/* Discount Badge */}
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discountText}</Text>
        </View>

        {/* Promotion Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {promotion.title}
          </Text>

          {promotion.description && (
            <Text style={styles.description} numberOfLines={3}>
              {promotion.description}
            </Text>
          )}

          {/* Dates */}
          <View style={styles.datesContainer}>
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.gray600} />
              <Text style={styles.dateText}>
                Starts: {formatDate(promotion.startsAt)}
              </Text>
            </View>
            {promotion.endsAt && (
              <View style={styles.dateItem}>
                <Ionicons name="calendar-outline" size={14} color={colors.gray600} />
                <Text style={styles.dateText}>
                  Ends: {formatDate(promotion.endsAt)}
                </Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isActive ? colors.success : colors.error },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isActive ? colors.successDark : colors.errorDark },
                ]}
              >
                {isActive ? "Active" : "Ended"}
              </Text>
            </View>
            {calculateDaysLeft !== null && calculateDaysLeft > 0 && (
              <View style={styles.daysLeftBadge}>
                <Ionicons name="time-outline" size={12} color={colors.warningDark} />
                <Text style={styles.daysLeftText}>
                  {calculateDaysLeft} day{calculateDaysLeft !== 1 ? "s" : ""} left
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.viewButton}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel="View promotion details"
          >
            <Text style={styles.viewButtonText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: "hidden",
  },
  cardContent: {
    padding: spacing.md,
  },
  discountBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  discountText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.extrabold,
    color: colors.white,
    letterSpacing: 0.5,
  },
  infoContainer: {
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    lineHeight: 24,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    lineHeight: 20,
  },
  datesContainer: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  daysLeftBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  daysLeftText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warningDark,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  viewButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});

