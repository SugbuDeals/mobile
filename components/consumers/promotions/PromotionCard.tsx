/**
 * Promotion Card Component
 * Displays promotion details for all 6 deal types
 */

import type { PromotionResponseDto } from "@/services/api/types/swagger";
import { calculatePromotionPrice, formatDealDetails, getDealTypeLabel } from "@/utils/dealTypes";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PromotionCardProps {
  promotion: PromotionResponseDto;
  productName?: string;
  productPrice?: number;
  onPress?: () => void;
}

export default function PromotionCard({ promotion, productName, productPrice, onPress }: PromotionCardProps) {
  const dealIcon = getDealIcon(promotion.dealType);
  const dealColor = getDealColor(promotion.dealType);

  // Calculate savings if product price is provided
  let savingsText = null;
  if (productPrice) {
    const finalPrice = calculatePromotionPrice(productPrice, promotion, 1);
    const savings = productPrice - finalPrice;
    if (savings > 0) {
      savingsText = `Save ₱${savings.toFixed(2)}`;
    }
  }

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Deal Type Badge */}
      <View style={[styles.dealBadge, { backgroundColor: dealColor }]}>
        <Ionicons name={dealIcon} size={24} color="#ffffff" />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{promotion.title}</Text>
        
        {promotion.description && (
          <Text style={styles.description} numberOfLines={2}>
            {promotion.description}
          </Text>
        )}

        {/* Deal Type Label */}
        <View style={styles.labelContainer}>
          <View style={[styles.label, { backgroundColor: `${dealColor}20` }]}>
            <Text style={[styles.labelText, { color: dealColor }]}>
              {getDealTypeLabel(promotion.dealType)}
            </Text>
          </View>
        </View>

        {/* Deal Details */}
        <View style={styles.dealDetailsContainer}>
          <View style={styles.dealDetails}>
            <Ionicons name="pricetag" size={16} color={dealColor} />
            <Text style={[styles.dealDetailsText, { color: dealColor }]}>
              {formatDealDetails(promotion)}
            </Text>
          </View>
          
          {savingsText && (
            <View style={styles.savings}>
              <Ionicons name="trending-down" size={14} color="#10B981" />
              <Text style={styles.savingsText}>{savingsText}</Text>
            </View>
          )}
        </View>

        {/* Product Name */}
        {productName && (
          <View style={styles.productInfo}>
            <Ionicons name="cube-outline" size={14} color="#6B7280" />
            <Text style={styles.productName}>{productName}</Text>
          </View>
        )}

        {/* Dates */}
        {promotion.endsAt && (
          <View style={styles.datesContainer}>
            <Ionicons name="time-outline" size={12} color="#9CA3AF" />
            <Text style={styles.datesText}>
              Ends {new Date(promotion.endsAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {/* Arrow */}
      <View style={styles.arrow}>
        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );
}

function getDealIcon(dealType: string): any {
  switch (dealType) {
    case "PERCENTAGE_DISCOUNT":
      return "pricetag-outline";
    case "FIXED_DISCOUNT":
      return "cash";
    case "BOGO":
      return "gift";
    case "BUNDLE":
      return "pricetags";
    case "QUANTITY_DISCOUNT":
      return "layers";
    case "VOUCHER":
      return "ticket";
    default:
      return "pricetag";
  }
}

function getDealColor(dealType: string): string {
  switch (dealType) {
    case "PERCENTAGE_DISCOUNT":
      return "#F59E0B";
    case "FIXED_DISCOUNT":
      return "#10B981";
    case "BOGO":
      return "#EC4899";
    case "BUNDLE":
      return "#8B5CF6";
    case "QUANTITY_DISCOUNT":
      return "#3B82F6";
    case "VOUCHER":
      return "#EF4444";
    default:
      return "#6B7280";
  }
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dealBadge: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
    lineHeight: 18,
  },
  labelContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  labelText: {
    fontSize: 11,
    fontWeight: "600",
  },
  dealDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  dealDetails: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dealDetailsText: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
  },
  savings: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
    marginLeft: 4,
  },
  productInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  productName: {
    fontSize: 12,
    color: "#374151",
    marginLeft: 6,
  },
  datesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  datesText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginLeft: 4,
  },
  arrow: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});

