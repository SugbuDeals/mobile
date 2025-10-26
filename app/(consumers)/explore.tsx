import env from "@/config/env";
import { useAppSelector } from "@/store/hooks";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";

import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [insightsExpanded, setInsightsExpanded] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [insightsSummary, setInsightsSummary] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const [isEditingPrompt, setIsEditingPrompt] = useState(true);
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"best" | "cheapest" | "closest">("best");
  const router = useRouter();

  const hasResults = useMemo(
    () => !!aiResponse || (recommendations && recommendations.length > 0),
    [aiResponse, recommendations]
  );

  const displayedRecommendations = useMemo(() => {
    const items = Array.isArray(recommendations) ? [...recommendations] : [];
    if (activeTab === "cheapest") {
      return items.sort((a, b) => (Number(a?.price ?? Infinity) as number) - (Number(b?.price ?? Infinity) as number));
    }
    if (activeTab === "closest") {
      return items; // placeholder until distance available
    }
    return items.sort((a, b) => (Number(b?.discount ?? 0) as number) - (Number(a?.discount ?? 0) as number));
  }, [recommendations, activeTab]);

  const extractPrimaryProduct = useCallback((text: string | null | undefined) => {
    if (!text) return null;
    // Try a few common phrasings
    const patterns = [
      /I\s*recommend\s*the\s*([^,\.]+?)(?:,|\.|$)/i,
      /Primary\s*product\s*is\s*([^,\.]+?)(?:,|\.|$)/i,
      /best\s*deals\s*(?:on|for)\s*([^,\.]+?)(?:,|\.|$)/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) return match[1].trim();
    }
    return null;
  }, []);

  const submitSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query || loading) return;
    setLoading(true);
    setAiResponse(null);
    setInsightsSummary(null);
    setRecommendations([]);
    setInsightsExpanded(false);
    try {
      setLastSubmittedQuery(query);
      // Call AI recommendations endpoint
      const recRes = await fetch(`${env.API_BASE_URL}/ai/recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ query, count: 10 }),
      });
      // Parse body as JSON if possible, else as text
      const rawText = await recRes.text();
      let recJson: any = {};
      try {
        recJson = rawText ? JSON.parse(rawText) : {};
      } catch {
        recJson = { content: rawText };
      }

      // Attempt to derive insight text and items from flexible response shapes
      // Handle flexible AI response payloads
      const directAssistantText =
        typeof recJson?.content === "string" && recJson?.role === "assistant"
          ? recJson.content
          : null;
      const fromMessages = Array.isArray(recJson?.messages)
        ? recJson.messages.find((m: any) => m?.role === "assistant" && typeof m?.content === "string")?.content
        : null;
      const insightText =
        directAssistantText ||
        fromMessages ||
        recJson?.insight ||
        recJson?.summary ||
        recJson?.message ||
        null;
      const items = recJson?.products || recJson?.recommendations || recJson?.items || [];
      if (insightText && !/^unauthorized$/i.test(String(insightText).trim())) {
        setAiResponse(insightText);
        const product = extractPrimaryProduct(insightText);
        if (product) setInsightsSummary(`I found the best deals for ${product}`);
      }
      if (Array.isArray(items)) setRecommendations(items);
      setInsightsExpanded(false);
      setIsEditingPrompt(false);
    } catch (e) {
      setAiResponse("Sorry, I couldn't fetch recommendations right now.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, loading, accessToken, extractPrimaryProduct]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* When editing, show prompt panel; otherwise show Insights panel styled like the prompt */}
        <View style={styles.searchContainer}>
          {isEditingPrompt ? (
            <View style={styles.searchBox}>
              <View style={styles.topRow}>
                <LinearGradient
                  colors={["#FFBE5D", "#277874"]}
                  style={styles.searchIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="logo-android" size={24} color="#ffffff" />
                </LinearGradient>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Searching for something?"
                  placeholderTextColor="#6B7280"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  onSubmitEditing={submitSearch}
                />
                <TouchableOpacity style={styles.sendButton} onPress={submitSearch} accessibilityRole="button">
                  <Ionicons name="send" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <View style={styles.bottomRow}>
                <View style={styles.progressLines}>
                  <View style={styles.progressLine1} />
                  <View style={styles.progressLine2} />
                </View>
                <TouchableOpacity style={styles.micButton}>
                  <Ionicons name="mic" size={25} color="#E7A748" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setIsEditingPrompt(true)} accessibilityRole="button">
              <View style={styles.searchBox}>
                <View style={styles.topRow}>
                  <LinearGradient
                    colors={["#FFBE5D", "#277874"]}
                    style={styles.searchIconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="logo-android" size={24} color="#ffffff" />
                  </LinearGradient>
                  <Text style={styles.insightHeadline} numberOfLines={2}>
                    {lastSubmittedQuery
                      ? `I found the best deals for ${lastSubmittedQuery}`
                      : insightsSummary || aiResponse || "I found the best deals near you"}
                  </Text>
                  <TouchableOpacity style={styles.expandPill} onPress={() => setInsightsExpanded((v) => !v)} accessibilityRole="button">
                    <Text style={styles.expandPillText}>{insightsExpanded ? "Hide" : "Details"}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.bottomRow}>
                  <View style={styles.progressLines}>
                    <View style={styles.progressLine1} />
                    <View style={styles.progressLine2} />
                  </View>
                  <Ionicons name={insightsExpanded ? "chevron-up" : "chevron-down"} size={20} color="#E7A748" />
                </View>
                {insightsExpanded && (
                  <View style={styles.insightsBody}>
                    {aiResponse ? (
                      <Text style={styles.insightsText}>{aiResponse}</Text>
                    ) : (
                      <Text style={styles.insightsTextMuted}>No AI response provided.</Text>
                    )}
                    {!!recommendations?.length && (
                      <View style={styles.recommendationsContainer}>
                        {recommendations.map((item, idx) => (
                          <View key={item?.id ?? idx} style={styles.recommendationCard}>
                            <View style={styles.recommendationHeader}>
                              <Text style={styles.recommendationName} numberOfLines={2}>
                                {item?.name || item?.title || "Recommended Item"}
                              </Text>
                              {!!item?.discount && (
                                <View style={styles.badgeDiscount}>
                                  <Text style={styles.badgeDiscountText}>{`${item.discount}% OFF`}</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.recommendationMeta}>
                              {item?.store?.name || item?.storeName || item?.storeId ? `Store: ${item?.store?.name || item?.storeName || item?.storeId}` : ""}
                            </Text>
                            {typeof item?.price !== "undefined" && (
                              <Text style={styles.recommendationPrice}>{`₱ ${Number(item.price).toFixed(2)}`}</Text>
                            )}
                            <TouchableOpacity style={styles.detailsBtn} accessibilityRole="button">
                              <Text style={styles.detailsBtnText}>Details</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>

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
            <View style={styles.tabsRow}>
              <TouchableOpacity onPress={() => setActiveTab("best")} style={[styles.tabBtn, activeTab === "best" && styles.tabBtnActive]} accessibilityRole="button">
                <Text style={[styles.tabText, activeTab === "best" && styles.tabTextActive]}>Best Match</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab("cheapest")} style={[styles.tabBtn, activeTab === "cheapest" && styles.tabBtnActive]} accessibilityRole="button">
                <Text style={[styles.tabText, activeTab === "cheapest" && styles.tabTextActive]}>Cheapest</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab("closest")} style={[styles.tabBtn, activeTab === "closest" && styles.tabBtnActive]} accessibilityRole="button">
                <Text style={[styles.tabText, activeTab === "closest" && styles.tabTextActive]}>Closest</Text>
              </TouchableOpacity>
            </View>
            {!!displayedRecommendations?.length && !loading && (
              <Text style={styles.resultsCount}>{displayedRecommendations.length} results found</Text>
            )}
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
            ) : (
              <View style={styles.resultsList}>
                {displayedRecommendations.map((item, idx) => (
                  <View key={item?.id ?? idx} style={styles.resultCard}>
                    <View style={styles.resultHeaderRow}>
                      <View style={[styles.badge, activeTab === "best" ? styles.badgeGreen : activeTab === "cheapest" ? styles.badgeYellow : styles.badgeTeal]}>
                        <Text style={styles.badgeText}>{activeTab === "best" ? "Best Deal" : activeTab === "cheapest" ? "Cheapest" : "Closest"}</Text>
                      </View>
                      {!!item?.discount && (
                        <View style={styles.badgeOff}><Text style={styles.badgeOffText}>{`${item.discount}% OFF`}</Text></View>
                      )}
                    </View>
                    <View style={styles.cardBodyRow}>
                      <View style={styles.placeholderImage} />
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle} numberOfLines={2}>{item?.name || item?.title || "Product"}</Text>
                        <Text style={styles.cardMeta}>{item?.store?.name || item?.storeName || "Store"}</Text>
                        <Text style={styles.cardMeta}>• {typeof item?.distance !== "undefined" ? `${item.distance} km` : "1.3 km"}</Text>
                        {typeof item?.price !== "undefined" && (
                          <Text style={styles.cardPrice}>{`₱ ${Number(item.price).toFixed(2)}`}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.detailsBtn}
                        accessibilityRole="button"
                        onPress={() => router.push({ pathname: "/(consumers)/product", params: { name: item?.name || item?.title, storeId: item?.storeId || item?.store?.id, price: item?.price, description: item?.description, productId: item?.id } })}
                      >
                        <Text style={styles.detailsBtnText}>Details</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
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
  },
  searchContainer: {
    marginBottom: 20,
  },
  insightHeadline: {
    flex: 1,
    fontSize: 14,
    color: "#2F2F2F",
    marginHorizontal: 10,
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
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  searchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  searchInput: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    flex: 1,
    paddingVertical: 8,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLines: {
    flexDirection: "column",
    gap: 4,
  },
  progressLine1: {
    width: 150,
    height: 6,
    backgroundColor: "#FFBE5D",
    borderRadius: 2,
  },
  progressLine2: {
    width: 80,
    height: 6,
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
  },
  micButton: {
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
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
  insightsText: {
    color: "#6b3f14",
    marginBottom: 10,
    lineHeight: 20,
  },
  insightsTextMuted: {
    color: "#9a6c3a",
    marginBottom: 10,
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
});
