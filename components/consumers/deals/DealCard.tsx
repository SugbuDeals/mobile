/**
 * DealCard Component Library
 * 
 * Provides different card designs for each deal type to help consumers
 * easily identify and understand the type of promotion they're viewing.
 * 
 * Each deal type has a unique:
 * - Color scheme
 * - Icon
 * - Layout
 * - Visual treatment
 */

import type { Product } from "@/features/catalog/types";
import type { PromotionResponseDto } from "@/services/api/types/swagger";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface DealCardProps {
  promotion: PromotionResponseDto;
  product?: Product;
  onPress?: () => void;
  compact?: boolean;
  storeName?: string;
}

/**
 * Main DealCard component that renders the appropriate card based on deal type
 */
export default function DealCard({ promotion, product, onPress, compact = false, storeName }: DealCardProps) {
  switch (promotion.dealType) {
    case "PERCENTAGE_DISCOUNT":
      return <PercentageDiscountCard promotion={promotion} product={product} onPress={onPress} compact={compact} storeName={storeName} />;
    case "FIXED_DISCOUNT":
      return <FixedDiscountCard promotion={promotion} product={product} onPress={onPress} compact={compact} storeName={storeName} />;
    case "BOGO":
      return <BOGOCard promotion={promotion} product={product} onPress={onPress} compact={compact} storeName={storeName} />;
    case "BUNDLE":
      return <BundleCard promotion={promotion} product={product} onPress={onPress} compact={compact} storeName={storeName} />;
    case "QUANTITY_DISCOUNT":
      return <QuantityDiscountCard promotion={promotion} product={product} onPress={onPress} compact={compact} storeName={storeName} />;
    case "VOUCHER":
      return <VoucherCard promotion={promotion} product={product} onPress={onPress} compact={compact} storeName={storeName} />;
    default:
      return <DefaultCard promotion={promotion} product={product} onPress={onPress} compact={compact} storeName={storeName} />;
  }
}

/**
 * PERCENTAGE_DISCOUNT Card
 * Color: Orange/Amber gradient
 * Icon: Percent badge
 */
