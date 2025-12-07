import { useCatalog } from "@/features/catalog";
import { useStore } from "@/features/store";
import type { Promotion } from "@/features/store/promotions/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function AllRecommendations() {
  const router = useRouter();
  const {
    state: { products },
  } = useCatalog();
  const {
    state: { activePromotions },
    action: { findActivePromotions },
  } = useStore();

  useEffect(() => {
    findActivePromotions();
  }, [findActivePromotions]);

  // Create a map to quickly find promotions by productId
  const promotionMap = useMemo(() => {
    const map = new Map<number, Promotion>();
    activePromotions.forEach(promotion => {
      if (promotion.productId !== null) {
        map.set(promotion.productId, promotion);
      }
    });
    return map;
  }, [activePromotions]);

  // Calculate discounted price
  const getDiscountedPrice = (originalPrice: number, promotion: Promotion) => {
    if (promotion.type === 'percentage') {
      return originalPrice * (1 - promotion.discount / 100);
    } else {
      return Math.max(0, originalPrice - promotion.discount);
    }
  };

  // Create combined list of products with promotion info
  const displayItems = useMemo(() => {
    const items = products.map(product => ({
      product,
      isPromoted: promotionMap.has(product.id),
      promotion: promotionMap.get(product.id),
    }));

    // Sort: promoted items first, then regular products
    return items.sort((a, b) => {
      if (a.isPromoted && !b.isPromoted) return -1;
      if (!a.isPromoted && b.isPromoted) return 1;
      return 0;
    });
  }, [products, promotionMap]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recommended</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {displayItems.map(({ product, isPromoted, promotion }) => {
          const displayPrice = isPromoted && promotion && product.price
            ? getDiscountedPrice(product.price, promotion)
            : product.price;

          return (
            <View key={product.id} style={[styles.card, isPromoted && styles.promotedCard]}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: "/(consumers)/product",
                    params: {
                      name: product.name,
                      storeId: product.storeId,
                      price: product.price,
                      description: product.description,
                      productId: product.id,
                      imageUrl: product.imageUrl || "",
                      ...(isPromoted && promotion ? { promotionId: promotion.id } : {}),
                    },
                  })
                }
              >
                <View style={styles.imageWrap}>
                  <Image
                    source={
                      product.imageUrl
                        ? { uri: product.imageUrl }
                        : require("../../assets/images/react-logo.png")
                    }
                    style={styles.image}
                  />
                  {isPromoted && promotion ? (
                    <View style={styles.promotionBadge}>
                      <Text style={styles.promotionBadgeText}>
                        {promotion.type === 'percentage' 
                          ? `${promotion.discount}% OFF` 
                          : `₱${promotion.discount} OFF`}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.badge}>New</Text>
                  )}
                </View>
                <View style={styles.storeRow}>
                  <View style={styles.storeLogo}>
                    <Image
                      source={require("../../assets/images/icon.png")}
                      style={styles.storeLogoImg}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.storeName}>
                      {"SugbuDeals"}
                    </Text>
                    <Text style={styles.storeDesc}>
                      {"Local Store"}
                    </Text>
                  </View>
                  <View style={styles.activePill}>
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                </View>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {product.name}
                </Text>
                {displayPrice != null && (
                  <View style={styles.priceContainer}>
                    {isPromoted && product.price && (
                      <Text style={styles.originalPrice}>
                        ₱{Number(product.price).toFixed(2)}
                      </Text>
                    )}
                    <Text style={[styles.price, isPromoted && styles.discountedPrice]}>
                      ₱{Number(displayPrice).toFixed(2)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  backBtn: { padding: 4, borderRadius: 999 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  grid: { paddingHorizontal: 20, paddingBottom: 120, rowGap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  imageWrap: {
    position: "relative",
    width: "100%",
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#1B6F5D",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 30,
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    columnGap: 10,
  },
  storeLogo: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  storeLogoImg: { width: 18, height: 18, resizeMode: "contain" },
  storeName: { fontWeight: "700", fontSize: 14 },
  storeDesc: { color: "#6B7280", fontSize: 12 },
  activePill: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  activeText: { color: "#1B6F5D", fontWeight: "700", fontSize: 12 },
  itemTitle: { paddingHorizontal: 12, paddingTop: 10, fontWeight: "700" },
  price: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    color: "#1B6F5D",
    fontWeight: "900",
  },
  // Promoted Product Styles
  promotedCard: {
    borderWidth: 2,
    borderColor: "#FFBE5D",
  },
  promotionBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#FFBE5D",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 1,
  },
  promotionBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  originalPrice: {
    fontSize: 13,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  discountedPrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#10B981",
  },
});
