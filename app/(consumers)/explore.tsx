import {
  ChatResponse,
  InsightsPanel,
  PromotionCard,
  QueryHistoryModal,
  RecommendationCard,
  RecommendationTabs,
  SearchPrompt,
  StoreCard,
  type RecommendationTab,
} from "@/components/consumers/explore";
import { useStore } from "@/features/store";
import { useModal } from "@/hooks/useModal";
import { useQueryHistory } from "@/hooks/useQueryHistory";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useTabs } from "@/hooks/useTabs";
import { borderRadius, colors, shadows, spacing, typography } from "@/styles/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface RecommendationItem {
  id?: number;
  name?: string;
  title?: string;
  price?: number | string;
  discount?: number;
  imageUrl?: string;
  storeId?: number;
  store?: { id?: number; name?: string };
  storeName?: string;
  description?: string;
  distance?: number;
}

const DEFAULT_DISTANCE_KM = 1.3;

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [insightsExpanded, setInsightsExpanded] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(true);
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radius, setRadius] = useState<5 | 10 | 15>(5);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<"granted" | "denied" | "checking">("checking");
  const [sortOption, setSortOption] = useState<"best-deal" | "closest" | "cheapest">("best-deal");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const {
    state: { nearbyStores },
  } = useStore();

  // Hooks for state management
  const { loading, response, fetchRecommendations, reset: resetRecommendations } = useRecommendations();
  const { activeTab, setActiveTab, reset: resetTabs } = useTabs<RecommendationTab>("all");
  const { isOpen: showHistoryModal, open: openHistoryModal, close: closeHistoryModal } = useModal();
  const { history: queryHistory, addEntry } = useQueryHistory();

  const { aiResponse, insightsSummary, recommendations, highlight, elaboration, intent, products, stores, promotions } = response;

  const hasResults = useMemo(
    () => !!aiResponse || products.length > 0 || stores.length > 0 || promotions.length > 0,
    [aiResponse, products, stores, promotions]
  );

  // Sort products based on selected sort option
  const sortedProducts = useMemo(() => {
    if (activeTab !== "products" && activeTab !== "all") {
      return products;
    }

    const sorted = [...products].sort((a: any, b: any) => {
      if (sortOption === "best-deal") {
        // Sort by discount percentage (highest first), then by price (lowest first)
        const discountA = a.discount || 0;
        const discountB = b.discount || 0;
        if (discountB !== discountA) {
          return discountB - discountA;
        }
        // If same discount, sort by price
        const priceA = typeof a.price === 'number' ? a.price : (typeof a.price === 'string' ? parseFloat(a.price) : Infinity);
        const priceB = typeof b.price === 'number' ? b.price : (typeof b.price === 'string' ? parseFloat(b.price) : Infinity);
        return priceA - priceB;
      } else if (sortOption === "closest") {
        // Sort by distance (lowest first)
        const distanceA = a.distance ?? Infinity;
        const distanceB = b.distance ?? Infinity;
        return distanceA - distanceB;
      } else if (sortOption === "cheapest") {
        // Sort by price (lowest first)
        const priceA = typeof a.price === 'number' ? a.price : (typeof a.price === 'string' ? parseFloat(a.price) : Infinity);
        const priceB = typeof b.price === 'number' ? b.price : (typeof b.price === 'string' ? parseFloat(b.price) : Infinity);
        return priceA - priceB;
      }
      return 0;
    });

    return sorted;
  }, [products, sortOption, activeTab]);

  // Filter content based on active tab
  const filteredContent = useMemo(() => {
    if (activeTab === "products") {
      return { products: sortedProducts, stores: [], promotions: [] };
    }
    if (activeTab === "stores") {
      return { products: [], stores, promotions: [] };
    }
    if (activeTab === "promotions") {
      return { products: [], stores: [], promotions };
    }
    // "all" tab
    return { products: sortedProducts, stores, promotions };
  }, [activeTab, sortedProducts, stores, promotions]);

  const totalCount = products.length + stores.length + promotions.length;

  // Request location permission and get current location
  useEffect(() => {
    const requestLocation = async () => {
      try {
        console.log("[Explore] Requesting location permission...");
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log("[Explore] Location permission status:", status);
        
        if (status === "granted") {
          setLocationPermissionStatus("granted");
          try {
            console.log("[Explore] Getting current position...");
            const position = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            console.log("[Explore] Location obtained:", coords);
            setLocation(coords);
          } catch (error) {
            console.warn("[Explore] Failed to get current location:", error);
            setLocationPermissionStatus("denied");
            setLocation(null);
          }
        } else {
          console.log("[Explore] Location permission denied");
          setLocationPermissionStatus("denied");
          setLocation(null);
        }
      } catch (error) {
        console.warn("[Explore] Location permission error:", error);
        setLocationPermissionStatus("denied");
        setLocation(null);
      }
    };

    requestLocation();
  }, []);

  // Animate fade in when results appear
  useEffect(() => {
    if (hasResults && !loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [hasResults, loading]);

  const normalizeDistance = useCallback((raw: unknown) => {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string") {
      const parsed = parseFloat(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  }, []);

  const extractDistanceFromItem = useCallback((item: Record<string, unknown> | RecommendationItem) => {
    if (!item) return null;
    const itemRecord = item as Record<string, unknown>;
    const candidates = [
      itemRecord.distance,
      itemRecord.distanceKm,
      itemRecord.distance_km,
      itemRecord.storeDistance,
      itemRecord.store_distance,
      (itemRecord.store as Record<string, unknown>)?.distance,
      (itemRecord.store as Record<string, unknown>)?.distanceKm,
      (itemRecord.store as Record<string, unknown>)?.distance_km,
    ];
    for (const candidate of candidates) {
      const normalized = normalizeDistance(candidate);
      if (normalized != null) return normalized;
    }
    return null;
  }, [normalizeDistance]);

  const storeDistanceMap = useMemo(() => {
    const map = new Map<number, number>();
    (nearbyStores || []).forEach((store) => {
      const normalized = normalizeDistance((store as { distance?: unknown })?.distance);
      if (normalized != null && typeof store?.id === "number") {
        map.set(store.id, normalized);
      }
    });
    return map;
  }, [nearbyStores, normalizeDistance]);

  const enrichDistance = useCallback(
    (item: RecommendationItem): RecommendationItem => {
      if (!item) return item;
      const inferred = extractDistanceFromItem(item as Record<string, unknown>);
      if (inferred != null) return { ...item, distance: inferred };

      const storeId = item?.storeId || item?.store?.id;
      if (storeId && typeof storeId === 'number' && storeDistanceMap.has(storeId)) {
        return { ...item, distance: storeDistanceMap.get(storeId) ?? undefined };
      }

      return item;
    },
    [extractDistanceFromItem, storeDistanceMap]
  );

  // Check if we have structured data (products, stores, or promotions)
  const hasStructuredData = useMemo(() => {
    return products.length > 0 || stores.length > 0 || promotions.length > 0;
  }, [products.length, stores.length, promotions.length]);

  const submitSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query || loading) return;
    
    console.log("[Explore] Submitting search:", {
      query,
      hasLocation: !!location,
      location: location ? { latitude: location.latitude, longitude: location.longitude } : null,
      radius,
    });
    
    setLastSubmittedQuery(query);
    setInsightsExpanded(false);
    
    await fetchRecommendations(
      query,
      enrichDistance,
      location || undefined,
      radius,
      10
    );
    
    setIsEditingPrompt(false);
  }, [searchQuery, loading, fetchRecommendations, enrichDistance, location, radius]);

  // Reset state when screen loses focus (user navigates away)
  useFocusEffect(
    useCallback(() => {
      // This runs when screen comes into focus
      // Return cleanup function that runs when screen loses focus
      return () => {
        // Reset all state when user navigates away
        setSearchQuery("");
        setLastSubmittedQuery(null);
        setInsightsExpanded(false);
        setIsEditingPrompt(true);
        setSortOption("best-deal");
        resetRecommendations();
        resetTabs();
      };
    }, [resetRecommendations, resetTabs])
  );

  // Add to query history when response is received (only once per query)
  const lastAddedQueryRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      lastSubmittedQuery &&
      lastSubmittedQuery !== lastAddedQueryRef.current &&
      (aiResponse || (recommendations && recommendations.length > 0))
    ) {
      lastAddedQueryRef.current = lastSubmittedQuery;
      addEntry(
        lastSubmittedQuery,
        aiResponse || "No response received",
        totalCount
      );
    }
  }, [lastSubmittedQuery, aiResponse, recommendations, addEntry]);

  return (
      <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.select({ ios: "padding", android: "height" })}
      keyboardVerticalOffset={Platform.select({ ios: 90, android: 0 })}
    >
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Show prompt/insights panel at TOP only when results are displayed */}
          {hasResults && (
            <View style={styles.searchContainer}>
              {isEditingPrompt ? (
                <SearchPrompt
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSubmit={submitSearch}
                  radius={radius}
                  onRadiusChange={setRadius}
                  hasLocation={locationPermissionStatus === "granted" && location !== null}
                />
              ) : (
                <InsightsPanel
                  summary={insightsSummary}
                  text={aiResponse}
                  highlight={highlight}
                  elaboration={elaboration}
                  isExpanded={insightsExpanded}
                  onToggleExpand={() => setInsightsExpanded((v) => !v)}
                  onEditPrompt={() => setIsEditingPrompt(true)}
                  lastSubmittedQuery={lastSubmittedQuery}
                  recommendationsCount={totalCount}
                  intent={intent}
                />
              )}
            </View>
          )}

          {/* Loading inline under the panel */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#277874" />
            <Text style={styles.loadingText}>Finding the best deals…</Text>
          </View>
        )}
        {/* Results list with tabs and shimmer while loading */}
        {(hasResults || loading) && (
          <View>
            {loading ? (
              <View style={styles.resultsList}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <View key={`shimmer-${i}`} style={styles.shimmerCard}>
                    <View style={styles.shimmerHeader}>
                      <View style={styles.shimmerBadge} />
                      <View style={styles.shimmerBadgeSmall} />
                    </View>
                    <View style={styles.shimmerBody}>
                      <View style={styles.shimmerImage} />
                      <View style={styles.shimmerContent}>
                        <View style={[styles.shimmerLine, { width: "85%", marginBottom: 8 }]} />
                        <View style={[styles.shimmerLine, { width: "70%", marginBottom: 8 }]} />
                        <View style={[styles.shimmerLine, { width: "60%" }]} />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Animated.View style={{ opacity: fadeAnim }}>
                {/* Always show AI response content if available */}
                {aiResponse && (
                  <View style={styles.chatResponseContainer}>
                    <ChatResponse content={aiResponse} />
                  </View>
                )}

                {/* Show tabs only if we have structured data */}
                {hasStructuredData && totalCount > 0 && (
                  <RecommendationTabs
                    activeTab={activeTab}
                    onTabChange={(tab) => {
                      setActiveTab(tab);
                      setSortOption("best-deal");
                    }}
                    productsCount={products.length}
                    storesCount={stores.length}
                    promotionsCount={promotions.length}
                  />
                )}

                {/* Sort Options - Only show for products */}
                {activeTab === "products" && sortedProducts.length > 0 && (
                  <View style={styles.categoryContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {[
                        { key: "best-deal", label: "Best Deal" },
                        { key: "closest", label: "Closest" },
                        { key: "cheapest", label: "Cheapest" },
                      ].map((option) => (
                        <TouchableOpacity
                          key={option.key}
                          style={[
                            styles.categoryChip,
                            sortOption === option.key && styles.activeCategoryChip,
                          ]}
                          onPress={() => setSortOption(option.key as "best-deal" | "closest" | "cheapest")}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              sortOption === option.key &&
                                styles.activeCategoryChipText,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Show cards if we have structured data */}
                {hasStructuredData && totalCount > 0 ? (
                  <View style={styles.resultsList}>
                    {/* Products */}
                    {filteredContent.products.map((product, idx) => {
                      const distanceValue = product.distance ?? undefined;
                      const item: RecommendationItem = {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        imageUrl: product.imageUrl || undefined,
                        storeId: product.storeId,
                        storeName: product.storeName || undefined,
                        description: product.description,
                        distance: distanceValue,
                      };
                      const enrichedItem = enrichDistance(item);
                      return (
                        <RecommendationCard
                          key={`product-${product.id}-${idx}`}
                          item={enrichedItem}
                          activeTab={activeTab}
                          distance={enrichedItem.distance ?? DEFAULT_DISTANCE_KM}
                        />
                      );
                    })}

                    {/* Stores */}
                    {filteredContent.stores.map((store, idx) => (
                      <StoreCard
                        key={`store-${store.id}-${idx}`}
                        store={store}
                      />
                    ))}

                    {/* Promotions */}
                    {filteredContent.promotions.map((promotion, idx) => (
                      <PromotionCard
                        key={`promotion-${promotion.id}-${idx}`}
                        promotion={promotion}
                      />
                    ))}
                  </View>
                ) : !hasStructuredData && aiResponse ? (
                  // If we have content but no structured data, just show the content (already shown above)
                  null
                ) : (
                  // Empty state when no content and no structured data
                  <Animated.View style={[styles.emptyResultsContainer, { opacity: fadeAnim }]}>
                    <View style={styles.emptyIconContainer}>
                      {intent === "store" ? (
                        <Ionicons name="storefront-outline" size={80} color={colors.gray300} />
                      ) : intent === "promotion" ? (
                        <Ionicons name="pricetag-outline" size={80} color={colors.gray300} />
                      ) : (
                        <Ionicons name="search-outline" size={80} color={colors.gray300} />
                      )}
                    </View>
                    <Text style={styles.emptyResultsText}>
                      {intent === "store" 
                        ? "No stores found" 
                        : intent === "promotion"
                        ? "No promotions found"
                        : "No results found"}
                    </Text>
                    <Text style={styles.emptyResultsSubtext}>
                      {intent === "store"
                        ? "Try searching for different store types or adjust your search radius"
                        : intent === "promotion"
                        ? "Try searching for different deals or check back later for new promotions"
                        : "Try searching with different keywords or adjust your search radius"}
                    </Text>
                  </Animated.View>
                )}
              </Animated.View>
            )}
          </View>
        )}

        {/* Show prompt panel at TOP and welcome message CENTERED when no results are displayed */}
        {!hasResults && !loading && (
          <>
            {/* SearchPrompt at the top */}
            <View style={styles.searchContainerTop}>
              {isEditingPrompt ? (
                <SearchPrompt
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSubmit={submitSearch}
                  radius={radius}
                  onRadiusChange={setRadius}
                  hasLocation={locationPermissionStatus === "granted" && location !== null}
                />
              ) : (
                <InsightsPanel
                  summary={insightsSummary}
                  text={aiResponse}
                  highlight={highlight}
                  elaboration={elaboration}
                  isExpanded={insightsExpanded}
                  onToggleExpand={() => setInsightsExpanded((v) => !v)}
                  onEditPrompt={() => setIsEditingPrompt(true)}
                  lastSubmittedQuery={lastSubmittedQuery}
                  recommendationsCount={totalCount}
                  intent={intent}
                />
              )}
            </View>
            {/* Welcome message centered in the middle */}
            {isEditingPrompt && (
              <View style={styles.welcomeContainerCentered}>
                <View style={styles.welcomeContent}>
                  <Ionicons name="compass-outline" size={64} color={colors.primaryLight} />
                  <Text style={styles.welcomeTitle}>Discover Great Deals</Text>
                  <Text style={styles.welcomeText}>
                    Search for products, stores, or promotions. Ask me anything!
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
      </View>

      {/* Query History Modal */}
      <QueryHistoryModal
        visible={showHistoryModal}
        onClose={closeHistoryModal}
        history={queryHistory}
        onReuseQuery={(query) => {
          setSearchQuery(query);
          closeHistoryModal();
        }}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.select({ ios: 100, android: 80 }),
  },
  content: {
    padding: 20,
    paddingTop: Platform.select({ ios: 20, android: 10 }),
    flexGrow: 1,
    minHeight: "100%",
  },
  searchContainer: {
    marginBottom: 20,
    marginTop: 0,
  },
  searchContainerTop: {
    marginBottom: 20,
    marginTop: 0,
  },
  searchContainerBottom: {
    marginTop: "auto",
    paddingBottom: spacing.xl,
  },
  insightHeadlineContainer: {
    flex: 1,
    marginHorizontal: 10,
    transform: [{ scale: 0.88 }],
    justifyContent: "center",
  },
  insightHeadline: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    lineHeight: 16,
    flexWrap: "wrap",
  },
  expandPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1f7a6e",
  },
  expandPillText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
    marginBottom: 16,
    paddingVertical: 8,
  },
  loadingText: {
    color: colors.gray700,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 8,
  },
  tabBtn: {
    paddingVertical: 8,
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#277874",
  },
  tabText: {
    color: "#475569",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#0f172a",
  },
  resultsCount: {
    color: "#6B7280",
    marginBottom: 8,
  },
  resultsList: {
    gap: 14,
  },
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  resultHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeGreen: {
    backgroundColor: "#d1fae5",
  },
  badgeYellow: {
    backgroundColor: "#fef3c7",
  },
  badgeTeal: {
    backgroundColor: "#ccfbf1",
  },
  badgeShimmer: {
    backgroundColor: "#e5e7eb",
    width: 90,
    height: 24,
    borderRadius: 999,
  },
  badgeShimmerSmall: {
    backgroundColor: "#e5e7eb",
    width: 70,
    height: 24,
    borderRadius: 999,
  },
  badgeText: {
    color: "#065f46",
    fontWeight: "800",
  },
  badgeOff: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeOffText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  cardBodyRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  placeholderImage: {
    width: 110,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  resultImage: {
    width: 110,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  cardMeta: {
    color: "#6b7280",
  },
  cardPrice: {
    color: "#166534",
    fontWeight: "800",
    marginTop: 8,
  },
  cardActions: {
    alignItems: "flex-end",
    marginTop: 10,
  },
  chatContainer: {
    marginTop: spacing.md,
  },
  chatResponseContainer: {
    marginBottom: spacing.lg,
  },
  emptyResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 20,
    marginTop: 40,
  },
  emptyIconContainer: {
    marginBottom: spacing.md,
  },
  emptyResultsText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.gray700,
    marginTop: spacing.md,
    textAlign: "center",
  },
  emptyResultsSubtext: {
    fontSize: 15,
    color: colors.gray500,
    marginTop: spacing.sm,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  welcomeContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  welcomeContainerCentered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
  },
  welcomeContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  welcomeTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    marginTop: spacing.md,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
  shimmerCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    ...shadows.sm,
  },
  shimmerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  shimmerBadge: {
    width: 80,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray200,
  },
  shimmerBadgeSmall: {
    width: 60,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray200,
  },
  shimmerBody: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  shimmerImage: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray200,
  },
  shimmerContent: {
    flex: 1,
  },
  shimmerLine: {
    height: 12,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  emptyBox: {
    height: "100%",
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchBox: {
    backgroundColor: "#F3E5BC",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    gap: 12,
  },
  searchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  searchInput: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(231, 167, 72, 0.2)",
  },
  progressLines: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  progressLine1: {
    width: 120,
    height: 4,
    backgroundColor: "#FFBE5D",
    borderRadius: 2,
  },
  progressLine2: {
    width: 60,
    height: 4,
    backgroundColor: "#277874",
    borderRadius: 2,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#CC8A2C",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  insightsCard: {
    backgroundColor: "#fff7ed",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fed7aa",
    padding: 16,
    marginBottom: 12,
  },
  insightsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#6b3f14",
  },
  expandBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f59e0b33",
    justifyContent: "center",
    alignItems: "center",
  },
  insightsBody: {
    marginTop: 8,
  },


  insightsScrollContent: {
    paddingBottom: 8,
    paddingRight: 4,
    flexGrow: 1,
  },
  insightsTextContainer: {
    color: "#6b3f14",
    lineHeight: 26,
    fontSize: 15,
  },
  insightsText: {
    color: "#6b3f14",
    lineHeight: 26,
    fontSize: 15,
  },
  insightsTextBold: {
    color: "#92400E",
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  insightsTextHighlight: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    fontWeight: "600",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 15,
    lineHeight: 26,
    overflow: "hidden",
  },
  insightsHeading: {
    color: "#92400E",
    fontWeight: "800",
    fontSize: 18,
    marginBottom: 10,
    marginTop: 4,
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  insightParagraph: {
    marginTop: 14,
    paddingBottom: 4,
  },
  insightsTextMuted: {
    color: "#9a6c3a",
    marginBottom: 10,
    fontSize: 16,
    paddingRight: 4,
  },
  // Highlight container styles
  highlightContainer: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  highlightIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  highlightContent: {
    flex: 1,
  },
  highlightLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Elaboration container styles
  elaborationContainer: {
    flexDirection: "row",
    backgroundColor: "#E0F2F1",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#277874",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  elaborationIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  elaborationContent: {
    flex: 1,
  },
  elaborationLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#277874",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Highlight text styles
  highlightTextContainer: {
    color: "#92400E",
    lineHeight: 24,
    fontSize: 15,
    fontWeight: "500",
  },
  highlightText: {
    color: "#92400E",
    lineHeight: 24,
    fontSize: 15,
    fontWeight: "500",
  },
  highlightTextBold: {
    color: "#78350F",
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 24,
  },
  highlightTextHighlight: {
    backgroundColor: "#FDE68A",
    color: "#78350F",
    fontWeight: "600",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 15,
    lineHeight: 24,
  },
  // Elaboration text styles
  elaborationTextContainer: {
    color: "#1E3A34",
    lineHeight: 24,
    fontSize: 15,
  },
  elaborationText: {
    color: "#1E3A34",
    lineHeight: 24,
    fontSize: 15,
  },
  elaborationTextBold: {
    color: "#0F766E",
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 24,
  },
  elaborationTextHighlight: {
    backgroundColor: "#B2F5EA",
    color: "#0F766E",
    fontWeight: "600",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 15,
    lineHeight: 24,
  },
  recommendationsContainer: {
    gap: 12,
  },
  recommendationCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
  },
  recommendationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  recommendationName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    paddingRight: 8,
  },
  badgeDiscount: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeDiscountText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  recommendationMeta: {
    color: "#475569",
    marginBottom: 4,
  },
  recommendationPrice: {
    color: "#166534",
    fontWeight: "800",
    marginBottom: 8,
  },
  detailsBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#1f7a6e",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  detailsBtnText: {
    color: "#ffffff",
    fontWeight: "700",
  },

  // ===== HISTORY MODAL STYLES =====
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#277874",
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  historyList: {
    maxHeight: 400,
  },
  historyCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  historyQuery: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginRight: 12,
  },
  historyTimestamp: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  historyResponse: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 12,
  },
  historyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f2f1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  resultsText: {
    fontSize: 12,
    color: "#277874",
    fontWeight: "500",
  },
  reuseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9f8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  reuseButtonText: {
    fontSize: 12,
    color: "#277874",
    fontWeight: "600",
  },
  emptyHistoryState: {
    alignItems: "center",
    padding: 40,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 12,
    marginBottom: 8,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  activeCategoryChip: {
    backgroundColor: "#277874",
    borderColor: "#277874",
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  activeCategoryChipText: {
    color: "#ffffff",
  },
});