function PercentageDiscountCard({ promotion, product, onPress, compact, storeName }: DealCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, compact && styles.cardCompact]}
    >
      <LinearGradient
        colors={["#FFA726", "#FF9800"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: "rgba(255, 255, 255, 0.3)" }]}>
            <Ionicons name="calculator-outline" size={16} color="#ffffff" />
          </View>
          <Text style={styles.dealTypeLabel}>Percentage Off</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.discountText}>{promotion.percentageOff}% OFF</Text>
          <Text style={styles.titleText} numberOfLines={2}>
            {promotion.title}
          </Text>
          {promotion.description && (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {promotion.description}
            </Text>
          )}
        </View>

        {storeName && (
          <View style={styles.storeBadge}>
            <Ionicons name="storefront" size={10} color="#ffffff" />
            <Text style={styles.storeBadgeText} numberOfLines={1}>
              {storeName}
            </Text>
          </View>
        )}

        {product?.imageUrl && (
          <View style={styles.productImageContainer}>
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

/**
 * FIXED_DISCOUNT Card
 * Color: Green gradient
 * Icon: Cash/Money
 */
function FixedDiscountCard({ promotion, product, onPress, compact, storeName }: DealCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, compact && styles.cardCompact]}
    >
      <LinearGradient
        colors={["#66BB6A", "#4CAF50"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: "rgba(255, 255, 255, 0.3)" }]}>
            <Ionicons name="cash-outline" size={16} color="#ffffff" />
          </View>
          <Text style={styles.dealTypeLabel}>Fixed Discount</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.discountText}>₱{promotion.fixedAmountOff} OFF</Text>
          <Text style={styles.titleText} numberOfLines={2}>
            {promotion.title}
          </Text>
          {promotion.description && (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {promotion.description}
            </Text>
          )}
        </View>

        {storeName && (
          <View style={styles.storeBadge}>
            <Ionicons name="storefront" size={10} color="#ffffff" />
            <Text style={styles.storeBadgeText} numberOfLines={1}>
              {storeName}
            </Text>
          </View>
        )}

        {product?.imageUrl && (
          <View style={styles.productImageContainer}>
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

/**
 * BOGO Card
 * Color: Purple gradient
 * Icon: Gift
 */
function BOGOCard({ promotion, product, onPress, compact, storeName }: DealCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, compact && styles.cardCompact]}
    >
      <LinearGradient
        colors={["#AB47BC", "#9C27B0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: "rgba(255, 255, 255, 0.3)" }]}>
            <Ionicons name="gift-outline" size={16} color="#ffffff" />
          </View>
          <Text style={styles.dealTypeLabel}>BOGO Deal</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.discountText}>
            Buy {promotion.buyQuantity} Get {promotion.getQuantity}
          </Text>
          <Text style={styles.titleText} numberOfLines={2}>
            {promotion.title}
          </Text>
          {promotion.description && (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {promotion.description}
            </Text>
          )}
        </View>

        {storeName && (
          <View style={styles.storeBadge}>
            <Ionicons name="storefront" size={10} color="#ffffff" />
            <Text style={styles.storeBadgeText} numberOfLines={1}>
              {storeName}
            </Text>
          </View>
        )}

        {product?.imageUrl && (
          <View style={styles.productImageContainer}>
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

/**
 * BUNDLE Card
 * Color: Blue gradient
 * Icon: Apps/Grid
 */
function BundleCard({ promotion, product, onPress, compact, storeName }: DealCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, compact && styles.cardCompact]}
    >
      <LinearGradient
        colors={["#42A5F5", "#2196F3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: "rgba(255, 255, 255, 0.3)" }]}>
            <Ionicons name="apps-outline" size={16} color="#ffffff" />
          </View>
          <Text style={styles.dealTypeLabel}>Bundle Deal</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.discountText}>₱{promotion.bundlePrice}</Text>
          <Text style={styles.titleText} numberOfLines={2}>
            {promotion.title}
          </Text>
          {promotion.description && (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {promotion.description}
            </Text>
          )}
        </View>

        {storeName && (
          <View style={styles.storeBadge}>
            <Ionicons name="storefront" size={10} color="#ffffff" />
            <Text style={styles.storeBadgeText} numberOfLines={1}>
              {storeName}
            </Text>
          </View>
        )}

        {product?.imageUrl && (
          <View style={styles.productImageContainer}>
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

/**
 * QUANTITY_DISCOUNT Card
 * Color: Teal gradient
 * Icon: Layers/Stack
 */
function QuantityDiscountCard({ promotion, product, onPress, compact, storeName }: DealCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, compact && styles.cardCompact]}
    >
      <LinearGradient
        colors={["#26A69A", "#009688"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: "rgba(255, 255, 255, 0.3)" }]}>
            <Ionicons name="layers-outline" size={16} color="#ffffff" />
          </View>
          <Text style={styles.dealTypeLabel}>Bulk Discount</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.discountText}>
            Buy {promotion.minQuantity}+ Get {promotion.quantityDiscount}% OFF
          </Text>
          <Text style={styles.titleText} numberOfLines={2}>
            {promotion.title}
          </Text>
          {promotion.description && (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {promotion.description}
            </Text>
          )}
        </View>

        {storeName && (
          <View style={styles.storeBadge}>
            <Ionicons name="storefront" size={10} color="#ffffff" />
            <Text style={styles.storeBadgeText} numberOfLines={1}>
              {storeName}
            </Text>
          </View>
        )}

        {product?.imageUrl && (
          <View style={styles.productImageContainer}>
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

/**
 * VOUCHER Card
 * Color: Red/Pink gradient
 * Icon: Ticket
 * Note: Special design as vouchers are store-specific
 */
function VoucherCard({ promotion, product, onPress, compact, storeName }: DealCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, compact && styles.cardCompact]}
    >
      <LinearGradient
        colors={["#EF5350", "#E53935"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        {/* Ticket notches */}
        <View style={styles.ticketNotchLeft} />
        <View style={styles.ticketNotchRight} />
        
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: "rgba(255, 255, 255, 0.3)" }]}>
            <Ionicons name="ticket-outline" size={16} color="#ffffff" />
          </View>
          <Text style={styles.dealTypeLabel}>Store Voucher</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.discountText}>₱{promotion.voucherValue}</Text>
          <Text style={styles.voucherSubtext}>Voucher Value</Text>
          <Text style={styles.titleText} numberOfLines={2}>
            {promotion.title}
          </Text>
          {promotion.description && (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {promotion.description}
            </Text>
          )}
        </View>

        {storeName && (
          <View style={styles.storeBadge}>
            <Ionicons name="storefront" size={10} color="#ffffff" />
            <Text style={styles.storeBadgeText} numberOfLines={1}>
              {storeName}
            </Text>
          </View>
        )}

        {/* Dashed line for ticket effect */}
        <View style={styles.dashedLine} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

/**
 * Default/Fallback Card
 */
function DefaultCard({ promotion, product, onPress, compact, storeName }: DealCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, compact && styles.cardCompact]}
    >
      <View style={[styles.gradientCard, { backgroundColor: "#FFBE5D" }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: "rgba(255, 255, 255, 0.3)" }]}>
            <Ionicons name="pricetag-outline" size={16} color="#ffffff" />
          </View>
          <Text style={styles.dealTypeLabel}>Special Deal</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.titleText} numberOfLines={2}>
            {promotion.title}
          </Text>
          {promotion.description && (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {promotion.description}
            </Text>
          )}
        </View>

        {storeName && (
          <View style={styles.storeBadge}>
            <Ionicons name="storefront" size={10} color="#ffffff" />
            <Text style={styles.storeBadgeText} numberOfLines={1}>
              {storeName}
            </Text>
          </View>
        )}

        {product?.imageUrl && (
          <View style={styles.productImageContainer}>
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    height: 140,
    marginHorizontal: 6,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  cardCompact: {
    width: 160,
    height: 120,
  },
  gradientCard: {
    flex: 1,
    padding: 12,
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  dealTypeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardContent: {
    flex: 1,
  },
  discountText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 2,
  },
  voucherSubtext: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 6,
  },
  titleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 2,
  },
  descriptionText: {
    fontSize: 10,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 13,
  },
  productImageContainer: {
    position: "absolute",
    bottom: -8,
    right: -8,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    opacity: 0.3,
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  // Voucher-specific styles
  ticketNotchLeft: {
    position: "absolute",
    left: -8,
    top: "50%",
    marginTop: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  ticketNotchRight: {
    position: "absolute",
    right: -8,
    top: "50%",
    marginTop: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  dashedLine: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 40,
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  // Store badge styles
  storeBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  storeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
  },
});

