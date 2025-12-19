import Card from "@/components/Card";
import DealBadge from "@/components/consumers/deals/DealBadge";
import DealCard from "@/components/consumers/deals/DealCard";
import { NearbyStores } from "@/components/consumers/home";
import { useLogin } from "@/features/auth";
import { useCatalog } from "@/features/catalog";
import type { Category, Product } from "@/features/catalog/types";
import { useStore } from "@/features/store";
import type { Promotion } from "@/features/store/promotions/types";
import { useAsyncEffect } from "@/hooks/useAsyncEffect";
import { useStableThunk } from "@/hooks/useStableCallback";
import { viewsApi } from "@/services/api/endpoints/views";
import { filterPromotionsByPlacement, sortPromotionsByPriority } from "@/utils/dealPlacement";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Router = ReturnType<typeof useRouter>;

const STATIC_CATEGORIES: Category[] = [
  { id: 1001, name: "Groceries", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 1002, name: "Electronics", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 1003, name: "Fashion", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 1004, name: "Home", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 1005, name: "Furniture", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 1006, name: "Decor", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// Map category names to icons
const getCategoryIcon = (categoryName: string): keyof typeof Ionicons.glyphMap => {
  const name = categoryName.toLowerCase().trim();
  
  // Food & Groceries
  if (name.includes("grocery") || name.includes("food") || name.includes("grocery")) {
    return "storefront";
  }
  if (name.includes("restaurant") || name.includes("dining") || name.includes("meal")) {
    return "restaurant";
  }
  if (name.includes("beverage") || name.includes("drink")) {
    return "wine";
  }
  
  // Electronics
  if (name.includes("electronic") || name.includes("tech") || name.includes("device")) {
    return "phone-portrait";
  }
  if (name.includes("computer") || name.includes("laptop")) {
    return "laptop";
  }
  if (name.includes("phone") || name.includes("mobile")) {
    return "phone-portrait";
  }
  if (name.includes("tv") || name.includes("television")) {
    return "tv";
  }
  
  // Fashion & Clothing
  if (name.includes("fashion") || name.includes("clothing") || name.includes("apparel")) {
    return "shirt";
  }
  if (name.includes("shoe") || name.includes("footwear")) {
    return "footsteps";
  }
  if (name.includes("accessory") || name.includes("jewelry")) {
    return "diamond";
  }
  
  // Home & Furniture
  if (name.includes("home") || name.includes("house")) {
    return "home";
  }
  if (name.includes("furniture") || name.includes("sofa") || name.includes("chair")) {
    return "cube";
  }
  if (name.includes("decor") || name.includes("decoration") || name.includes("ornament")) {
    return "color-palette";
  }
  if (name.includes("kitchen") || name.includes("cookware")) {
    return "restaurant";
  }
  if (name.includes("bedroom") || name.includes("bed")) {
    return "bed";
  }
  if (name.includes("bathroom") || name.includes("bath")) {
    return "water";
  }
  
  // Health & Beauty
  if (name.includes("health") || name.includes("medical") || name.includes("pharmacy")) {
    return "medical";
  }
  if (name.includes("beauty") || name.includes("cosmetic") || name.includes("makeup")) {
    return "sparkles";
  }
  
  // Sports & Outdoors
  if (name.includes("sport") || name.includes("fitness") || name.includes("gym")) {
    return "barbell";
  }
  if (name.includes("outdoor") || name.includes("camping")) {
    return "trail-sign";
  }
  
  // Books & Education
  if (name.includes("book") || name.includes("education") || name.includes("stationery")) {
    return "library";
  }
  
  // Toys & Games
  if (name.includes("toy") || name.includes("game")) {
    return "game-controller";
  }
  
  // Automotive
  if (name.includes("auto") || name.includes("car") || name.includes("vehicle")) {
    return "car";
  }
  
  // Pets
  if (name.includes("pet") || name.includes("animal")) {
    return "paw";
  }
  
  // Garden
  if (name.includes("garden") || name.includes("plant") || name.includes("flower")) {
    return "leaf";
  }
  
  // Tools
  if (name.includes("tool") || name.includes("hardware")) {
    return "construct";
  }
  
  // Default icon
  return "grid";
};

export default function Home() {
  const router = useRouter();
  const {
    state: { user },
  } = useLogin();
  const {
    state: { nearbyStores, loading, activePromotions, currentTier, stores },
    action: { findNearbyStores, findActivePromotions, getCurrentTier, findStores },
  } = useStore();
  const {
    state: { categories, products },
    action: { loadCategories, loadProducts },
  } = useCatalog();

  // Stable thunk references
  const stableFindNearbyStores = useStableThunk(findNearbyStores);
  const stableFindActivePromotions = useStableThunk(findActivePromotions);
  const stableLoadCategories = useStableThunk(loadCategories);
  const stableLoadProducts = useStableThunk(loadProducts);
  const stableFindStores = useStableThunk(findStores);

  const [selectedPromotion, setSelectedPromotion] = useState<{
    promotion: Promotion;
    productPromotions: { product: Product; promotion: Promotion }[];
  } | null>(null);

  // Auto-determine radius based on tier (BASIC: 1km, PRO: 3km)
  // Default to 1km (BASIC) if tier not loaded yet to avoid errors
  const radiusKm = useMemo(() => {
    if (currentTier?.tier === "PRO") {
      return 3; // PRO tier allows up to 3km
    }
    return 1; // BASIC tier allows up to 1km (default)
  }, [currentTier?.tier]);

  // Load initial data
  useAsyncEffect(async () => {
    // Fetch tier first (don't await - let it load in background)
    getCurrentTier();
    // Load all stores first so products/deals can verify store status immediately
    stableFindStores();
    stableLoadCategories();
    stableLoadProducts();
    stableFindActivePromotions();
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        // Use tier-based radius (defaults to 1km if tier not loaded yet)
        // This ensures we never exceed BASIC tier limits
        await stableFindNearbyStores({ 
          latitude: pos.coords.latitude, 
          longitude: pos.coords.longitude, 
          radiusKm: radiusKm 
        });
      }
    } catch (error) {
      // Silently handle location errors
      console.warn("Location permission error:", error);
    }
  }, [stableFindStores, stableLoadCategories, stableLoadProducts, stableFindActivePromotions, stableFindNearbyStores, getCurrentTier, radiusKm]);

  // Refresh promotions when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      stableFindActivePromotions();
    }, [stableFindActivePromotions])
  );

  const displayName =
    user?.name || user?.email || "there";
  const displayCategories =
    categories?.length > 0 ? categories : STATIC_CATEGORIES;

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Greeting name={displayName} />
        <Categories categories={displayCategories.slice(0, 4)} router={router} />
        <Recommendations 
          products={products || []}
          promotions={activePromotions || []}
          stores={stores || []}
      onPromotionPress={(promotion, productPromotions) => 
        setSelectedPromotion({ promotion, productPromotions })
      }
          router={router} 
        />
        <NearbyStores stores={nearbyStores || []} loading={loading} />
      </ScrollView>
      
      {/* Promotion Products Overlay */}
      {selectedPromotion && (
        <PromotionModal
          promotion={selectedPromotion.promotion}
          productPromotions={selectedPromotion.productPromotions}
          onClose={() => setSelectedPromotion(null)}
          router={router}
        />
      )}
    </>
  );
}

