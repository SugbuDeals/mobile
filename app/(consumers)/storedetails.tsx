import env from "@/config/env";
import { useBookmarks } from "@/features/bookmarks";
import { useCatalog } from "@/features/catalog";
import type { Product as CatalogProduct } from "@/features/catalog/types";

import { ReviewsSection } from "@/components/consumers/reviews";
import ReportForm from "@/components/reports/ReportForm";
import { useStore } from "@/features/store";
import type { Promotion } from "@/features/store/promotions/types";
import type { Store } from "@/features/store/stores/types";
import type { Product as StoreProduct } from "@/features/store/types";
import { useStableThunk } from "@/hooks/useStableCallback";
import { reviewsApi } from "@/services/api/endpoints/reviews";
import { viewsApi } from "@/services/api/endpoints/views";
import type { StoreRatingStatsDto } from "@/services/api/types/swagger";
import { getProductCategoryName as getCategoryName } from "@/utils/categoryHelpers";
import { getNonVoucherDeals, getVouchersOnly } from "@/utils/dealPlacement";
import { calculateDistance, formatDistance } from "@/utils/distance";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  const [viewMode, setViewMode] = React.useState<"products" | "reviews">("products");
  const [ratingStats, setRatingStats] = React.useState<StoreRatingStatsDto | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);

  // Load rating stats
  React.useEffect(() => {
    if (storeId) {
      reviewsApi.getStoreRatingStats(storeId)
        .then((stats) => {
          // Handle null response when there are no reviews
          setRatingStats(stats || null);
        })
        .catch(() => {
          // Silently fail - rating stats are optional
          setRatingStats(null);
        });
    } else {
      setRatingStats(null);
    }
  }, [storeId]);

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

  // Record view when store is viewed
  useEffect(() => {
    if (storeId && Number.isFinite(storeId) && storeId > 0) {
      viewsApi.recordView({
        entityType: "STORE",
        entityId: storeId,
      }).catch((error) => {
        // Silently fail - view recording is not critical
        console.debug("Failed to record store view:", error);
      });
    }
  }, [storeId]);

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
      // Use the helper function that checks both categoryId and custom category
      return getCategoryName(
        {
          categoryId: 'categoryId' in product ? product.categoryId : null,
          description: product.description || null,
        },
        catalogCategories || []
      );
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
        
        // If promotion has promotionProducts array, iterate through all products
        if (promo.promotionProducts && Array.isArray(promo.promotionProducts) && promo.promotionProducts.length > 0) {
          promo.promotionProducts.forEach((pp: any) => {
            const product = (products || []).find((p: CatalogProduct) => p.id === pp.productId);
            if (product && product.isActive !== false && product.storeId === storeId) {
              acc.push({ promotion: promo, product });
            }
          });
        } else {
          // Fallback to single productId for backward compatibility
          const product = (products || []).find((p: CatalogProduct) => p.id === promo.productId);
          if (product && product.isActive !== false && product.storeId === storeId) {
            acc.push({ promotion: promo, product });
          }
        }
        return acc;
      },
      []
    );
  }, [activePromotions, products, storeId]);

  // Separate vouchers from regular promotions
  const storeVouchers = React.useMemo(() => {
    const vouchers = getVouchersOnly(
      storePromotions.map((sp) => sp.promotion)
    );
    return storePromotions.filter((sp) =>
      vouchers.some((v) => v.id === sp.promotion.id)
    );
  }, [storePromotions]);

  const regularPromotions = React.useMemo(() => {
    const nonVouchers = getNonVoucherDeals(
      storePromotions.map((sp) => sp.promotion)
    );
    return storePromotions.filter((sp) =>
      nonVouchers.some((nv) => nv.id === sp.promotion.id)
    );
  }, [storePromotions]);

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
        <StoreHero 
          storeName={storeName} 
          viewMode={viewMode} 
          onViewModeChange={setViewMode}
          ratingStats={ratingStats}
          storeId={storeId}
          onReport={() => setShowReportForm(true)}
        />
        <StoreLocationCard storeName={storeName} storeId={storeId} />
        <StoreDealsAndVouchers
          storeName={storeName}
          storeId={storeId}
          promotions={regularPromotions}
          vouchers={storeVouchers}
        />
        {viewMode === "products" ? (
          <>
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
          </>
        ) : (
          storeId && <ReviewsSection storeId={storeId} />
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
      
      {/* Report Form Modal */}
      {storeId && (
        <ReportForm
          visible={showReportForm}
          onClose={() => setShowReportForm(false)}
          onSuccess={() => setShowReportForm(false)}
          reportedStoreId={storeId}
          reportedStoreName={storeName}
        />
      )}
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
      
      // Only show active products
      if (p.isActive === false) return false;
      
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

// Combined Deals and Vouchers Component with Dashboard Layout
function StoreDealsAndVouchers({
  storeName,
  storeId,
  promotions,
  vouchers,
}: {
  storeName: string;
  storeId?: number;
  promotions: { promotion: Promotion; product: CatalogProduct }[];
  vouchers: { promotion: Promotion; product: CatalogProduct }[];
}) {
  const router = useRouter();
  const { state: { stores } } = useStore();
  const [showVouchers, setShowVouchers] = React.useState(false);
  const [expandedVoucherId, setExpandedVoucherId] = React.useState<number | null>(null);
  
  // Filter promotions to only show products from verified stores
  const verifiedPromotions = React.useMemo(() => {
    if (storeId == null) return [];
    return promotions.filter(({ product }) => {
      const productStore = (stores || []).find((s: Store) => s.id === product.storeId);
      return productStore?.verificationStatus === "VERIFIED";
    });
  }, [promotions, stores, storeId]);
  
  const verifiedVouchers = React.useMemo(() => {
    if (storeId == null) return [];
    return vouchers.filter(({ product }) => {
      const productStore = (stores || []).find((s: Store) => s.id === product.storeId);
      return productStore?.verificationStatus === "VERIFIED";
    });
  }, [vouchers, stores, storeId]);
  
  // Group vouchers by promotion and collect products for each
  const voucherPromotionsWithProducts = React.useMemo(() => {
    const promotionMap = new Map<number, { promotion: Promotion; products: CatalogProduct[] }>();
    
    verifiedVouchers.forEach(({ promotion, product }) => {
      if (!promotionMap.has(promotion.id)) {
        promotionMap.set(promotion.id, { promotion, products: [] });
      }
      const entry = promotionMap.get(promotion.id)!;
      // Avoid duplicate products
      if (!entry.products.some(p => p.id === product.id)) {
        entry.products.push(product);
      }
    });
    
    return Array.from(promotionMap.values());
  }, [verifiedVouchers]);
  
  if (storeId == null) return null;

  const handleDealPress = (product: CatalogProduct, promo: Promotion) => {
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

  const getDealIcon = (dealType?: string) => {
    switch (dealType) {
      case "PERCENTAGE_DISCOUNT": return "percent-outline";
      case "FIXED_DISCOUNT": return "cash-outline";
      case "BOGO": return "gift-outline";
      case "BUNDLE": return "apps-outline";
      case "QUANTITY_DISCOUNT": return "layers-outline";
      default: return "pricetag-outline";
    }
  };

  const getDealColor = (dealType?: string) => {
    switch (dealType) {
      case "PERCENTAGE_DISCOUNT": return "#FF9800";
      case "FIXED_DISCOUNT": return "#4CAF50";
      case "BOGO": return "#9C27B0";
      case "BUNDLE": return "#2196F3";
      case "QUANTITY_DISCOUNT": return "#009688";
      default: return "#F59E0B";
    }
  };

  if (verifiedPromotions.length === 0 && verifiedVouchers.length === 0) {
    return null;
  }

  return (
    <View style={dealsStyles.container}>
      {/* Active Deals Section */}
      {verifiedPromotions.length > 0 && (
        <>
          <Text style={dealsStyles.sectionTitle}>Active Deals</Text>
          <View style={dealsStyles.dealsGrid}>
            {verifiedPromotions.map(({ promotion, product }) => (
              <TouchableOpacity
                key={`${promotion.id}-${product.id}`}
                style={[dealsStyles.dealBox, { borderColor: getDealColor(promotion.dealType) }]}
                onPress={() => handleDealPress(product, promotion)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={getDealIcon(promotion.dealType) as any} 
                  size={24} 
                  color={getDealColor(promotion.dealType)} 
                />
                <Text style={dealsStyles.dealType} numberOfLines={1}>
                  {promotion.dealType?.replace(/_/g, ' ') || 'DEAL'}
                </Text>
                <Text style={dealsStyles.dealTitle} numberOfLines={2}>
                  {promotion.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
      
      {/* Vouchers Section - Below Deals */}
      {voucherPromotionsWithProducts.length > 0 && (
        <View style={dealsStyles.vouchersSection}>
          <TouchableOpacity
            style={dealsStyles.voucherButton}
            onPress={() => setShowVouchers(!showVouchers)}
            activeOpacity={0.8}
          >
            <View style={dealsStyles.voucherHeader}>
              <Ionicons name="ticket" size={20} color="#E53935" />
              <Text style={dealsStyles.voucherButtonText}>
                Vouchers ({voucherPromotionsWithProducts.length})
              </Text>
            </View>
            <Ionicons 
              name={showVouchers ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#E53935" 
            />
          </TouchableOpacity>
          
          {showVouchers && (
            <View style={dealsStyles.vouchersList}>
              {voucherPromotionsWithProducts.map(({ promotion, products }, index) => (
                <View 
                  key={promotion.id} 
                  style={[
                    dealsStyles.voucherKindWrapper,
                    index === voucherPromotionsWithProducts.length - 1 && dealsStyles.voucherKindWrapperLast
                  ]}
                >
                  {/* Voucher Type Dropdown */}
                  <TouchableOpacity
                    style={dealsStyles.voucherKindDropdown}
                    onPress={() => setExpandedVoucherId(
                      expandedVoucherId === promotion.id ? null : promotion.id
                    )}
                    activeOpacity={0.7}
                  >
                    <View style={dealsStyles.voucherKindHeader}>
                      <View style={dealsStyles.voucherKindInfo}>
                        <Text style={dealsStyles.voucherKindTitle} numberOfLines={1}>
                          {promotion.title}
                        </Text>
                        <View style={dealsStyles.voucherKindMeta}>
                          {promotion.voucherValue && (
                            <Text style={dealsStyles.voucherKindValue}>
                              ₱{Number(promotion.voucherValue).toFixed(2)}
                            </Text>
                          )}
                          <Text style={dealsStyles.voucherKindRemaining}>
                            {((promotion as any).voucherQuantity !== undefined && (promotion as any).voucherQuantity !== null)
                              ? `${(promotion as any).voucherQuantity} remaining`
                              : "Available"}
                          </Text>
                        </View>
                      </View>
                      <Ionicons 
                        name={expandedVoucherId === promotion.id ? "chevron-up" : "chevron-down"} 
                        size={18} 
                        color="#6B7280" 
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Products List - shown when voucher type is expanded */}
                  {expandedVoucherId === promotion.id && products.length > 0 && (
                    <View style={dealsStyles.voucherProductsList}>
                      {products.map((product, productIndex) => (
                        <TouchableOpacity
                          key={product.id}
                          style={[
                            dealsStyles.voucherProductItem,
                            productIndex === products.length - 1 && dealsStyles.voucherProductItemLast
                          ]}
                          onPress={() => handleDealPress(product, promotion)}
                          activeOpacity={0.7}
                        >
                          <View style={dealsStyles.voucherProductInfo}>
                            <Text style={dealsStyles.voucherProductName} numberOfLines={2}>
                              {product.name}
                            </Text>
                            <Text style={dealsStyles.voucherProductPrice}>
                              ₱{Number(product.price).toFixed(2)}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color="#E53935" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// StoreHero (inline)
function StoreHero({ 
  storeName,
  viewMode,
  onViewModeChange,
  ratingStats,
  storeId,
  onReport,
}: { 
  storeName: string;
  viewMode: "products" | "reviews";
  onViewModeChange: (mode: "products" | "reviews") => void;
  ratingStats: StoreRatingStatsDto | null;
  storeId?: number;
  onReport: () => void;
}) {
  const { helpers, action } = useBookmarks();
  const { 
    state: { selectedStore, stores, products: storeProducts }, 
    action: { findStoreById } 
  } = useStore();
  const {
    state: { products: catalogProducts },
  } = useCatalog();
  
  const stableFindStoreById = useStableThunk(findStoreById);
  
  React.useEffect(() => {
    if (storeId) stableFindStoreById(storeId);
  }, [storeId, stableFindStoreById]);
  
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
          onPress={onReport} 
          activeOpacity={0.7}
          style={heroStyles.reportButton}
        >
          <Ionicons
            name="flag-outline"
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>
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
          <View style={heroStyles.ratingContainer}>
            {ratingStats && ratingStats.totalRatings > 0 ? (
              <>
                <View style={heroStyles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= Math.round(ratingStats.averageRating) ? "star" : "star-outline"}
                      size={18}
                      color="#FFD700"
                    />
                  ))}
                </View>
                <Text style={heroStyles.ratingText}>
                  {ratingStats.averageRating.toFixed(1)} ({ratingStats.totalRatings} {ratingStats.totalRatings === 1 ? 'review' : 'reviews'})
                </Text>
              </>
            ) : (
              <>
                <View style={heroStyles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name="star-outline"
                      size={18}
                      color="#DDD"
                    />
                  ))}
                </View>
                <Text style={heroStyles.ratingText}>
                  No ratings yet
                </Text>
              </>
            )}
          </View>
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
      <View style={heroStyles.sectionHeader}>
        <Text style={heroStyles.sectionTitle}>Store Products</Text>
        <View style={heroStyles.viewModeToggle}>
          <TouchableOpacity
            style={[
              heroStyles.viewModeButton,
              viewMode === "products" && heroStyles.viewModeButtonActive,
            ]}
            onPress={() => onViewModeChange("products")}
          >
            <Ionicons
              name="cube-outline"
              size={18}
              color={viewMode === "products" ? "#FFF" : "#666"}
            />
            <Text
              style={[
                heroStyles.viewModeText,
                viewMode === "products" && heroStyles.viewModeTextActive,
              ]}
            >
              Products
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              heroStyles.viewModeButton,
              viewMode === "reviews" && heroStyles.viewModeButtonActive,
            ]}
            onPress={() => onViewModeChange("reviews")}
          >
            <Ionicons
              name="star-outline"
              size={18}
              color={viewMode === "reviews" ? "#FFF" : "#666"}
            />
            <Text
              style={[
                heroStyles.viewModeText,
                viewMode === "reviews" && heroStyles.viewModeTextActive,
              ]}
            >
              Reviews
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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

const dealsStyles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  dealsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  dealBox: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    minHeight: 100,
  },
  dealType: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    marginTop: 6,
    marginBottom: 4,
  },
  dealTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 18,
  },
  vouchersSection: {
    marginTop: 8,
  },
  voucherButton: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  voucherHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voucherButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E53935",
  },
  vouchersList: {
    marginTop: 10,
    gap: 8,
  },
  voucherItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  voucherIconContainer: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  voucherItemTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    lineHeight: 18,
  },
  voucherItemValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E53935",
    marginTop: 2,
  },
  voucherKindWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  voucherKindWrapperLast: {
    borderBottomWidth: 0,
  },
  voucherKindDropdown: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderLeftWidth: 3,
    borderLeftColor: "#E53935",
  },
  voucherKindHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  voucherKindInfo: {
    flex: 1,
    marginRight: 12,
  },
  voucherKindTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  voucherKindMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  voucherKindValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E53935",
  },
  voucherKindRemaining: {
    fontSize: 12,
    color: "#6B7280",
  },
  voucherProductsList: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: "#E5E7EB",
  },
  voucherProductItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  voucherProductItemLast: {
    borderBottomWidth: 0,
  },
  voucherProductInfo: {
    flex: 1,
    marginRight: 12,
  },
  voucherProductName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 4,
  },
  voucherProductPrice: {
    fontSize: 13,
    color: "#6B7280",
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
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginRight: 4,
  },
  reportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
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
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingVertical: 6,
  },
  ratingStars: {
    flexDirection: "row",
    gap: 3,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
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
  sectionHeader: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 18,
  },
  viewModeToggle: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  viewModeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  viewModeButtonActive: {
    backgroundColor: "#1B6F5D",
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  viewModeTextActive: {
    color: "#FFF",
  },
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

  if (!address) return null;

  return (
    <View style={locationStyles.container}>
      <TouchableOpacity 
        style={locationStyles.locationButton}
        onPress={openExternalDirections}
        activeOpacity={0.7}
      >
        <View style={locationStyles.iconContainer}>
          <Ionicons name="location" size={24} color="#1B6F5D" />
        </View>
        <View style={locationStyles.locationInfo}>
          <Text style={locationStyles.locationLabel}>Store Location</Text>
          <Text style={locationStyles.addressText} numberOfLines={2}>
            {address}
          </Text>
          {distance !== null && (
            <Text style={locationStyles.distanceText}>
              {formatDistance(distance)} away
            </Text>
          )}
        </View>
        <Ionicons name="navigate" size={20} color="#1B6F5D" />
      </TouchableOpacity>
    </View>
  );
}

const locationStyles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#047857",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  addressText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  distanceText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
});
