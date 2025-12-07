import { useStore } from "@/features/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useTabs } from "@/hooks/useTabs";
import { useModal } from "@/hooks/useModal";
import { useQueryHistory } from "@/hooks/useQueryHistory";
import {
  SearchPrompt,
  InsightsPanel,
  RecommendationTabs,
  RecommendationCard,
  QueryHistoryModal,
  type RecommendationTab,
} from "@/components/consumers/explore";

const DEFAULT_DISTANCE_KM = 1.3;

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [insightsExpanded, setInsightsExpanded] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(true);
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState<string | null>(null);
  const router = useRouter();
  const {
    state: { nearbyStores },
  } = useStore();

  // Hooks for state management
  const { loading, response, fetchRecommendations } = useRecommendations();
  const { activeTab, setActiveTab } = useTabs<RecommendationTab>("best");
  const { isOpen: showHistoryModal, open: openHistoryModal, close: closeHistoryModal } = useModal();
  const { history: queryHistory, addEntry } = useQueryHistory();

  const { aiResponse, insightsSummary, recommendations, highlight, elaboration } = response;

  const normalizeDistance = useCallback((raw: any) => {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string") {
      const parsed = parseFloat(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  }, []);

  const extractDistanceFromItem = useCallback((item: any) => {
    if (!item) return null;
    const candidates = [
      item.distance,
      item.distanceKm,
      item.distance_km,
      item.storeDistance,
      item.store_distance,
      item.store?.distance,
      item.store?.distanceKm,
      item.store?.distance_km,
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
      const normalized = normalizeDistance((store as any)?.distance);
      if (normalized != null && typeof store?.id === "number") {
        map.set(store.id, normalized);
      }
    });
    return map;
  }, [nearbyStores, normalizeDistance]);

  const enrichDistance = useCallback(
    (item: any) => {
      if (!item) return item;
      const inferred = extractDistanceFromItem(item);
      if (inferred != null) return { ...item, distance: inferred };

      const storeId = item?.storeId || item?.store?.id;
      if (storeId && storeDistanceMap.has(storeId)) {
        return { ...item, distance: storeDistanceMap.get(storeId) };
      }

      return item;
    },
    [extractDistanceFromItem, storeDistanceMap]
  );

  const hasResults = useMemo(
    () => !!aiResponse || (recommendations && recommendations.length > 0),
    [aiResponse, recommendations]
  );

  const displayedRecommendations = useMemo(() => {
    const items = Array.isArray(recommendations)
      ? recommendations.map((item) => enrichDistance(item))
      : [];
    if (activeTab === "cheapest") {
      return items.sort((a, b) => (Number(a?.price ?? Infinity) as number) - (Number(b?.price ?? Infinity) as number));
    }
    if (activeTab === "closest") {
      return items.sort((a, b) => {
        const distanceA = typeof a?.distance === "number" ? a.distance : extractDistanceFromItem(a);
        const distanceB = typeof b?.distance === "number" ? b.distance : extractDistanceFromItem(b);
        if (distanceA == null && distanceB == null) return 0;
        if (distanceA == null) return 1;
        if (distanceB == null) return -1;
        return distanceA - distanceB;
      });
    }
    return items.sort((a, b) => (Number(b?.discount ?? 0) as number) - (Number(a?.discount ?? 0) as number));
  }, [recommendations, activeTab, enrichDistance, extractDistanceFromItem]);

  const submitSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query || loading) return;
    
    setLastSubmittedQuery(query);
    setInsightsExpanded(false);
    
    await fetchRecommendations(query, enrichDistance);
    
    setIsEditingPrompt(false);
  }, [searchQuery, loading, fetchRecommendations, enrichDistance]);

  // Add to query history when response is received
  useEffect(() => {
    if (lastSubmittedQuery && (aiResponse || recommendations.length > 0)) {
      addEntry(
        lastSubmittedQuery,
        aiResponse || "No response received",
        recommendations.length
      );
    }
  }, [lastSubmittedQuery, aiResponse, recommendations.length, addEntry]);

  return (
    <>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
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
                  recommendationsCount={recommendations.length}
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
            <RecommendationTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              resultsCount={displayedRecommendations?.length}
            />
            {loading ? (
              <View style={styles.resultsList}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <View key={`shimmer-${i}`} style={styles.resultCard}>
                    <View style={styles.resultHeaderRow}>
                      <View style={[styles.badge, styles.badgeShimmer]} />
                      <View style={[styles.badge, styles.badgeShimmerSmall]} />
                    </View>
                    <View style={styles.cardBodyRow}>
                      <View style={styles.placeholderImage} />
                      <View style={styles.cardInfo}>
                        <View style={[styles.shimmerLine, { width: "80%" }]} />
                        <View style={[styles.shimmerLine, { width: "60%" }]} />
                        <View style={[styles.shimmerLine, { width: 100 }]} />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : displayedRecommendations?.length > 0 ? (
              <View style={styles.resultsList}>
                {displayedRecommendations.map((item, idx) => {
                  const distanceValue =
                    typeof item?.distance === "number"
                      ? item.distance
                      : extractDistanceFromItem(item);
                  return (
                    <RecommendationCard
                      key={item?.id ?? idx}
                      item={item}
                      activeTab={activeTab}
                      distance={distanceValue ?? DEFAULT_DISTANCE_KM}
                    />
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyResultsContainer}>
                <Ionicons name="search-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyResultsText}>This product is not found</Text>
                <Text style={styles.emptyResultsSubtext}>
                  Try searching with different keywords
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Show prompt panel at BOTTOM when no results are displayed */}
        {!hasResults && !loading && (
          <View style={styles.searchContainerBottom}>
            {isEditingPrompt ? (
              <SearchPrompt
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSubmit={submitSearch}
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
                recommendationsCount={recommendations.length}
              />
            )}
          </View>
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
    
    {/* History Button - positioned outside the prompt panel */}
    <TouchableOpacity 
      style={styles.historyButton} 
      onPress={openHistoryModal} 
      accessibilityRole="button"
    >
      <Ionicons name="time-outline" size={20} color="#ffffff" />
    </TouchableOpacity>
  </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    padding: 20,
    paddingTop: 10,
    flexGrow: 1,
    minHeight: "100%",
  },
  searchContainer: {
    marginBottom: 20,
    marginTop: 0,
  },
  searchContainerBottom: {
    marginTop: 480,
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
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  loadingText: {
    color: "#334155",
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
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  shimmerLine: {
    height: 14,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    marginBottom: 10,
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
  emptyResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  emptyResultsText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6B7280",
    marginTop: 16,
    textAlign: "center",
  },
  emptyResultsSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
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
  historyButton: {
    position: "absolute",
    bottom: 10,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1f7a6e",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
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
});