function Greeting({ name }: { name: string }) {
  return (
    <View style={styles.greetingSection}>
      <View style={styles.greetingContent}>
        <View style={styles.greetingTextContainer}>
          <Text style={styles.greetingTitle}>Hello, {name}! 👋</Text>
          <Text style={styles.greetingSubtitle}>
            What would you like to shop today?
          </Text>
        </View>
        <View style={styles.greetingDecoration}>
          <Ionicons name="sparkles" size={32} color="#FFBE5D" />
        </View>
      </View>
    </View>
  );
}

function Categories({ categories, router }: { categories: Category[]; router: Router }) {
  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: "/(consumers)/categories",
      params: {
        category: category.name,
      },
    });
  };

  return (
    <View style={styles.section}>
      <SectionHeader 
        title="Categories" 
        linkText="See All" 
        onPress={() => router.push("/(consumers)/categories")}
      />
      <View style={styles.grid}>
        {categories.map((cat) => {
          const iconName = getCategoryIcon(cat.name);
          return (
            <View key={cat.id} style={styles.gridItem}>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => handleCategoryPress(cat)}
                style={styles.categoryButton}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name={iconName} size={26} color="#277874" />
                </View>
              </TouchableOpacity>
              <Text style={styles.caption} numberOfLines={1}>
                {cat.name}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function PromotionModal({
  promotion,
  productPromotions,
  onClose,
  router,
}: {
  promotion: Promotion;
  productPromotions: { product: Product; promotion: Promotion }[];
  onClose: () => void;
  router: Router;
}) {
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

  // Record view when promotion modal is opened
  useEffect(() => {
    if (promotion?.id && Number.isFinite(promotion.id) && promotion.id > 0) {
      viewsApi.recordView({
        entityType: "PROMOTION",
        entityId: promotion.id,
      }).catch((error) => {
        // Silently fail - view recording is not critical
        console.debug("Failed to record promotion view:", error);
      });
    }
  }, [promotion?.id]);

  // Get deal-specific information for display
  const getDealInfo = (promo: Promotion, productPrice: number | string) => {
    const price = typeof productPrice === 'string' ? parseFloat(productPrice) : productPrice;
    if (!isFinite(price)) return null;

    // Handle new dealType field
    if (promo.dealType) {
      switch (promo.dealType) {
        case "PERCENTAGE_DISCOUNT":
          const percentOff = promo.percentageOff ?? 0;
          return {
            type: 'percentage',
            showPrice: true,
            showStrikethrough: true,
            originalPrice: price,
            finalPrice: price * (1 - percentOff / 100),
            label: `${percentOff}% OFF`,
          };
        
        case "FIXED_DISCOUNT":
          const amountOff = promo.fixedAmountOff ?? 0;
          return {
            type: 'fixed',
            showPrice: true,
            showStrikethrough: true,
            originalPrice: price,
            finalPrice: Math.max(0, price - amountOff),
            label: `₱${amountOff} OFF`,
          };
        
        case "BOGO":
          return {
            type: 'bogo',
            showPrice: true,
            showStrikethrough: false, // No strikethrough for BOGO
            originalPrice: price,
            message: `Buy ${promo.buyQuantity ?? 1} Get ${promo.getQuantity ?? 1} Free`,
            label: "BOGO",
          };
        
        case "BUNDLE":
          return {
            type: 'bundle',
            showPrice: false, // Will show all products separately
            bundlePrice: promo.bundlePrice,
            message: `Bundle Deal`,
            label: `₱${promo.bundlePrice}`,
          };
        
        case "QUANTITY_DISCOUNT":
          const quantityDiscount = promo.quantityDiscount ?? 0;
          const minQty = promo.minQuantity ?? 2;
          return {
            type: 'quantity',
            showPrice: true,
            showStrikethrough: true,
            originalPrice: price,
            finalPrice: price * (1 - quantityDiscount / 100),
            message: `Buy ${minQty}+ get ${quantityDiscount}% off`,
            label: "Bulk Deal",
          };
        
        case "VOUCHER":
          return {
            type: 'voucher',
            showPrice: true,
            showStrikethrough: false,
            originalPrice: price,
            message: `₱${promo.voucherValue} Voucher`,
            label: "Voucher",
          };
        
        default:
          return null;
      }
    }

    // Fallback to legacy type/discount fields
    const discount = promo.discount ?? 0;
    const type = String(promo.type || "").toLowerCase();
    
    if (type === 'percentage') {
      return {
        type: 'percentage',
        showPrice: true,
        showStrikethrough: true,
        originalPrice: price,
        finalPrice: price * (1 - discount / 100),
        label: `${discount}% OFF`,
      };
    } else if (type === 'fixed') {
      return {
        type: 'fixed',
        showPrice: true,
        showStrikethrough: true,
        originalPrice: price,
        finalPrice: Math.max(0, price - discount),
        label: `₱${discount} OFF`,
      };
    }

    return null;
  };

  const primaryProduct = productPromotions[0]?.product;
  const primaryStoreId = primaryProduct?.storeId;
  const primaryStoreName = "Store";

  const handleStorePress = () => {
    if (!primaryStoreId) return;
    // Close modal first, then navigate
    onClose();
    // Use setTimeout to ensure modal closes before navigation
    setTimeout(() => {
      router.push({
        pathname: "/(consumers)/storedetails",
        params: {
          store: primaryStoreName,
          storeId: primaryStoreId,
        },
      });
    }, 100);
  };

  // Get icon for deal type
  const getDealIconName = (dealType: string) => {
    switch (dealType) {
      case "PERCENTAGE_DISCOUNT":
        return "percent-outline" as const;
      case "FIXED_DISCOUNT":
        return "cash-outline" as const;
      case "BOGO":
        return "gift-outline" as const;
      case "BUNDLE":
        return "apps-outline" as const;
      case "QUANTITY_DISCOUNT":
        return "layers-outline" as const;
      case "VOUCHER":
        return "ticket-outline" as const;
      default:
        return "pricetag-outline" as const;
    }
  };

  // Get label for deal type
  const getDealTypeLabel = (dealType?: string): string => {
    if (!dealType) return "Special Prices";
    switch (dealType) {
      case "PERCENTAGE_DISCOUNT":
        return "Percentage Discount";
      case "FIXED_DISCOUNT":
        return "Fixed Discount";
      case "BOGO":
        return "Buy One Get One";
      case "BUNDLE":
        return "Bundle Deal";
      case "QUANTITY_DISCOUNT":
        return "Bulk Discount";
      case "VOUCHER":
        return "Voucher";
      default:
        return "Special Deal";
    }
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderGradient}>
              <View style={styles.modalHeaderTitleRow}>
                {promotion.dealType && (
                  <Ionicons 
                    name={getDealIconName(promotion.dealType) as any} 
                    size={24} 
                    color="#ffffff" 
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text style={styles.modalHeaderTitle}>{promotion.title}</Text>
              </View>
              <View style={styles.modalHeaderDiscountContainer}>
                <Text style={styles.modalHeaderDiscount}>
                  {getDealTypeLabel(promotion.dealType)}
                </Text>
              </View>
              {promotion.description && (
                <Text style={styles.modalHeaderDescription}>{promotion.description}</Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

        {!!primaryProduct && (
          <View style={styles.modalStoreCard}>
            <View>
              <Text style={styles.modalStoreLabel}>Promotion from</Text>
              <Text style={styles.modalStoreName} numberOfLines={1}>
                {primaryStoreName}
              </Text>
            </View>
            {!!primaryStoreId && (
              <TouchableOpacity
                onPress={handleStorePress}
                style={styles.modalStoreButton}
                accessibilityRole="button"
              >
                <Text style={styles.modalStoreButtonText}>Visit Store</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
          
          <ScrollView style={styles.modalProducts}>
            {/* Bundle Deal - Show all products with bundle price */}
            {promotion.dealType === 'BUNDLE' && (
              <View style={styles.modalBundleContainer}>
                <View style={styles.modalBundleHeader}>
                  <Ionicons name="apps" size={20} color="#42A5F5" />
                  <Text style={styles.modalBundleTitle}>Bundle Includes:</Text>
                </View>
                {productPromotions.map(({ product }) => (
                  <View key={product.id} style={styles.modalBundleItem}>
                    <Image
                      source={
                        product.imageUrl
                          ? { uri: product.imageUrl }
                          : require("../../assets/images/react-logo.png")
                      }
                      style={styles.modalBundleItemImage}
                    />
                    <View style={styles.modalBundleItemInfo}>
                      <Text style={styles.modalBundleItemName} numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text style={styles.modalBundleItemPrice}>
                        ₱{Number(product.price).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
                <View style={styles.modalBundleTotal}>
                  <Text style={styles.modalBundleTotalLabel}>Bundle Price:</Text>
                  <Text style={styles.modalBundleTotalPrice}>
                    ₱{promotion.bundlePrice?.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {/* Regular Deal Types - Show each product */}
            {promotion.dealType !== 'BUNDLE' && productPromotions.map(({ product, promotion: productPromo }) => {
              const dealInfo = product.price ? getDealInfo(productPromo, product.price) : null;
              return (
                <TouchableOpacity
                  key={product.id}
                  style={styles.modalProductCard}
                  onPress={() => handleProductPress({ product, promotion: productPromo })}
                  activeOpacity={0.8}
                >
                  <View style={styles.modalProductImageContainer}>
                    <Image
                      source={
                        product.imageUrl
                          ? { uri: product.imageUrl }
                          : require("../../assets/images/react-logo.png")
                      }
                      style={styles.modalProductImage}
                    />
                    {productPromo.dealType && (
                      <View style={styles.modalProductBadge}>
                        <DealBadge dealType={productPromo.dealType} size="small" />
                      </View>
                    )}
                  </View>
                  <View style={styles.modalProductInfo}>
                    <Text style={styles.modalProductName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    
                    {/* BOGO - Show original price only, no strikethrough */}
                    {dealInfo?.type === 'bogo' && (
                      <View style={styles.modalProductPriceRow}>
                        <Text style={styles.modalProductRegularPrice}>
                          ₱{dealInfo.originalPrice?.toFixed(2)}
                        </Text>
                        <Text style={styles.modalProductDealMessage}>
                          {dealInfo.message}
                        </Text>
                      </View>
                    )}

                    {/* Percentage/Fixed/Quantity - Show strikethrough + discounted price */}
                    {dealInfo?.showPrice && dealInfo?.showStrikethrough && dealInfo.originalPrice !== undefined && dealInfo.finalPrice !== undefined && dealInfo.type !== 'bogo' && (
                      <View style={styles.modalProductPriceRow}>
                        <Text style={styles.modalProductOriginalPrice}>
                          ₱{dealInfo.originalPrice.toFixed(2)}
                        </Text>
                        <Text style={styles.modalProductDiscountedPrice}>
                          ₱{dealInfo.finalPrice.toFixed(2)}
                        </Text>
                        {dealInfo.label && (
                          <Text style={styles.modalProductDiscount}>
                            {dealInfo.label}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Quantity Discount - Show message below prices */}
                    {dealInfo?.type === 'quantity' && dealInfo?.message && (
                      <Text style={styles.modalProductQuantityMessage}>
                        {dealInfo.message}
                      </Text>
                    )}

                    {/* Voucher - Show original price + message */}
                    {dealInfo?.type === 'voucher' && (
                      <View style={styles.modalProductPriceRow}>
                        <Text style={styles.modalProductRegularPrice}>
                          ₱{dealInfo.originalPrice?.toFixed(2)}
                        </Text>
                        <Text style={styles.modalProductDealMessage}>
                          {dealInfo.message}
                        </Text>
                      </View>
                    )}
                    
                    {!dealInfo && product.price && (
                      <View style={styles.modalProductPriceRow}>
                        <Text style={styles.modalProductDiscountedPrice}>
                          ₱{Number(product.price).toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Recommendations({
  products,
  promotions,
  onPromotionPress,
  router,
  stores,
}: {
  products: Product[];
  promotions: Promotion[];
  onPromotionPress: (promotion: Promotion, productPromotions: { product: Product; promotion: Promotion }[]) => void;
  router: Router;
  stores: any[];
}) {
  const [activeTab, setActiveTab] = useState<"products" | "deals">("products");

  const visibleProducts = useMemo(() => {
    return (products || []).filter((p: Product) => {
      // Filter out inactive products
      if (p.isActive === false) return false;
      
      // Only show products from verified stores
      const productStore = (stores || []).find((s: any) => s.id === p.storeId);
      return productStore?.verificationStatus === "VERIFIED";
    });
  }, [products, stores]);

  // Filter promotions for home page (excludes vouchers)
  const homePromotions = useMemo(() => {
    const filtered = filterPromotionsByPlacement(promotions, "home");
    return sortPromotionsByPriority(filtered);
  }, [promotions]);

  // Group promotions by title and store
  const groupedPromotions = useMemo(() => {
    const groups: {
      [key: string]: {
        promotion: Promotion;
        products: { product: Product; promotion: Promotion }[];
        storeId?: number;
        storeName?: string;
      };
    } = {};

    homePromotions.forEach((promotion) => {
      // Handle new API structure with promotionProducts array
      if (promotion.promotionProducts && Array.isArray(promotion.promotionProducts)) {
        const products = promotion.promotionProducts
          .map((pp: any) => pp.product)
          .filter((p: Product) => {
            // Only include active products from verified stores
            if (p.isActive === false) return false;
            const productStore = (stores || []).find((s: any) => s.id === p.storeId);
            return productStore?.verificationStatus === "VERIFIED";
          })
          .map((p: Product) => ({ product: p, promotion }));

        if (products.length > 0) {
          const firstProduct = products[0].product;
          const productStore = (stores || []).find((s: any) => s.id === firstProduct.storeId);
          // Use combination of title and storeId as key to separate deals from different stores
          const key = `${promotion.title}-${firstProduct.storeId}`;
          
          groups[key] = {
            promotion,
            products,
            storeId: firstProduct.storeId,
            storeName: productStore?.name || "Store",
          };
        }
      } else {
        // Fallback to old structure with single productId
        const product = visibleProducts.find((p) => p.id === promotion.productId);
        if (!product) return;

        const productStore = (stores || []).find((s: any) => s.id === product.storeId);
        // Use combination of title and storeId as key
        const key = `${promotion.title}-${product.storeId}`;

        if (!groups[key]) {
          groups[key] = {
            promotion,
            products: [{ product, promotion }],
            storeId: product.storeId,
            storeName: productStore?.name || "Store",
          };
        } else {
          groups[key].products.push({ product, promotion });
        }
      }
    });

    return Object.values(groups);
  }, [homePromotions, visibleProducts, stores]);

  const handleProductPress = (p: Product) => {
    router.push({
                  pathname: "/(consumers)/product",
                  params: {
                    name: p.name,
                    storeId: p.storeId,
                    price: p.price,
                    description: p.description,
                    productId: p.id,
                    imageUrl: p.imageUrl || "",
                  },
                });
              };

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Recommended for You"
        linkText="View All"
        onPress={() => router.push("/(consumers)/recommendations")}
      />
      
      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          onPress={() => setActiveTab("products")}
          style={[styles.tab, activeTab === "products" && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === "products" && styles.tabTextActive]}>
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("deals")}
          style={[styles.tab, activeTab === "deals" && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === "deals" && styles.tabTextActive]}>
            Deals
          </Text>
        </TouchableOpacity>
      </View>

      {/* Products Tab Content */}
      {activeTab === "products" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {visibleProducts.map((p) => {
            const promo = promotions.find(pr => pr.productId === p.id && pr.active === true);
            const basePrice = Number(p.price);
            
            // Calculate discounted price based on deal type and discount fields
            let discounted: number | undefined = undefined;
            let discountDisplay: string | undefined = undefined;
            
            if (promo && promo.dealType) {
              if (promo.dealType === 'PERCENTAGE_DISCOUNT' && promo.percentageOff != null) {
                const percentValue = Number(promo.percentageOff);
                if (percentValue > 0) {
                  discounted = Math.max(0, basePrice * (1 - percentValue / 100));
                  discountDisplay = `${percentValue}% OFF`;
                }
              } else if (promo.dealType === 'FIXED_DISCOUNT' && promo.fixedAmountOff != null) {
                const fixedValue = Number(promo.fixedAmountOff);
                if (fixedValue > 0) {
                  discounted = Math.max(0, basePrice - fixedValue);
                  discountDisplay = `₱${fixedValue.toFixed(2)} OFF`;
                }
              }
              // Check for legacy fields as fallback
              else if (promo.type && promo.discount != null) {
                const discountValue = Number(promo.discount);
                if (discountValue > 0) {
                  if (promo.type === 'percentage') {
                    discounted = Math.max(0, basePrice * (1 - discountValue / 100));
                    discountDisplay = `${discountValue}% OFF`;
                  } else if (promo.type === 'fixed') {
                    discounted = Math.max(0, basePrice - discountValue);
                    discountDisplay = `₱${discountValue.toFixed(2)} OFF`;
                  }
                }
              }
              
              // Only use discounted price if it's actually different from base price
              if (discounted !== undefined && Math.abs(discounted - basePrice) < 0.01) {
                discounted = undefined;
                discountDisplay = undefined;
              }
            }
            
            return (
            <Card key={p.id} style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleProductPress(p)}
              >
                <View style={styles.imageWrap}>
                  <Image
                    source={
                      p.imageUrl
                        ? { uri: p.imageUrl }
                        : require("../../assets/images/react-logo.png")
                    }
                    style={styles.image}
                  />
                  {promo && promo.dealType && (
                    <View style={styles.dealBadgeContainer}>
                      <DealBadge dealType={promo.dealType} size="small" />
                    </View>
                  )}
                </View>
                <View style={styles.detailsContainer}>
                  <Text style={styles.productTitle} numberOfLines={2}>
                    {p.name}
                  </Text>
                  {discountDisplay && (
                    <View style={styles.dealInfo}>
                      <Ionicons name="flash" size={12} color="#F59E0B" />
                      <Text style={styles.dealText} numberOfLines={1}>
                        {discountDisplay}
                      </Text>
                    </View>
                  )}
                  {p.price != null && (
                    <View style={styles.priceContainer}>
                      {discounted !== undefined && discounted < basePrice ? (
                        <>
                          <Text style={styles.discountedPrice}>₱{discounted.toFixed(2)}</Text>
                          <Text style={styles.originalPrice}>₱{basePrice.toFixed(2)}</Text>
                        </>
                      ) : (
                        <Text style={styles.regularPrice}>₱{basePrice.toFixed(2)}</Text>
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Card>
          );})}
        </ScrollView>
      )}

      {/* Deals Tab Content */}
      {activeTab === "deals" && (
        <>
          {groupedPromotions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No deals available at the moment</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promotionsRow}
            >
              {groupedPromotions.map((group, index) => (
                <DealCard
                  key={index}
                  promotion={group.promotion}
                  product={group.products[0]?.product}
                  storeName={group.storeName}
                  onPress={() => onPromotionPress(group.promotion, group.products)}
                />
              ))}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}


function SectionHeader({
  title,
  linkText,
  onPress,
}: {
  title: string;
  linkText: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.headerRow}>
      <Text style={styles.header}>{title}</Text>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.link}>{linkText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // General / Layout
  container: {
    paddingHorizontal: 15,
    backgroundColor: "#ffffff",
  },
  section: {
    marginVertical: 8,
  },

  // Greeting Component
  greetingSection: {
    marginBottom: 4,
    marginTop: 8,
  },
  greetingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 18,
    marginHorizontal: -2,
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
  },
  greetingSubtitle: {
    fontSize: 15,
    color: "#4B5563",
    fontWeight: "500",
  },
  greetingDecoration: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFBE5D",
    opacity: 0.15,
    alignItems: "center",
    justifyContent: "center",
  },

  // SectionHeader Component
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  header: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  link: {
    fontSize: 14,
    color: "#FFBE5D",
    fontWeight: "600",
  },

  // Categories Component
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  gridItem: {
    alignItems: "center",
    flex: 1,
  },
  categoryButton: {
    width: "100%",
    alignItems: "center",
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E0F2F1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },
  caption: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },

  // Tab Selector Styles
  tabSelector: {
    flexDirection: "row",
    marginBottom: 12,
    marginTop: 4,
    gap: 8,
    paddingHorizontal: 2,
  },
  tab: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  tabActive: {
    backgroundColor: "#FFBE5D",
    shadowColor: "#FFBE5D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },

  // Recommendations Component
  row: {
    paddingVertical: 7,
    paddingHorizontal: 2,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  card: {
    width: 240,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
    marginRight: 12,
  },
  imageWrap: {
    position: "relative",
    width: "100%",
    height: 180,
    backgroundColor: "#F3F4F6",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dealBadgeContainer: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  detailsContainer: {
    padding: 12,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
    lineHeight: 20,
  },
  dealInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: "flex-start",
    gap: 4,
  },
  dealText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#92400E",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B6F5D",
  },
  originalPrice: {
    fontSize: 13,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  regularPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  // Legacy styles for backwards compatibility
  title: {
    paddingHorizontal: 10,
    marginTop: 6,
  },
  price: {
    paddingHorizontal: 10,
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#1B6F5D",
    color: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 30,
    overflow: "hidden",
  },

  // NearbyStores Component
  nearbyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    height: 80,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 5,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  storeIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    padding: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 10,
    resizeMode: "contain",
  },
  info: {
    flex: 1,
  },
  text: {
    lineHeight: 18,
  },
  bold: {
    fontWeight: "bold",
  },

  // Deals Section Styles
  promotionsRow: {
    paddingVertical: 7,
    paddingHorizontal: 2,
  },
  promotionCard: {
    width: 280,
    height: 120,
    borderRadius: 12,
    marginHorizontal: 8,
    flexDirection: "row",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  promotionCardLeft: {
    width: "50%",
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  promotionCardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  promotionCardRight: {
    width: "50%",
    backgroundColor: "#FFBE5D",
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  promotionCardDiscount: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 4,
    textAlign: "center",
  },
  promotionCardTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    opacity: 0.95,
    marginTop: 4,
  },
  promotionCardDescription: {
    fontSize: 10,
    fontWeight: "400",
    color: "#ffffff",
    textAlign: "center",
    opacity: 0.85,
    marginTop: 4,
  },
  promotionCardBlend: {
    position: "absolute",
    left: "45%",
    width: "10%",
    height: "100%",
    zIndex: 2,
  },
  promotionCardBlendGradient: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    position: "relative",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  modalHeaderGradient: {
    backgroundColor: "#FFBE5D",
    paddingVertical: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  modalHeaderTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
  },
  modalHeaderDiscountContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 6,
  },
  modalHeaderDiscount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#277874",
  },
  modalHeaderDescription: {
    fontSize: 14,
    fontWeight: "400",
    color: "#ffffff",
    marginTop: 12,
    opacity: 0.95,
    lineHeight: 20,
  },
  modalStoreCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  modalStoreLabel: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalStoreName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalStoreButton: {
    backgroundColor: "#277874",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  modalStoreButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  modalCloseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modalCloseText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#277874",
  },
  modalProducts: {
    padding: 20,
    maxHeight: 500,
  },
  modalProductCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalProductImageContainer: {
    position: "relative",
    marginRight: 12,
  },
  modalProductImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  modalProductBadge: {
    position: "absolute",
    top: -4,
    right: -4,
  },
  modalProductInfo: {
    flex: 1,
  },
  modalProductName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  modalProductPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalProductOriginalPrice: {
    fontSize: 13,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  modalProductDiscountedPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10B981",
  },
  modalProductDiscount: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFBE5D",
    backgroundColor: "rgba(255, 190, 93, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modalProductDealMessage: {
    fontSize: 12,
    fontWeight: "600",
    color: "#277874",
    backgroundColor: "rgba(39, 120, 116, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  modalProductRegularPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  modalProductQuantityMessage: {
    fontSize: 11,
    fontWeight: "600",
    color: "#00695C",
    backgroundColor: "rgba(0, 105, 92, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  // Bundle styles
  modalBundleContainer: {
    padding: 16,
  },
  modalBundleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  modalBundleTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  modalBundleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  modalBundleItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  modalBundleItemInfo: {
    flex: 1,
  },
  modalBundleItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  modalBundleItemPrice: {
    fontSize: 13,
    color: "#6B7280",
  },
  modalBundleTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#42A5F5",
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
  },
  modalBundleTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  modalBundleTotalPrice: {
    fontSize: 22,
    fontWeight: "900",
    color: "#ffffff",
  },
});
