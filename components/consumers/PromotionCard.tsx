/**
 * Promotion Card Component for Consumers
 * Displays promotions with all 6 deal types beautifully
 */

import type { PromotionResponseDto } from "@/services/api/types/swagger";
import { calculatePromotionPrice, formatDealDetails, getDealTypeLabel } from "@/utils/dealTypes";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PromotionCardProps {
  promotion: PromotionResponseDto;
  productName?: string;
  productPrice?: number;
  storeName?: string;
  onPress?: () => void;
  compact?: boolean;
}

export default function PromotionCard({
  promotion,
  productName,
  productPrice,
  storeName,
  onPress,
  compact = false,
}: PromotionCardProps) {
  // Calculate savings if product price is provided
  const originalPrice = productPrice || 0;
  const finalPrice = originalPrice > 0 ? calculatePromotionPrice(originalPrice, promotion, 1) : 0;
  const savings = originalPrice - finalPrice;
  const savingsPercent = originalPrice > 0 ? (savings / originalPrice) * 100 : 0;

  // Get deal type color
  const getDealTypeColor = () => {
    switch (promotion.dealType) {
      case "PERCENTAGE_DISCOUNT":
        return "#EF4444"; // Red
      case "FIXED_DISCOUNT":
        return "#F59E0B"; // Orange
      case "BOGO":
        return "#10B981"; // Green
      case "BUNDLE":
        return "#8B5CF6"; // Purple
      case "QUANTITY_DISCOUNT":
        return "#3B82F6"; // Blue
      case "VOUCHER":
        return "#EC4899"; // Pink
      default:
        return "#6B7280"; // Gray
    }
  };

  // Get deal type icon
  const getDealTypeIcon = () => {
    switch (promotion.dealType) {
      case "PERCENTAGE_DISCOUNT":
        return "pricetag-outline";
      case "FIXED_DISCOUNT":
        return "cash";
      case "BOGO":
        return "gift";
      case "BUNDLE":
        return "albums";
      case "QUANTITY_DISCOUNT":
        return "layers";
      case "VOUCHER":
        return "ticket";
      default:
        return "pricetag";
    }
  };

  const dealTypeColor = getDealTypeColor();
  const dealTypeIcon = getDealTypeIcon();

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, { borderLeftColor: dealTypeColor }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.compactContent}>
          <View style={[styles.compactIcon, { backgroundColor: dealTypeColor + "20" }]}>
            <Ionicons name={dealTypeIcon as any} size={16} color={dealTypeColor} />
          </View>
          <View style={styles.compactInfo}>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {promotion.title}
            </Text>
            <Text style={[styles.compactDeal, { color: dealTypeColor }]} numberOfLines={1}>
              {formatDealDetails(promotion)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header with Deal Type Badge */}
      <View style={styles.header}>
        <View style={[styles.dealBadge, { backgroundColor: dealTypeColor }]}>
          <Ionicons name={dealTypeIcon as any} size={14} color="#ffffff" />
          <Text style={styles.dealBadgeText}>{formatDealDetails(promotion)}</Text>
        </View>
        {promotion.active && (
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Active</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title}>{promotion.title}</Text>

      {/* Description */}
      {promotion.description && (
        <Text style={styles.description} numberOfLines={2}>
          {promotion.description}
        </Text>
      )}

      {/* Deal Type Label */}
      <View style={styles.dealTypeRow}>
        <View style={[styles.dealTypeTag, { backgroundColor: dealTypeColor + "20" }]}>
          <Text style={[styles.dealTypeText, { color: dealTypeColor }]}>
            {getDealTypeLabel(promotion.dealType)}
          </Text>
        </View>
      </View>

      {/* Product and Store Info */}
      {(productName || storeName) && (
        <View style={styles.infoRow}>
          {productName && (
            <View style={styles.infoItem}>
              <Ionicons name="cube-outline" size={12} color="#6B7280" />
              <Text style={styles.infoText} numberOfLines={1}>
                {productName}
              </Text>
            </View>
          )}
          {storeName && (
            <View style={styles.infoItem}>
              <Ionicons name="storefront-outline" size={12} color="#6B7280" />
              <Text style={styles.infoText} numberOfLines={1}>
                {storeName}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Price Information */}
      {originalPrice > 0 && savings > 0 && (
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.originalPrice}>₱{originalPrice.toFixed(2)}</Text>
              <Text style={styles.finalPrice}>₱{finalPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.savingsBox}>
              <Text style={styles.savingsText}>Save {savingsPercent.toFixed(0)}%</Text>
              <Text style={styles.savingsAmount}>₱{savings.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Dates */}
      {promotion.startsAt && promotion.endsAt && (
        <View style={styles.datesRow}>
          <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
          <Text style={styles.datesText}>
            Valid: {new Date(promotion.startsAt).toLocaleDateString()} -{" "}
            {new Date(promotion.endsAt).toLocaleDateString()}
          </Text>
        </View>
      )}

      {/* Action Button */}
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: dealTypeColor }]}>
        <Text style={styles.actionButtonText}>View Details</Text>
        <Ionicons name="arrow-forward" size={16} color="#ffffff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Full Card Styles
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dealBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  dealBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  activeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 12,
  },
  dealTypeRow: {
    marginBottom: 12,
  },
  dealTypeTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dealTypeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
  },
  priceSection: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  originalPrice: {
    fontSize: 13,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  finalPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: "#10B981",
  },
  savingsBox: {
    alignItems: "flex-end",
  },
  savingsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
    marginBottom: 2,
  },
  savingsAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10B981",
  },
  datesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  datesText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },

  // Compact Card Styles
  compactCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  compactContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  compactIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },
  compactDeal: {
    fontSize: 12,
    fontWeight: "600",
  },
});


