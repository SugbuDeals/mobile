import React from "react";
import {
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Modal } from "@/components/Modal";
import { colors, spacing, borderRadius, typography } from "@/styles/theme";
import type { Product } from "@/features/catalog/types";
import type { Promotion } from "@/features/store/promotions/types";

interface PromotionModalProps {
  promotion: Promotion;
  productPromotions: Array<{ product: Product; promotion: Promotion }>;
  onClose: () => void;
}

export default function PromotionModal({
  promotion,
  productPromotions,
  onClose,
}: PromotionModalProps) {
  const router = useRouter();

  const handleProductPress = (item: { product: Product; promotion: Promotion }) => {
    router.push({
      pathname: "/(consumers)/product",
      params: {
        name: item.product.name,
        storeId: item.product.storeId,
        price: item.product.price,
        description: item.product.description,
        productId: item.product.id,
        imageUrl: item.product.imageUrl || "",
        promotionId: item.promotion.id,
      },
    });
    onClose();
  };

  const getDiscountedPrice = (originalPrice: number, promo: Promotion) => {
    if (promo.type === "percentage") {
      return originalPrice * (1 - promo.discount / 100);
    } else {
      return Math.max(0, originalPrice - promo.discount);
    }
  };

  const primaryProduct = productPromotions[0]?.product;
  const primaryStoreId = primaryProduct?.storeId;
  const primaryStoreName = "Store";

  const handleStorePress = () => {
    if (!primaryStoreId) return;
    onClose();
    setTimeout(() => {
      router.push({
        pathname: "/(consumers)/storedetails",
        params: {
          storeId: primaryStoreId,
        },
      });
    }, 300);
  };

  const discountText =
    promotion.type === "percentage"
      ? `${promotion.discount}% OFF`
      : `₱${promotion.discount} OFF`;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={promotion.title}
      size="lg"
      variant="default"
    >
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{discountText}</Text>
          </View>
          {promotion.description && (
            <Text style={styles.description}>{promotion.description}</Text>
          )}
          {primaryStoreName && (
            <TouchableOpacity onPress={handleStorePress} style={styles.storeLink}>
              <Text style={styles.storeLinkText}>
                View Store: {primaryStoreName} →
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.productsList}>
          {productPromotions.map((item, idx) => {
            const originalPrice =
              typeof item.product.price === "string"
                ? parseFloat(item.product.price)
                : item.product.price ?? 0;
            if (!originalPrice) return null;
            const discountedPrice = getDiscountedPrice(originalPrice, item.promotion);

            return (
              <TouchableOpacity
                key={`${item.product.id}-${idx}`}
                style={styles.productCard}
                onPress={() => handleProductPress(item)}
                activeOpacity={0.7}
              >
                {item.product.imageUrl ? (
                  <Image
                    source={{ uri: item.product.imageUrl }}
                    style={styles.productImage}
                  />
                ) : (
                  <View style={styles.placeholderImage} />
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.originalPrice}>
                      ₱{originalPrice?.toFixed(2) ?? "0.00"}
                    </Text>
                    <Text style={styles.discountedPrice}>
                      ₱{discountedPrice.toFixed(2)}
                    </Text>
                  </View>
                  {item.product.description && (
                    <Text style={styles.productDescription} numberOfLines={2}>
                      {item.product.description}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    maxHeight: 500,
  },
  header: {
    marginBottom: spacing.lg,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  badgeText: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.base,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
    marginBottom: spacing.sm,
  },
  storeLink: {
    marginTop: spacing.sm,
  },
  storeLinkText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  productsList: {
    gap: spacing.md,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray200,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray200,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  originalPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textDecorationLine: "line-through",
  },
  discountedPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.successDark,
  },
  productDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },
});

