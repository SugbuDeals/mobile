import env from "@/config/env";
import { useBookmarks } from "@/features/bookmarks";
import { useCatalog } from "@/features/catalog";
import type { Category } from "@/features/catalog/types";
import type { Product as CatalogProduct } from "@/features/catalog/types";
import { useStore } from "@/features/store";
import type { Product as StoreProduct } from "@/features/store/types";
import type { Store } from "@/features/store/stores/types";
import type { Promotion } from "@/features/store/promotions/types";
import { useStableThunk } from "@/hooks/useStableCallback";
import { useAsyncEffect } from "@/hooks/useAsyncEffect";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

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
    return promoList.reduce<Array<{ promotion: Promotion; product: CatalogProduct }>>(
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
  const { state: { activePromotions } } = useStore();
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
    const source = (products || []).filter((p: CatalogProduct) =>
      storeId == null ? true : p.storeId === storeId
    );
    return source.filter((p: CatalogProduct) => {
      const matchesQuery =
        q.length === 0 || String(p.name).toLowerCase().includes(q);
      const productCategoryName = getProductCategoryName(p);
      const matchesCategory =
        category === "All" ||
        productCategoryName.toLowerCase() === category.toLowerCase();
      return matchesQuery && matchesCategory;
    });
  }, [products, storeId, query, category, getProductCategoryName]);

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
  promotions: Array<{ promotion: Promotion; product: CatalogProduct }>;
}) {
  const router = useRouter();
  if (storeId == null) return null;
  const hasPromotions = promotions.length > 0;

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
          {promotions.map(({ promotion, product }) => {
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
  const { state: { selectedStore, stores }, action: { findStoreById } } = useStore();
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
            resizeMode="cover"
            style={heroStyles.banner}
          />
        ) : (
          <Image
            source={require("../../assets/images/partial-react-logo.png")}
            resizeMode="cover"
            style={heroStyles.banner}
          />
        )}
      </View>
      <View style={heroStyles.topRightRow}>
        <TouchableOpacity onPress={toggle} activeOpacity={0.8}>
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={22}
            color={isSaved ? "#F59E0B" : "#333"}
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
            <View style={[heroStyles.chip, heroStyles.chipPrimary]}>
              <Text style={heroStyles.chipPrimaryText}>Open Now</Text>
            </View>
            <View style={[heroStyles.chip, heroStyles.chipOutline]}>
              <Text style={heroStyles.chipOutlineText}>Closes at 9:00 PM</Text>
            </View>
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
  },
  identityBlock: {
    flexDirection: "row",
    columnGap: 12,
    alignItems: "flex-start",
    marginTop: -8,
  },
  logoWrapper: { marginTop: -52 },
  logoBox: {
    width: 84,
    height: 84,
    borderRadius: 20,
    backgroundColor: "#1D9BF0",
  },
  name: { fontSize: 20, fontWeight: "700", marginTop: 6 },
  desc: { color: "#6B7280", marginTop: 2 },
  chipsRow: { flexDirection: "row", columnGap: 10, marginTop: 10 },
  chip: { borderRadius: 100, paddingVertical: 6, paddingHorizontal: 12 },
  chipPrimary: { backgroundColor: "#1B6F5D" },
  chipPrimaryText: { color: "#fff", fontWeight: "600" },
  chipOutline: {
    backgroundColor: "#fff",
    borderColor: "#1B6F5D",
    borderWidth: 1,
  },
  chipOutlineText: { color: "#1B6F5D", fontWeight: "600" },
  sectionTitle: { marginTop: 18, fontWeight: "700" },
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
