import DealTypeEditOverlay from "@/components/retailers/DealTypeEditOverlay";
import { useLogin } from "@/features/auth";
import { useCatalog } from "@/features/catalog";
import type { Product as CatalogProduct } from "@/features/catalog/types";
import { useStore } from "@/features/store";
import type { Promotion } from "@/features/store/promotions/types";
import type { Product as StoreProduct } from "@/features/store/types";
import { useStableThunk } from "@/hooks/useStableCallback";
import { borderRadius, colors, spacing } from "@/styles/theme";
import { getNonVoucherDeals, getVouchersOnly } from "@/utils/dealPlacement";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Image,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const DEFAULT_BANNER = require("../../assets/images/index3.png");

// Helper function to deduplicate products by ID
function deduplicateProducts(
  products: (CatalogProduct | StoreProduct)[]
): (CatalogProduct | StoreProduct)[] {
  const seen = new Map<number, CatalogProduct | StoreProduct>();
  products.forEach((product) => {
    if (product.id != null && !seen.has(product.id)) {
      seen.set(product.id, product);
    }
  });
  return Array.from(seen.values());
}

export default function RetailerDashboard() {
  const { state: { user } } = useLogin();
  const { action: { findActivePromotions, findProducts }, state: { userStore, activePromotions, loading, products } } = useStore();
  const { state: { categories: catalogCategories, products: catalogProducts }, action: { loadCategories, loadProducts: loadCatalogProducts } } = useCatalog();

  // Stable thunk references to prevent unnecessary re-renders
  const stableFindActivePromotions = useStableThunk(findActivePromotions);
  const stableFindProducts = useStableThunk(findProducts);
  const stableLoadCategories = useStableThunk(loadCategories);
  const stableLoadCatalogProducts = useStableThunk(loadCatalogProducts);

  // Track last fetched store ID to prevent duplicate fetches
  const lastFetchedStoreIdRef = useRef<number | null>(null);
  const lastFetchedUserIdRef = useRef<number | null>(null);
  const categoriesLoadedRef = useRef(false);
  const productsLoadedRef = useRef(false);

  // State for filtering
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");

  // Load categories and catalog products if not already loaded (only once)
  useEffect(() => {
    if (!categoriesLoadedRef.current && (!catalogCategories || catalogCategories.length === 0)) {
      categoriesLoadedRef.current = true;
      stableLoadCategories();
    }
  }, [catalogCategories?.length, stableLoadCategories]);

  useEffect(() => {
    if (!productsLoadedRef.current && (!catalogProducts || catalogProducts.length === 0)) {
      productsLoadedRef.current = true;
      stableLoadCatalogProducts();
    }
  }, [catalogProducts?.length, stableLoadCatalogProducts]);

  // Get product category name helper
  const getProductCategoryName = useCallback(
    (product: CatalogProduct | StoreProduct): string => {
      const { getProductCategoryName: getCategoryName } = require("@/utils/categoryHelpers");
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

  // Get store categories from products
  const storeCategories = useMemo(() => {
    const storeId = userStore?.id;
    const allProducts = deduplicateProducts([...(catalogProducts || []), ...(products || [])]);
    const source = allProducts.filter((p: CatalogProduct | StoreProduct) =>
      storeId == null ? true : p.storeId === storeId
    );
    const unique = new Set<string>();
    source.forEach((p: CatalogProduct | StoreProduct) => {
      const categoryName = getProductCategoryName(p);
      if (categoryName) unique.add(categoryName);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [catalogProducts, products, userStore?.id, getProductCategoryName]);

  const categories = useMemo(
    () => ["All", ...storeCategories],
    [storeCategories]
  );

  // Combine promotions with products
  const storePromotions = useMemo(() => {
    const storeId = userStore?.id;
    if (storeId == null) return [];
    const promoList = Array.isArray(activePromotions) ? activePromotions : [];
    const allProducts = deduplicateProducts([...(catalogProducts || []), ...(products || [])]);
    return promoList.reduce<{ promotion: Promotion; product: CatalogProduct | StoreProduct }[]>(
      (acc, promo: Promotion) => {
        if (!promo?.active) return acc;
        
        // If promotion has promotionProducts array, iterate through all products
        if (promo.promotionProducts && Array.isArray(promo.promotionProducts) && promo.promotionProducts.length > 0) {
          promo.promotionProducts.forEach((pp: any) => {
            const product = allProducts.find((p: CatalogProduct | StoreProduct) => p.id === pp.productId);
            if (product && (product as any).isActive !== false && product.storeId === storeId) {
              acc.push({ promotion: promo, product });
            }
          });
        } else {
          // Fallback to single productId for backward compatibility
          const product = allProducts.find((p: CatalogProduct | StoreProduct) => p.id === promo.productId);
          if (product && (product as any).isActive !== false && product.storeId === storeId) {
            acc.push({ promotion: promo, product });
          }
        }
        return acc;
      },
      []
    );
  }, [activePromotions, catalogProducts, products, userStore?.id]);

  // Separate vouchers from regular promotions
  const storeVouchers = useMemo(() => {
    const vouchers = getVouchersOnly(
      storePromotions.map((sp) => sp.promotion)
    );
    return storePromotions.filter((sp) =>
      vouchers.some((v) => v.id === sp.promotion.id)
    );
  }, [storePromotions]);

  const regularPromotions = useMemo(() => {
    const nonVouchers = getNonVoucherDeals(
      storePromotions.map((sp) => sp.promotion)
    );
    return storePromotions.filter((sp) =>
      nonVouchers.some((nv) => nv.id === sp.promotion.id)
    );
  }, [storePromotions]);

  // Group regular promotions by promotion ID to avoid duplicates
  const groupedRegularPromotions = useMemo(() => {
    const promotionMap = new Map<number, { promotion: Promotion; products: (CatalogProduct | StoreProduct)[] }>();
    
    regularPromotions.forEach(({ promotion, product }) => {
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
  }, [regularPromotions]);

  // Reset category if it's no longer available
  useEffect(() => {
    if (activeCategory !== "All" && !storeCategories.includes(activeCategory)) {
      setActiveCategory("All");
    }
  }, [storeCategories, activeCategory]);

  // Fetch data when user or userStore changes
  useEffect(() => {
    const storeId = userStore?.id;
    const userId = user?.id ? Number(user.id) : null;

    // Skip if we've already fetched for this store/user
    if (storeId && lastFetchedStoreIdRef.current === storeId) {
      return;
    }
    if (userId && !storeId && lastFetchedUserIdRef.current === userId) {
      return;
    }

    // Fetch products and promotions
    if (storeId) {
      lastFetchedStoreIdRef.current = storeId;
      stableFindProducts({ storeId });
      stableFindActivePromotions(storeId);
    } else if (userId) {
      lastFetchedUserIdRef.current = userId;
      stableFindProducts({ storeId: userId });
      stableFindActivePromotions(userId);
    } else {
      // Fallback: fetch all promotions
      stableFindActivePromotions();
    }
  }, [user?.id, userStore?.id, stableFindProducts, stableFindActivePromotions]);

  // Refresh promotions when component comes into focus
  useFocusEffect(
    useCallback(() => {
      const storeId = userStore?.id;
      const userId = user?.id ? Number(user.id) : null;

      if (storeId) {
        stableFindActivePromotions(storeId);
      } else if (userId) {
        stableFindActivePromotions(userId);
      } else {
        stableFindActivePromotions();
      }
    }, [userStore?.id, user?.id, stableFindActivePromotions])
  );

  const getStoreInitial = (storeName: string) => {
    return storeName ? storeName.charAt(0).toUpperCase() : 'S';
  };

  const getStoreName = () => {
    return userStore?.name || 'Your Store';
  };

  const getStoreDescription = () => {
    return userStore?.description || 'Store description coming soon';
  };

  const getStoreBannerSource = () => {
    if (typeof userStore?.bannerUrl === "string" && userStore.bannerUrl.trim().length > 0) {
      return { uri: userStore.bannerUrl };
    }
    return DEFAULT_BANNER;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Store Header */}
      <View style={styles.storeHeader}>
        <ImageBackground
          source={getStoreBannerSource()}
          style={styles.storeBackground}
          imageStyle={styles.backgroundImage}
        >
          <View style={styles.logoOverlay}>
            <View style={styles.storeLogo}>
              {typeof userStore?.imageUrl === 'string' && userStore.imageUrl.length > 0 ? (
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 76, height: 76, borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' }}>
                    <ImageBackground
                      source={require("../../assets/images/partial-react-logo.png")}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <ImageBackground
                        source={{ uri: userStore.imageUrl }}
                        style={{ width: '100%', height: '100%' }}
                        imageStyle={{ resizeMode: 'cover' }}
                      />
                    </ImageBackground>
                  </View>
            
                </View>
              ) : (
                <>
                  <View style={styles.logoIcon}>
                    <Text style={styles.logoText}>{getStoreInitial(getStoreName())}</Text>
                  </View>
                  <Text style={styles.logoLabel}>{getStoreName().toLowerCase()}</Text>
                </>
              )}
            </View>
          </View>
        </ImageBackground>
        
        {/* Store Information Below Banner */}
        <View style={styles.storeInfoSection}>
          <View style={styles.storeHeaderRow}>
            <View style={styles.storeTitleContainer}>
              <Text style={styles.storeName}>{getStoreName()}</Text>
              <Text style={styles.storeCategories}>{getStoreDescription()}</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push("/(retailers)/settings")}
            >
              <Ionicons name="pencil" size={16} color="#277874" />
            </TouchableOpacity>
          </View>
          
          {/* Store Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="cube" size={20} color="#277874" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>
                  {deduplicateProducts([...(catalogProducts || []), ...(products || [])]).filter((p: CatalogProduct | StoreProduct) => 
                    p.storeId === userStore?.id
                  ).length || 0}
                </Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="ticket" size={20} color="#FFBE5D" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{storePromotions.length || 0}</Text>
                <Text style={styles.statLabel}>Promotions</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push("/(retailers)/add-product")}
            >
              <Ionicons name="add-circle" size={20} color="#ffffff" />
              <Text style={styles.quickActionText}>Add Product</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionButton, styles.quickActionButtonSecondary]}
              onPress={() => router.push("/(retailers)/products")}
            >
              <Ionicons name="list" size={20} color="#277874" />
              <Text style={[styles.quickActionText, styles.quickActionTextSecondary]}>View Products</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Promotions and Products Section */}
      <RetailerDealsAndVouchers
        promotions={groupedRegularPromotions}
        vouchers={storeVouchers}
      />

      {/* Categories Bar */}
      <CategoriesBar
        categories={categories}
        active={activeCategory}
        onChange={setActiveCategory}
      />

      {/* Search Bar */}
      <StoreSearch value={query} onChange={setQuery} />

      {/* Products Grid */}
      <ProductsGrid
        storeId={userStore?.id}
        category={activeCategory}
        query={query}
        products={deduplicateProducts([...(catalogProducts || []), ...(products || [])])}
        getProductCategoryName={getProductCategoryName}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// CategoriesBar Component
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

// StoreSearch Component
function StoreSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (t: string) => void;
}) {
  return (
    <View style={styles.section}>
      <TextInput
        placeholder="Search products..."
        value={value}
        onChangeText={onChange}
        style={searchStyles.input}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}

// ProductsGrid Component
function ProductsGrid({
  storeId,
  query = "",
  category = "All",
  products = [],
  getProductCategoryName,
}: {
  storeId?: number;
  query?: string;
  category?: string;
  products?: (CatalogProduct | StoreProduct)[];
  getProductCategoryName: (product: CatalogProduct | StoreProduct) => string;
}) {
  const { state: { activePromotions } } = useStore();
  
  const getDiscounted = useCallback((p: CatalogProduct | StoreProduct) => {
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = (products || []).filter((p: CatalogProduct | StoreProduct) => {
      // Filter by storeId
      if (storeId != null && p.storeId !== storeId) return false;
      
      // Only show active products
      if ((p as any).isActive === false) return false;
      
      return true;
    });
    return source.filter((p: CatalogProduct | StoreProduct) => {
      const matchesQuery =
        q.length === 0 || String(p.name).toLowerCase().includes(q);
      const productCategoryName = getProductCategoryName(p);
      const matchesCategory =
        category === "All" ||
        productCategoryName.toLowerCase() === category.toLowerCase();
      return matchesQuery && matchesCategory;
    });
  }, [products, storeId, query, category, getProductCategoryName]);

  const handleProductPress = (p: CatalogProduct | StoreProduct) => {
    router.push({
      pathname: "/(retailers)/products",
      params: {
        productId: p.id?.toString(),
      },
    });
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Products</Text>
        <TouchableOpacity 
          style={styles.createPromotionButton}
          onPress={() => router.push("/(retailers)/add-product")}
        >
          <Ionicons name="add" size={16} color="#ffffff" />
          <Text style={styles.createPromotionButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <View style={gridStyles.grid}>
        {filtered.length > 0 ? (
          filtered.map((p: CatalogProduct | StoreProduct, index) => (
            <TouchableOpacity
              key={`product-${p.id}-${index}`}
              style={gridStyles.card}
              onPress={() => handleProductPress(p)}
              activeOpacity={0.8}
            >
              {typeof (p as any).imageUrl === 'string' && (p as any).imageUrl.length > 0 ? (
                <Image source={{ uri: (p as any).imageUrl }} style={gridStyles.image} />
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
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>
              {query ? "Try a different search term" : "Add your first product to get started!"}
            </Text>
            {!query && (
              <TouchableOpacity 
                style={styles.emptyActionButton}
                onPress={() => router.push("/(retailers)/add-product")}
              >
                <Text style={styles.emptyActionButtonText}>Add Product</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// RetailerDealsAndVouchers Component
function RetailerDealsAndVouchers({
  promotions,
  vouchers,
}: {
  promotions: { promotion: Promotion; products: (CatalogProduct | StoreProduct)[] }[];
  vouchers: { promotion: Promotion; product: CatalogProduct | StoreProduct }[];
}) {
  const { action: { findActivePromotions }, state: { userStore } } = useStore();
  const [showVouchers, setShowVouchers] = useState(false);
  const [expandedVoucherId, setExpandedVoucherId] = useState<number | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [showEditOverlay, setShowEditOverlay] = useState(false);
  
  // Group vouchers by promotion and collect products for each
  const voucherPromotionsWithProducts = useMemo(() => {
    const promotionMap = new Map<number, { promotion: Promotion; products: (CatalogProduct | StoreProduct)[] }>();
    
    vouchers.forEach(({ promotion, product }) => {
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
  }, [vouchers]);

  const handleDealPress = (promo: Promotion) => {
    setSelectedPromotion(promo);
    setShowEditOverlay(true);
  };

  const handleCloseOverlay = () => {
    setShowEditOverlay(false);
    setSelectedPromotion(null);
  };

  const handleUpdateComplete = () => {
    // Refresh promotions after update
    if (userStore?.id) {
      findActivePromotions(userStore.id);
    }
  };

  const handleVoucherProductPress = (product: CatalogProduct | StoreProduct, promo: Promotion) => {
    router.push({
      pathname: "/(retailers)/promotions",
      params: {
        promotionId: promo?.id?.toString(),
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
      case "PERCENTAGE_DISCOUNT": return colors.secondaryDark;
      case "FIXED_DISCOUNT": return colors.primary;
      case "BOGO": return colors.secondary;
      case "BUNDLE": return colors.primary;
      case "QUANTITY_DISCOUNT": return colors.secondaryDark;
      default: return colors.secondaryDark;
    }
  };

  if (promotions.length === 0 && vouchers.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Promotions</Text>
          <TouchableOpacity 
            style={styles.createPromotionButton}
            onPress={() => router.push("/(retailers)/promotions")}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text style={styles.createPromotionButtonText}>Create</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="ticket-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No active promotions</Text>
          <Text style={styles.emptySubtext}>Create your first promotion to boost sales!</Text>
          <TouchableOpacity 
            style={styles.emptyActionButton}
            onPress={() => router.push("/(retailers)/promotions")}
          >
            <Text style={styles.emptyActionButtonText}>Create Promotion</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Promotions</Text>
        <TouchableOpacity 
          style={styles.createPromotionButton}
          onPress={() => router.push("/(retailers)/promotions")}
        >
          <Ionicons name="add" size={16} color="#ffffff" />
          <Text style={styles.createPromotionButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Active Deals Section */}
      {promotions.length > 0 && (
        <>
          <View style={dealsStyles.sectionHeader}>
            <Text style={dealsStyles.sectionTitle}>Active Deals</Text>
            <Text style={dealsStyles.dealsCount}>{promotions.length}</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={dealsStyles.dealsRow}
          >
            {promotions.map(({ promotion, products }) => (
              <TouchableOpacity
                key={promotion.id}
                style={[dealsStyles.dealBox, { borderLeftColor: getDealColor(promotion.dealType) }]}
                onPress={() => handleDealPress(promotion)}
                activeOpacity={0.7}
              >
                <View style={dealsStyles.dealHeader}>
                  <View style={[dealsStyles.dealIconContainer, { backgroundColor: `${getDealColor(promotion.dealType)}15` }]}>
                    <Ionicons 
                      name={getDealIcon(promotion.dealType) as any} 
                      size={16} 
                      color={getDealColor(promotion.dealType)} 
                    />
                  </View>
                  <Text style={dealsStyles.dealType} numberOfLines={1}>
                    {promotion.dealType?.replace(/_/g, ' ') || 'DEAL'}
                  </Text>
                </View>
                <Text style={dealsStyles.dealTitle} numberOfLines={2}>
                  {promotion.title}
                </Text>
                {products.length > 1 && (
                  <Text style={dealsStyles.dealProductCount}>
                    {products.length} products
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}
      
      {/* Vouchers Section */}
      {voucherPromotionsWithProducts.length > 0 && (
        <View style={dealsStyles.vouchersSection}>
          <TouchableOpacity
            style={dealsStyles.voucherButton}
            onPress={() => setShowVouchers(!showVouchers)}
            activeOpacity={0.8}
          >
            <View style={dealsStyles.voucherHeader}>
              <View style={dealsStyles.voucherIconContainer}>
                <Ionicons name="ticket" size={16} color={colors.primary} />
              </View>
              <Text style={dealsStyles.voucherButtonText}>
                Vouchers ({voucherPromotionsWithProducts.length})
              </Text>
            </View>
            <Ionicons 
              name={showVouchers ? "chevron-up" : "chevron-down"} 
              size={18} 
              color={colors.gray600} 
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
                        size={16} 
                        color={colors.gray500} 
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
                          onPress={() => handleVoucherProductPress(product, promotion)}
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
                          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
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

      {/* Deal Type Edit Overlay */}
      <DealTypeEditOverlay
        isOpen={showEditOverlay}
        onClose={handleCloseOverlay}
        promotion={selectedPromotion}
        onUpdate={handleUpdateComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  storeHeader: {
    marginBottom: 15,
    borderRadius: 0,
    position: 'relative',
  },
  storeBackground: {
    height: 200,
    justifyContent: 'flex-end',
  },
  backgroundImage: {
    resizeMode: 'contain',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 20,
  },
  logoOverlay: {
    position: 'absolute',
    bottom: -20,
    left: 20,
    zIndex: 10,
  },
  storeLogo: {
    backgroundColor: "#ffffff",
    padding: 3,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoIcon: {
    width: 60,
    height: 60,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#277874",
  },
  logoLabel: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
  },
  storeInfoSection: {
    backgroundColor: "#f8fafc",
    padding: 20,
    paddingTop: 40,
    paddingBottom: 5,
  },
  storeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  storeTitleContainer: {
    flex: 1,
  },
  storeName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  storeCategories: {
    fontSize: 16,
    color: "#6b7280",
  },
  editButton: {
    backgroundColor: "#ffffff",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  quickActionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: "#277874",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionButtonSecondary: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#277874",
    shadowColor: "#000",
    shadowOpacity: 0.1,
  },
  quickActionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  quickActionTextSecondary: {
    color: "#277874",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  createPromotionButton: {
    backgroundColor: "#FFBE5D",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createPromotionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  emptyContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  emptyActionButton: {
    backgroundColor: "#FFBE5D",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyActionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});

const barStyles = StyleSheet.create({
  row: { 
    paddingHorizontal: 20,
    columnGap: 10,
    marginBottom: 12,
  },
  pill: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 100 
  },
  pillActive: { backgroundColor: "#277874" },
  pillInactive: { backgroundColor: "#E5E7EB" },
  text: { fontWeight: "600", fontSize: 14 },
  textActive: { color: "#fff" },
  textInactive: { color: "#6B7280" },
});

const searchStyles = StyleSheet.create({
  input: {
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
});

const gridStyles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#ffffff",
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
  textArea: { 
    paddingHorizontal: 12, 
    paddingTop: 8, 
    paddingBottom: 10 
  },
  productName: { 
    fontWeight: "700", 
    fontSize: 14,
    color: "#1f2937",
    marginBottom: 4,
  },
  price: { 
    color: "#277874", 
    fontWeight: "900", 
    fontSize: 14,
  },
  priceOld: { 
    color: "#9CA3AF", 
    textDecorationLine: 'line-through', 
    fontSize: 12,
  },
});

const dealsStyles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.gray900,
  },
  dealsCount: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  dealsRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dealBox: {
    width: 160,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: colors.gray200,
    marginRight: spacing.sm,
  },
  dealHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  dealIconContainer: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  dealType: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.gray600,
    textTransform: "uppercase",
    flex: 1,
  },
  dealTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.gray900,
    lineHeight: 18,
  },
  vouchersSection: {
    marginTop: spacing.sm,
  },
  voucherButton: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  voucherHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  voucherIconContainer: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  voucherButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  vouchersList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  voucherItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  voucherItemTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.gray900,
    lineHeight: 18,
  },
  voucherItemValue: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 2,
  },
  voucherKindWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  voucherKindWrapperLast: {
    borderBottomWidth: 0,
  },
  voucherKindDropdown: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray50,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  voucherKindHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  voucherKindInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  voucherKindTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  voucherKindMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  voucherKindValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  voucherKindRemaining: {
    fontSize: 11,
    color: colors.gray500,
  },
  voucherProductsList: {
    backgroundColor: colors.white,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    marginLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.primaryLight,
  },
  voucherProductItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.white,
  },
  voucherProductItemLast: {
    borderBottomWidth: 0,
  },
  voucherProductInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  voucherProductName: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  voucherProductPrice: {
    fontSize: 12,
    color: colors.gray600,
  },
  dealProductCount: {
    fontSize: 11,
    color: colors.gray500,
    marginTop: spacing.xs,
    fontWeight: "500",
  },
});