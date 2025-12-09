import env from "@/config/env";
import { useBookmarks } from "@/features/bookmarks";
import { useCatalog } from "@/features/catalog";
import type { Product as CatalogProduct, Category } from "@/features/catalog/types";

import { useStore } from "@/features/store";
import type { Promotion } from "@/features/store/promotions/types";
import type { Store } from "@/features/store/stores/types";
import type { Product as StoreProduct } from "@/features/store/types";
import { useStableThunk } from "@/hooks/useStableCallback";
import { calculateDistance, formatDistance } from "@/utils/distance";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function StoreDetailsScreen() {
  const params = useLocalSearchParams() as Record<string, string | undefined>;
  const storeId = params.storeId ? Number(params.storeId) : undefined;
  const {
    state: { categories: catalogCategories, products },
    action: { loadCategories, loadProducts },
  } = useCatalog();
  const {
    state: { activePromotions, stores, selectedStore },
    action: { findActivePromotions, findProducts: findStoreProducts, findStoreById },
  } = useStore();
  
  // Stable thunk references
  const stableFindStoreById = useStableThunk(findStoreById);
  const stableFindStoreProducts = useStableThunk(findStoreProducts);
  const stableFindActivePromotions = useStableThunk(findActivePromotions);
  const stableLoadProducts = useStableThunk(loadProducts);
  const stableLoadCategories = useStableThunk(loadCategories);
  
  // Track last loaded store ID to prevent duplicate loads
  const lastLoadedStoreIdRef = useRef<number | null>(null);
  
  // keep bookmarks store ready for hero toggle
  useBookmarks();
  const [activeCategory, setActiveCategory] = React.useState("All");
  const [query, setQuery] = React.useState("");

  const storeFromList = stores?.find?.((s: Store) => s.id === storeId);
  const storeFromSelected =
    selectedStore && selectedStore.id === storeId ? selectedStore : undefined;
  const resolvedStore = storeFromList || storeFromSelected;
  const storeName =
    (params.store as string) || (resolvedStore?.name ?? "Store");

  // Load categories and products if not already loaded
  useEffect(() => {
    if (!products || products.length === 0) {
      stableLoadProducts();
    }
    if (!catalogCategories || catalogCategories.length === 0) {
      stableLoadCategories();
    }
  }, [products, catalogCategories, stableLoadProducts, stableLoadCategories]);

  // Load store details
  useEffect(() => {
    if (storeId && lastLoadedStoreIdRef.current !== storeId) {
      stableFindStoreById(storeId);
    }
  }, [storeId, stableFindStoreById]);

  // Load store products and promotions (chained via Redux state, not async/await)
  useEffect(() => {
    if (storeId != null && lastLoadedStoreIdRef.current !== storeId) {
      lastLoadedStoreIdRef.current = storeId;
      // Dispatch both actions - they will update Redux state independently
      // No need to await or chain them
      stableFindStoreProducts({ storeId });
      stableFindActivePromotions(storeId);
    }
  }, [storeId, stableFindStoreProducts, stableFindActivePromotions]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (storeId != null) {
        stableFindStoreProducts({ storeId });
        stableFindActivePromotions(storeId);
      }
    }, [storeId, stableFindStoreProducts, stableFindActivePromotions])
  );

  const getProductCategoryName = React.useCallback(
    (product: CatalogProduct | StoreProduct): string => {
      const categoryId = 'categoryId' in product ? product.categoryId : null;
      if (categoryId == null) return "";
      const match = (catalogCategories || []).find(
        (cat: Category) => String(cat.id) === String(categoryId)
      );
      return match?.name ? String(match.name) : "";
    },
    [catalogCategories]
  );

  const storeCategories = React.useMemo(() => {
    const source = (products || []).filter((p: CatalogProduct) =>
      storeId == null ? true : p.storeId === storeId
    );
    const unique = new Set<string>();
    source.forEach((p: CatalogProduct) => {
      const categoryName = getProductCategoryName(p);
      if (categoryName) unique.add(categoryName);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [products, storeId, getProductCategoryName]);

  const categories = React.useMemo(
    () => ["All", ...storeCategories],
    [storeCategories]
  );

  const storePromotions = React.useMemo(() => {
    if (storeId == null) return [];
    const promoList = Array.isArray(activePromotions) ? activePromotions : [];
    return promoList.reduce<{ promotion: Promotion; product: CatalogProduct }[]>(
      (acc, promo: Promotion) => {
        if (!promo?.active) return acc;
        const product = (products || []).find((p: CatalogProduct) => p.id === promo.productId);
        if (!product || product.isActive === false) return acc;
        if (product.storeId !== storeId) return acc;
        acc.push({ promotion: promo, product });
        return acc;
      },
      []
    );
  }, [activePromotions, products, storeId]);

  React.useEffect(() => {
    if (activeCategory !== "All" && !storeCategories.includes(activeCategory)) {
      setActiveCategory("All");
    }
  }, [storeCategories, activeCategory]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <StoreHero storeName={storeName} />
        <StoreLocationCard storeName={storeName} storeId={storeId} />
        <StorePromotions
          storeName={storeName}
          storeId={storeId}
          promotions={storePromotions}
        />
        <CategoriesBar
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
        />
        <StoreSearch value={query} onChange={setQuery} />
        <DealsGrid
          storeId={storeId}
          category={activeCategory}
          query={query}
          products={products}
          getProductCategoryName={getProductCategoryName}
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// CategoriesBar (inline)
function CategoriesBar({
  categories,
  active,
  onChange,
}: {
  categories: string[];
  active: string;
  onChange: (c: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={barStyles.row}
    >
      {categories.map((c) => (
        <TouchableOpacity
          key={c}
          onPress={() => onChange(c)}
          style={[
            barStyles.pill,
            active === c ? barStyles.pillActive : barStyles.pillInactive,
          ]}
        >
          <Text
            style={[
              barStyles.text,
              active === c ? barStyles.textActive : barStyles.textInactive,
            ]}
          >
            {c}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// DealsGrid (inline) - uses catalog products filtered by storeId
function DealsGrid({
  storeId,
  query = "",
  category = "All",
  products = [],
  getProductCategoryName,
}: {
  storeId?: number;
  query?: string;
  category?: string;
  products?: CatalogProduct[];
  getProductCategoryName: (product: CatalogProduct | StoreProduct) => string;
}) {
  const router = useRouter();
  const { state: { activePromotions, stores } } = useStore();
  const getDiscounted = React.useCallback((p: CatalogProduct) => {
    const promo = (activePromotions as Promotion[])?.find?.((ap: Promotion) => ap.productId === p.id && ap.active === true);
    if (!promo) return undefined;
    const base = Number(p.price);
    if (!isFinite(base)) return undefined;
    const type = String(promo.type || '').toLowerCase();
    const value = Number(promo.discount || 0);
    if (type === 'percentage') return Math.max(0, base * (1 - value / 100));
    if (type === 'fixed') return Math.max(0, base - value);
    return undefined;
  }, [activePromotions]);
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = (products || []).filter((p: CatalogProduct) => {
      // Filter by storeId
      if (storeId != null && p.storeId !== storeId) return false;
      
      // Only show products from verified stores
      const productStore = (stores || []).find((s: Store) => s.id === p.storeId);
      if (productStore && productStore.verificationStatus !== "VERIFIED") {
        return false;
      }
      
      return true;
    });
    return source.filter((p: CatalogProduct) => {
      const matchesQuery =
        q.length === 0 || String(p.name).toLowerCase().includes(q);
      const productCategoryName = getProductCategoryName(p);
      const matchesCategory =
        category === "All" ||
        productCategoryName.toLowerCase() === category.toLowerCase();
      return matchesQuery && matchesCategory;
    });
  }, [products, storeId, query, category, getProductCategoryName, stores]);

  const handleProductPress = (p: CatalogProduct) => {
    router.push({
      pathname: "/(consumers)/product",
      params: {
        name: p.name,
        storeId: p.storeId || storeId,
        price: p.price,
        description: p.description,
        productId: p.id,
      },
    });
  };

  return (
    <View style={gridStyles.grid}>
      {filtered.map((p: CatalogProduct) => (
        <TouchableOpacity
          key={p.id}
          style={gridStyles.card}
          onPress={() => handleProductPress(p)}
          activeOpacity={0.8}
        >
          {typeof p.imageUrl === 'string' && p.imageUrl.length > 0 ? (
            <Image source={{ uri: p.imageUrl }} style={gridStyles.image} />
          ) : (
            <Image
              source={require("../../assets/images/partial-react-logo.png")}
              style={gridStyles.image}
            />
          )}
          <View style={gridStyles.textArea}>
            <Text style={gridStyles.productName}>{p.name}</Text>
          {p.price != null && (() => {
            const dp = getDiscounted(p);
            return dp !== undefined ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={gridStyles.priceOld}>₱{Number(p.price).toFixed(2)}</Text>
                <Text style={gridStyles.price}>₱{dp.toFixed(2)}</Text>
              </View>
            ) : (
              <Text style={gridStyles.price}>₱{Number(p.price).toFixed(2)}</Text>
            );
          })()}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function StorePromotions({
  storeName,
  storeId,
  promotions,
}: {
  storeName: string;
  storeId?: number;
  promotions: { promotion: Promotion; product: CatalogProduct }[];
}) {
  const router = useRouter();
  const { state: { stores } } = useStore();
  
  if (storeId == null) return null;
  
  // Filter promotions to only show products from verified stores
  const verifiedPromotions = React.useMemo(() => {
    return promotions.filter(({ product }) => {
      const productStore = (stores || []).find((s: Store) => s.id === product.storeId);
      return productStore?.verificationStatus === "VERIFIED";
    });
  }, [promotions, stores]);
  
  const hasPromotions = verifiedPromotions.length > 0;

  const getDiscountedPrice = (price: number | string, promo: Promotion) => {
    const base = Number(price);
    if (!isFinite(base)) return undefined;
    const type = String(promo?.type || "").toLowerCase();
    const discount = Number(promo?.discount || 0);
    if (type === "percentage") return Math.max(0, base * (1 - discount / 100));
    if (type === "fixed") return Math.max(0, base - discount);
    return undefined;
  };

  const handleProductPress = (product: CatalogProduct, promo: Promotion) => {
    router.push({
      pathname: "/(consumers)/product",
      params: {
        name: product.name,
        storeId: product.storeId ?? storeId,
        price: product.price,
        description: product.description,
        productId: product.id,
        promotionId: promo?.id,
        imageUrl: product.imageUrl || "",
      },
    });
  };

  return (
    <View style={storePromoStyles.container}>
      <View style={storePromoStyles.headerRow}>
        <Text style={storePromoStyles.title}>Store Promotions</Text>
        <Text style={storePromoStyles.count}>
          {hasPromotions ? `${promotions.length} active` : "None right now"}
        </Text>
      </View>
      {hasPromotions ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={storePromoStyles.row}
        >
          {verifiedPromotions.map(({ promotion, product }) => {
            const discounted = getDiscountedPrice(product.price ?? "0", promotion);
            const basePrice = Number(product.price);
            const hasBasePrice = Number.isFinite(basePrice);
            const promoType = String(promotion.type || "").toLowerCase();
            return (
              <TouchableOpacity
                key={`${promotion.id}-${product.id}`}
                style={storePromoStyles.card}
                activeOpacity={0.85}
                onPress={() => handleProductPress(product, promotion)}
                accessibilityRole="button"
              >
                {product.imageUrl ? (
                  <Image source={{ uri: product.imageUrl }} style={storePromoStyles.cardImage} />
                ) : (
                  <Image
                    source={require("../../assets/images/partial-react-logo.png")}
                    style={storePromoStyles.cardImage}
                  />
                )}
                <View style={storePromoStyles.cardBody}>
                  <Text style={storePromoStyles.promotionTitle} numberOfLines={1}>
                    {promotion.title}
                  </Text>
                  <Text style={storePromoStyles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <View style={storePromoStyles.priceRow}>
                    {hasBasePrice ? (
                      discounted !== undefined ? (
                        <>
                          <Text style={storePromoStyles.oldPrice}>
                            ₱{basePrice.toFixed(2)}
                          </Text>
                          <Text style={storePromoStyles.price}>
                            ₱{discounted.toFixed(2)}
                          </Text>
                        </>
                      ) : (
                        <Text style={storePromoStyles.price}>
                          ₱{basePrice.toFixed(2)}
                        </Text>
                      )
                    ) : (
                      <Text style={storePromoStyles.price}>View details</Text>
                    )}
                  </View>
                  <View style={storePromoStyles.badge}>
                    <Text style={storePromoStyles.badgeText}>
                      {promoType === "percentage"
                        ? `${promotion.discount}% OFF`
                        : `₱${promotion.discount} OFF`}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={storePromoStyles.emptyText}>
          No active promotions for {storeName} right now.
        </Text>
      )}
    </View>
  );
}

// StoreHero (inline)
function StoreHero({ storeName }: { storeName: string }) {
  const params = useLocalSearchParams() as Record<string, string | undefined>;
  const storeId = params.storeId ? Number(params.storeId) : undefined;
  const { helpers, action } = useBookmarks();
  const { 
    state: { selectedStore, stores, products: storeProducts }, 
    action: { findStoreById } 
  } = useStore();
  const {
    state: { products: catalogProducts },
  } = useCatalog();
  
  React.useEffect(() => {
    if (storeId) findStoreById(storeId);
  }, [storeId]);
  
  const storeFromList = stores?.find((s: Store) => s.id === storeId);
  const rawLogo = ((selectedStore && selectedStore.id === storeId) ? selectedStore.imageUrl : undefined) || storeFromList?.imageUrl;
  const rawBanner = ((selectedStore && selectedStore.id === storeId) ? selectedStore.bannerUrl : undefined) || storeFromList?.bannerUrl;
  const logoUrl = (() => {
    if (!rawLogo) return undefined;
    if (/^https?:\/\//i.test(rawLogo)) return rawLogo;
    if (rawLogo.startsWith('/')) return `${env.API_BASE_URL}${rawLogo}`;
    return `${env.API_BASE_URL}/files/${rawLogo}`;
  })();
  const bannerUrl = (() => {
    if (!rawBanner) return undefined;
    if (/^https?:\/\//i.test(rawBanner)) return rawBanner;
    if (rawBanner.startsWith('/')) return `${env.API_BASE_URL}${rawBanner}`;
    return `${env.API_BASE_URL}/files/${rawBanner}`;
  })();
  const description = (selectedStore && selectedStore.id === storeId ? selectedStore?.description : undefined) || storeFromList?.description || "";
  const isSaved = helpers.isStoreBookmarked(storeId);
  
  // Count products for this store
  const productCount = React.useMemo(() => {
    const allProducts = [...(catalogProducts || []), ...(storeProducts || [])];
    return allProducts.filter((p: CatalogProduct | StoreProduct) => 
      p.storeId === storeId
    ).length;
  }, [catalogProducts, storeProducts, storeId]);
  
  const toggle = () => {
    if (storeId == null) return;
    if (helpers.isStoreBookmarked(storeId)) action.removeStoreBookmark(storeId);
    else action.addStoreBookmark(storeId);
  };
  return (
    <View style={heroStyles.container}>
      <View style={heroStyles.bannerWrapper}>
        {bannerUrl ? (
          <Image
            source={{ uri: bannerUrl }}
            resizeMode="contain"
            style={heroStyles.banner}
          />
        ) : (
          <Image
            source={require("../../assets/images/partial-react-logo.png")}
            resizeMode="contain"
            style={heroStyles.banner}
          />
        )}
      </View>
      <View style={heroStyles.topRightRow}>
        <TouchableOpacity 
          onPress={toggle} 
          activeOpacity={0.7}
          style={[
            heroStyles.bookmarkButton,
            isSaved && heroStyles.bookmarkButtonActive
          ]}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={28}
            color={isSaved ? "#ffffff" : "#277874"}
          />
        </TouchableOpacity>
      </View>
      <View style={heroStyles.identityBlock}>
        <View style={heroStyles.logoWrapper}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={{ width: 84, height: 84, borderRadius: 20 }} />
          ) : (
            <View style={heroStyles.logoBox} />
          )}
          <Text style={heroStyles.name}>{storeName}</Text>
          {description ? (
            <Text style={heroStyles.desc} numberOfLines={3}>{description}</Text>
          ) : null}
          <View style={heroStyles.chipsRow}>
            <View style={[heroStyles.chip, heroStyles.chipInfo]}>
              <Ionicons name="cube-outline" size={14} color="#277874" />
              <Text style={heroStyles.chipInfoText}>
                {productCount} {productCount === 1 ? 'Product' : 'Products'}
              </Text>
            </View>
            {storeFromList?.address || (selectedStore && selectedStore.id === storeId ? selectedStore?.address : undefined) ? (
              <View style={[heroStyles.chip, heroStyles.chipInfo]}>
                <Ionicons name="location-outline" size={14} color="#277874" />
                <Text style={heroStyles.chipInfoText} numberOfLines={1}>
                  {storeFromList?.address || (selectedStore && selectedStore.id === storeId ? selectedStore?.address : '')}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
      <Text style={heroStyles.sectionTitle}>Store Products</Text>
    </View>
  );
}

// StoreSearch (inline)
function StoreSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (t: string) => void;
}) {
  return (
    <TextInput
      placeholder="Search products..."
      value={value}
      onChangeText={onChange}
      style={searchStyles.input}
      placeholderTextColor="#9CA3AF"
    />
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
});

const barStyles = StyleSheet.create({
  row: { columnGap: 10 },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100 },
  pillActive: { backgroundColor: "#1B6F5D" },
  pillInactive: { backgroundColor: "#E5E7EB" },
  text: { fontWeight: "600" },
  textActive: { color: "#fff" },
  textInactive: { color: "#6B7280" },
});

const gridStyles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#F5F6F7",
    borderRadius: 16,
    paddingTop: 0,
    paddingBottom: 12,
    paddingHorizontal: 0,
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  image: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  textArea: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10 },
  productName: { fontWeight: "700" },
  price: { color: "#1B6F5D", fontWeight: "900", marginTop: 6 },
  priceOld: { color: "#9CA3AF", textDecorationLine: 'line-through', marginTop: 6 },
});

const storePromoStyles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FDF6EC",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B4332",
  },
  count: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  row: {
    columnGap: 12,
    paddingRight: 8,
  },
  card: {
    width: 220,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 12,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardImage: {
    width: "100%",
    height: 110,
    borderRadius: 14,
    marginBottom: 10,
    resizeMode: "cover",
  },
  cardBody: {
    gap: 6,
  },
  promotionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  productName: {
    fontSize: 13,
    color: "#4B5563",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1B6F5D",
  },
  oldPrice: {
    fontSize: 13,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(39, 120, 116, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#277874",
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 13,
  },
});

const heroStyles = StyleSheet.create({
  container: { paddingBottom: 16 },
  bannerWrapper: {
    marginLeft: -20,
    marginRight: -20,
    backgroundColor: "#d1d1d1",
  },
  banner: { width: "100%", height: 200, marginTop: -10 },
  topRightRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    marginRight: 4,
  },
  bookmarkButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  bookmarkButtonActive: {
    backgroundColor: "#277874",
    borderColor: "#277874",
  },
  identityBlock: {
    flexDirection: "row",
    columnGap: 12,
    alignItems: "flex-start",
    marginTop: -8,
  },
  logoWrapper: { marginTop: -90},
  logoBox: {
    width: 84,
    height: 84,
    borderRadius: 20,
    backgroundColor: "#1D9BF0",
  },
  name: { fontSize: 20, fontWeight: "700", marginTop: 6 },
  desc: { color: "#6B7280", marginTop: 2, fontSize: 14, lineHeight: 20 },
  chipsRow: { 
    flexDirection: "row", 
    columnGap: 10, 
    marginTop: 12,
    flexWrap: "wrap",
  },
  chip: { 
    borderRadius: 20, 
    paddingVertical: 8, 
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipInfo: {
    backgroundColor: "#f0f9f8",
    borderWidth: 1,
    borderColor: "#d1fae5",
  },
  chipInfoText: { 
    color: "#277874", 
    fontWeight: "600",
    fontSize: 13,
    maxWidth: 150,
  },
  sectionTitle: { marginTop: 18, fontWeight: "700", fontSize: 18 },
});

const searchStyles = StyleSheet.create({
  input: {
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 10,
  },
});

// StoreLocationCard component
function StoreLocationCard({
  storeName,
  storeId,
}: {
  storeName: string;
  storeId?: number;
}) {
  const {
    state: { stores, selectedStore },
  } = useStore();
  const router = useRouter();
  
  const store =
    stores?.find?.((s: Store) => s.id === storeId) ||
    (selectedStore && selectedStore.id === storeId ? selectedStore : undefined);
  const latitude = store?.latitude ?? null;
  const longitude = store?.longitude ?? null;
  const address = store?.address || "";
  const [region, setRegion] = React.useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [distance, setDistance] = React.useState<number | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (
          status === "granted" &&
          typeof latitude === "number" &&
          typeof longitude === "number"
        ) {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const userPos = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          
          // Calculate distance
          const dist = calculateDistance(
            userPos.latitude,
            userPos.longitude,
            latitude,
            longitude
          );
          setDistance(dist);
          
          setRegion({
            latitude: latitude,
            longitude: longitude,
            latitudeDelta: Math.abs(latitude - pos.coords.latitude) + 0.02,
            longitudeDelta: Math.abs(longitude - pos.coords.longitude) + 0.02,
          });
        } else if (
          typeof latitude === "number" &&
          typeof longitude === "number"
        ) {
          setRegion({
            latitude,
            longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        }
      } catch {}
    })();
  }, [latitude, longitude]);

  const openExternalDirections = () => {
    if (typeof latitude === "number" && typeof longitude === "number") {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
      );
    } else if (address) {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          address
        )}`
      );
    } else {
      router.push({
        pathname: "/(consumers)/navigate",
        params: {
          storeName: storeName,
          storeId: storeId?.toString(),
          address: address,
          latitude: latitude?.toString(),
          longitude: longitude?.toString(),
        },
      });
    }
  };

  if (!latitude && !longitude && !address) {
    return null; // Don't show location card if no location data
  }

  return (
    <View style={locationStyles.container}>
      <Text style={locationStyles.sectionTitle}>Store Location</Text>
      <View style={locationStyles.card}>
        {region ? (
          <MapView style={locationStyles.mapImage} initialRegion={region}>
            {typeof latitude === "number" && typeof longitude === "number" && (
              <Marker
                coordinate={{ latitude, longitude }}
                title={storeName}
                description={address}
              />
            )}
          </MapView>
        ) : (
          <Image
            source={require("../../assets/images/partial-react-logo.png")}
            style={locationStyles.mapImage}
          />
        )}
        <View style={locationStyles.detailsRow}>
          <View style={locationStyles.locationDetails}>
            <Text style={locationStyles.address} numberOfLines={2}>
              {address || "Store location"}
            </Text>
            {distance !== null ? (
              <Text style={locationStyles.distance}>
                {formatDistance(distance)} away
              </Text>
            ) : (
              <Text style={locationStyles.distance}>Get directions</Text>
            )}
          </View>
          <View style={locationStyles.buttonContainer}>
            <TouchableOpacity
              style={locationStyles.navigateButton}
              activeOpacity={0.85}
              onPress={openExternalDirections}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="navigate" size={16} color="#ffffff" />
                <Text style={locationStyles.buttonTitle}> Navigate</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const locationStyles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  mapImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
    backgroundColor: "#dedede",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  locationDetails: {
    flex: 1,
    marginRight: 10,
  },
  address: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  distance: {
    fontSize: 13,
    color: "#888",
  },
  buttonContainer: {
    width: 120,
  },
  navigateButton: {
    backgroundColor: "#1B6F5D",
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  buttonTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 6,
  },
});
