import SectionHeader from "@/components/SectionHeader";
import type { Product } from "@/features/catalog/types";
import type { Promotion } from "@/features/store/promotions/types";
import { borderRadius, colors, spacing, typography } from "@/styles/theme";
import { useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RecommendationsSectionProps {
  products: Product[];
  promotions: Promotion[];
  onPromotionPress: (
    promotion: Promotion,
    productPromotions: { product: Product; promotion: Promotion }[]
  ) => void;
}

export default function RecommendationsSection({
  products,
  promotions,
  onPromotionPress,
}: RecommendationsSectionProps) {
  const router = useRouter();

  // Group promotions by product
  const productPromotionsMap = new Map<
    number,
    { product: Product; promotion: Promotion }[]
  >();

  promotions.forEach((promo) => {
    const product = products.find((p) => p.id === promo.productId);
    if (product) {
      const existing = productPromotionsMap.get(product.id) || [];
      productPromotionsMap.set(product.id, [...existing, { product, promotion: promo }]);
    }
  });

  const productPromotions = Array.from(productPromotionsMap.values()).flat();

  if (productPromotions.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <SectionHeader title="Best Deals" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {productPromotions.map((item, idx) => {
          const discountLabel =
            item.promotion.type === "percentage"
              ? `${item.promotion.discount ?? 0}% OFF`
              : `₱${item.promotion.discount ?? 0} OFF`;
          const originalPrice =
            typeof item.product.price === "string"
              ? parseFloat(item.product.price)
              : item.product.price ?? 0;
          if (!originalPrice) return null;
          const discountValue = item.promotion.discount ?? 0;
          const discountedPrice =
            item.promotion.type === "percentage"
              ? originalPrice * (1 - discountValue / 100)
              : Math.max(0, originalPrice - discountValue);

          return (
            <TouchableOpacity
              key={`${item.product.id}-${item.promotion.id}-${idx}`}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => onPromotionPress(item.promotion, [item])}
            >
              {item.product.imageUrl ? (
                <Image
                  source={{ uri: item.product.imageUrl }}
                  style={styles.image}
                />
              ) : (
                <View style={styles.placeholderImage} />
              )}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{discountLabel}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.product.name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.originalPrice}>
                    ₱{originalPrice?.toFixed(2) ?? "0.00"}
                  </Text>
                  <Text style={styles.discountedPrice}>
                    ₱{discountedPrice.toFixed(2)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    width: 180,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginRight: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 140,
    backgroundColor: colors.gray100,
  },
  placeholderImage: {
    width: "100%",
    height: 140,
    backgroundColor: colors.gray200,
  },
  badge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  badgeText: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.xs,
  },
  cardContent: {
    padding: spacing.md,
  },
  productName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  originalPrice: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    textDecorationLine: "line-through",
  },
  discountedPrice: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.successDark,
  },
});

