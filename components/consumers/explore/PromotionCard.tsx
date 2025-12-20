import { useStore } from "@/features/store";
import { productsApi } from "@/services/api/endpoints/products";
import { promotionsApi } from "@/services/api/endpoints/promotions";
import { storesApi } from "@/services/api/endpoints/stores";
import type { PromotionRecommendationItemDto, PromotionResponseDto } from "@/services/api/types/swagger";
import { formatDealDetails, getDealTypeLabel } from "@/utils/dealTypes";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PromotionCardProps {
  promotion: PromotionRecommendationItemDto;
  onPress?: () => void;
}

export default function PromotionCard({ promotion, onPress }: PromotionCardProps) {
  const router = useRouter();
  const { state: { products } } = useStore();
  const [isNavigating, setIsNavigating] = useState(false);

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

  // Convert PromotionRecommendationItemDto to a format compatible with formatDealDetails
  const promotionForFormatting = useMemo((): PromotionResponseDto | null => {
    // Derive dealType from type field
    let dealType: "PERCENTAGE_DISCOUNT" | "FIXED_DISCOUNT" | "BOGO" | "BUNDLE" | "QUANTITY_DISCOUNT" | "VOUCHER" = "PERCENTAGE_DISCOUNT";
    
    if (promotion.type) {
      const typeUpper = String(promotion.type).toUpperCase();
      if (typeUpper.includes("PERCENTAGE") || typeUpper === "PERCENTAGE") {
        dealType = "PERCENTAGE_DISCOUNT";
      } else if (typeUpper.includes("FIXED") || typeUpper === "FIXED") {
        dealType = "FIXED_DISCOUNT";
      } else if (typeUpper.includes("BOGO")) {
        dealType = "BOGO";
      } else if (typeUpper.includes("BUNDLE")) {
        dealType = "BUNDLE";
      } else if (typeUpper.includes("QUANTITY")) {
        dealType = "QUANTITY_DISCOUNT";
      } else if (typeUpper.includes("VOUCHER")) {
        dealType = "VOUCHER";
      }
    }

    // Create a minimal PromotionResponseDto for formatting
    // Note: For complex deal types (BOGO, BUNDLE, etc.), we may not have all fields
    // so we'll use formatDealDetails with what we have, and it will fall back to "Special deal"
    const promo: PromotionResponseDto = {
      id: promotion.id,
      title: promotion.title,
      dealType,
      description: promotion.description,
      startsAt: promotion.startsAt,
      endsAt: promotion.endsAt,
      active: true,
      // Map discount to appropriate field based on dealType
      // Only set if discount is a valid number
      percentageOff: dealType === "PERCENTAGE_DISCOUNT" && promotion.discount != null && !isNaN(promotion.discount) ? promotion.discount : null,
      fixedAmountOff: dealType === "FIXED_DISCOUNT" && promotion.discount != null && !isNaN(promotion.discount) ? promotion.discount : null,
      voucherValue: dealType === "VOUCHER" && promotion.discount != null && !isNaN(promotion.discount) ? promotion.discount : null,
      // Legacy fields
      type: promotion.type,
      discount: promotion.discount,
    };

    return promo;
  }, [promotion]);

  const discountText = useMemo(() => {
    if (!promotionForFormatting) {
      // Fallback if promotion is invalid
      if (promotion.discount != null && !isNaN(promotion.discount)) {
        const promoType = promotion.type?.toUpperCase() || "PERCENTAGE";
        if (promoType.includes("FIXED") || promoType === "FIXED") {
          return `₱${promotion.discount} OFF`;
        }
        return `${promotion.discount}% OFF`;
      }
      return "Special Deal";
    }
    
    const dealType = promotionForFormatting.dealType;
    
    // For complex deal types (BOGO, BUNDLE, QUANTITY_DISCOUNT, VOUCHER), we may not have all required fields
    // Check if we have the necessary fields before using formatDealDetails
    const needsSpecialHandling = 
      (dealType === "BOGO" && (!promotionForFormatting.buyQuantity || !promotionForFormatting.getQuantity)) ||
      (dealType === "BUNDLE" && !promotionForFormatting.bundlePrice) ||
      (dealType === "QUANTITY_DISCOUNT" && (!promotionForFormatting.minQuantity || !promotionForFormatting.quantityDiscount)) ||
      (dealType === "VOUCHER" && !promotionForFormatting.voucherValue);
    
    if (needsSpecialHandling) {
      // For complex deal types without required fields, use the deal type label
      const label = getDealTypeLabel(dealType);
      return label || "Special Deal";
    }
    
    // Use formatDealDetails which handles all deal types properly
    const formatted = formatDealDetails(promotionForFormatting);
    
    // Check if formatted string contains "null", "undefined", or "NaN" (which means formatDealDetails got invalid values)
    if (formatted.includes("null") || formatted.includes("undefined") || formatted.includes("NaN")) {
      // For complex deal types, use the label
      if (dealType === "BOGO" || dealType === "BUNDLE" || dealType === "QUANTITY_DISCOUNT" || dealType === "VOUCHER") {
        const label = getDealTypeLabel(dealType);
        return label || "Special Deal";
      }
      // For simple deal types, fallback to simple format using discount field
      if (promotion.discount != null && !isNaN(promotion.discount)) {
        const promoType = promotion.type?.toUpperCase() || "PERCENTAGE";
        if (promoType.includes("FIXED") || promoType === "FIXED") {
          return `₱${promotion.discount} OFF`;
        }
        return `${promotion.discount}% OFF`;
      }
      return "Special Deal";
    }
    
    // If formatDealDetails returns "Special deal" and we have discount, use a fallback
    if (formatted === "Special deal" && promotion.discount != null && !isNaN(promotion.discount)) {
      // For complex deal types, use the label
      if (dealType === "BOGO" || dealType === "BUNDLE" || dealType === "QUANTITY_DISCOUNT" || dealType === "VOUCHER") {
        const label = getDealTypeLabel(dealType);
        return label || "Special Deal";
      }
      const promoType = promotion.type?.toUpperCase() || "PERCENTAGE";
      if (promoType.includes("FIXED") || promoType === "FIXED") {
        return `₱${promotion.discount} OFF`;
      }
      return `${promotion.discount}% OFF`;
    }
    
    return formatted;
  }, [promotionForFormatting, promotion.discount, promotion.type]);

  const dealTypeLabel = useMemo(() => {
    if (!promotionForFormatting) return "Special Deal";
    const label = getDealTypeLabel(promotionForFormatting.dealType);
    return label || "Special Deal";
  }, [promotionForFormatting]);

  const handleArrowPress = async (e: any) => {
    e.stopPropagation(); // Prevent card press from firing
    
    if (onPress) {
      onPress();
      return;
    }

    if (isNavigating) return;
    
    setIsNavigating(true);
    try {
      // Fetch full promotion details to get product information
      const promotionDetails: any = await promotionsApi.findPromotionById(promotion.id);
      
      // Extract productId from promotionProducts or productId field
      let productId = promotionDetails.productId ?? null;
      if (!productId && promotionDetails.promotionProducts && promotionDetails.promotionProducts.length > 0) {
        productId = promotionDetails.promotionProducts[0].productId ?? null;
      }
      
      if (productId) {
        // Find the product in the store state to get storeId
        let product = products.find((p) => p.id === productId);
        
        // If product not in state, try to fetch it
        if (!product) {
          try {
            const fetchedProduct = await productsApi.findProductById(productId);
            if (fetchedProduct) {
              product = fetchedProduct;
            }
          } catch (error) {
            console.error("Error fetching product:", error);
          }
        }
        
        if (product && product.storeId) {
          // Fetch store details to get the proper store name
          let storeName = "Store";
          try {
            const storeDetails = await storesApi.findStoreById(product.storeId);
            if (storeDetails && storeDetails.name) {
              storeName = storeDetails.name;
            }
          } catch (error) {
            console.error("Error fetching store details:", error);
          }
          
          // Navigate to the store details page with proper store name
          router.push({
            pathname: "/(consumers)/storedetails",
            params: {
              store: storeName,
              storeId: product.storeId.toString(),
            },
          });
        } else {
          console.warn("No store ID found for product:", productId);
        }
      } else {
        console.warn("No product ID found for promotion:", promotion.id);
      }
    } catch (error) {
      console.error("Error fetching promotion details:", error);
    } finally {
      setIsNavigating(false);
    }
  };

  const handlePress = async () => {
    if (onPress) {
      onPress();
      return;
    }

    // If no custom onPress handler, navigate to store (same as arrow button)
    if (isNavigating) return;
    
    setIsNavigating(true);
    try {
      // Fetch full promotion details to get product information
      const promotionDetails: any = await promotionsApi.findPromotionById(promotion.id);
      
      // Extract productId from promotionProducts or productId field
      let productId = promotionDetails.productId ?? null;
      if (!productId && promotionDetails.promotionProducts && promotionDetails.promotionProducts.length > 0) {
        productId = promotionDetails.promotionProducts[0].productId ?? null;
      }
      
      if (productId) {
        // Find the product in the store state to get storeId
        let product = products.find((p) => p.id === productId);
        
        // If product not in state, try to fetch it
        if (!product) {
          try {
            const fetchedProduct = await productsApi.findProductById(productId);
            if (fetchedProduct) {
              product = fetchedProduct;
            }
          } catch (error) {
            console.error("Error fetching product:", error);
          }
        }
        
        if (product && product.storeId) {
          // Fetch store details to get the proper store name
          let storeName = "Store";
          try {
            const storeDetails = await storesApi.findStoreById(product.storeId);
            if (storeDetails && storeDetails.name) {
              storeName = storeDetails.name;
            }
          } catch (error) {
            console.error("Error fetching store details:", error);
          }
          
          // Navigate to the store details page with proper store name
          router.push({
            pathname: "/(consumers)/storedetails",
            params: {
              store: storeName,
              storeId: product.storeId.toString(),
            },
          });
        } else {
          console.warn("No store ID found for product:", productId);
        }
      } else {
        console.warn("No product ID found for promotion:", promotion.id);
      }
    } catch (error) {
      console.error("Error fetching promotion details:", error);
    } finally {
      setIsNavigating(false);
    }
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
              {dealTypeLabel || promotion.description || "Promotion"}
            </Text>
          </View>
        </View>
        <View style={styles.discountBadge}>
          <Text style={styles.discountBadgeText} numberOfLines={1}>
            {discountText}
          </Text>
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
          onPress={handleArrowPress}
          disabled={isNavigating}
        >
          {isNavigating ? (
            <ActivityIndicator size="small" color="#277874" />
          ) : (
            <Ionicons name="arrow-forward-circle" size={20} color="#277874" />
          )}
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

