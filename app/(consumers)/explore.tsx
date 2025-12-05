import env from "@/config/env";
import { useStore } from "@/features/store";
import { useAppSelector } from "@/store/hooks";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";

import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const DEFAULT_DISTANCE_KM = 1.3;

// Component to format AI response with highlights and styled statements
const FormattedInsightText = ({ 
  text, 
  highlight, 
  elaboration 
}: { 
  text: string | null; 
  highlight?: string | null; 
  elaboration?: string | null; 
}) => {
  // Build the full content including highlight and elaboration, avoiding duplicates
  const contentParts: { type: 'highlight' | 'elaboration' | 'text'; content: string }[] = [];
  const seen = new Set<string>();
  const norm = (val?: string | null) => (val || "").trim();
  
  if (highlight && !seen.has(norm(highlight))) {
    seen.add(norm(highlight));
    contentParts.push({ type: 'highlight', content: highlight });
  }
  
  if (elaboration && !seen.has(norm(elaboration))) {
    seen.add(norm(elaboration));
    contentParts.push({ type: 'elaboration', content: elaboration });
  }
  
  if (text && !seen.has(norm(text))) {
    seen.add(norm(text));
    contentParts.push({ type: 'text', content: text });
  }
  
  if (contentParts.length === 0) return null;

  return (
    <View>
      {contentParts.map((part, partIdx) => {
        if (part.type === 'highlight') {
          // Render highlight with special styling
          return (
            <View key={`highlight-${partIdx}`} style={styles.highlightContainer}>
              <View style={styles.highlightIconContainer}>
                <Ionicons name="star" size={16} color="#F59E0B" />
              </View>
              <View style={styles.highlightContent}>
                <Text style={styles.highlightLabel}>Key Highlight</Text>
                <FormattedText text={part.content} styleType="highlight" />
              </View>
            </View>
          );
        }
        
        if (part.type === 'elaboration') {
          // Render elaboration with special styling
          return (
            <View key={`elaboration-${partIdx}`} style={styles.elaborationContainer}>
              <View style={styles.elaborationIconContainer}>
                <Ionicons name="information-circle" size={16} color="#277874" />
              </View>
              <View style={styles.elaborationContent}>
                <Text style={styles.elaborationLabel}>More Details</Text>
                <FormattedText text={part.content} styleType="elaboration" />
              </View>
            </View>
          );
        }
        
        // Regular text content
        return (
          <View key={`text-${partIdx}`} style={partIdx > 0 ? styles.insightParagraph : null}>
            <FormattedText text={part.content} styleType="text" />
          </View>
        );
      })}
    </View>
  );
};

// Helper component to format text with highlights
const FormattedText = ({ text, styleType }: { text: string; styleType: 'highlight' | 'elaboration' | 'text' }) => {
  // Split text into paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  
  // Get base text style based on type
  const getBaseTextStyle = () => {
    if (styleType === 'highlight') return styles.highlightText;
    if (styleType === 'elaboration') return styles.elaborationText;
    return styles.insightsText;
  };
  
  const getBoldTextStyle = () => {
    if (styleType === 'highlight') return styles.highlightTextBold;
    if (styleType === 'elaboration') return styles.elaborationTextBold;
    return styles.insightsTextBold;
  };
  
  const getHighlightStyle = () => {
    if (styleType === 'highlight') return styles.highlightTextHighlight;
    if (styleType === 'elaboration') return styles.elaborationTextHighlight;
    return styles.insightsTextHighlight;
  };
  
  return (
    <View>
      {paragraphs.map((paragraph, idx) => {
        const trimmed = paragraph.trim();
        if (!trimmed) return null;

        // Check if it's a heading (starts with number, bullet, or is short and bold-like)
        const isHeading = /^(\d+\.|[-•*]|\*\*)/.test(trimmed) || 
                         (trimmed.length < 60 && trimmed.endsWith(':'));
        
        // Check for key phrases to highlight
        const highlightPatterns = [
          /\*\*(.*?)\*\*/g, // Bold markdown
          /(best|top|recommended|excellent|great|perfect|ideal|affordable|budget|premium|quality)/gi,
          /(₱\d+|\$\d+|\d+%|\d+ pesos)/g, // Prices
          /(\d+\s*(km|kilometers?|meters?|miles?))/gi, // Distances
        ];

        // Process text with highlights and formatting
        const processText = (text: string) => {
          const parts: { text: string; style: any }[] = [];
          
          // First, handle markdown bold (**text**)
          let processed = text;
          const boldRegex = /\*\*(.*?)\*\*/g;
          const boldMatches = Array.from(processed.matchAll(boldRegex));
          
          if (boldMatches.length > 0) {
            let lastIndex = 0;
            boldMatches.forEach((match) => {
              if (match.index !== undefined) {
                // Add text before bold
                if (match.index > lastIndex) {
                  const beforeText = processed.substring(lastIndex, match.index);
                  if (beforeText) {
                    parts.push({ text: beforeText, style: getBaseTextStyle() });
                  }
                }
                // Add bold text
                parts.push({ text: match[1], style: getBoldTextStyle() });
                lastIndex = match.index + match[0].length;
              }
            });
            // Add remaining text after last bold
            if (lastIndex < processed.length) {
              const remaining = processed.substring(lastIndex);
              if (remaining) {
                parts.push({ text: remaining, style: getBaseTextStyle() });
              }
            }
          } else {
            // No markdown bold, process normally with highlights
            parts.push({ text: processed, style: getBaseTextStyle() });
          }
          
          // Now process highlights on each part (except already bold parts)
          const finalParts: { text: string; style: any }[] = [];
          const boldStyle = getBoldTextStyle();
          
          parts.forEach((part) => {
            if (part.style === boldStyle) {
              // Keep bold parts as-is
              finalParts.push(part);
            } else {
              // Apply highlights to regular text
              const text = part.text;
              const highlights: { start: number; end: number }[] = [];
              
              // Find all highlight matches
              highlightPatterns.slice(1).forEach((pattern) => {
                const matches = Array.from(text.matchAll(pattern));
                matches.forEach((match) => {
                  if (match.index !== undefined) {
                    highlights.push({
                      start: match.index,
                      end: match.index + match[0].length,
                    });
                  }
                });
              });
              
              // Sort and merge overlapping highlights
              highlights.sort((a, b) => a.start - b.start);
              const merged: { start: number; end: number }[] = [];
              highlights.forEach((hl) => {
                const last = merged[merged.length - 1];
                if (last && hl.start <= last.end) {
                  last.end = Math.max(last.end, hl.end);
                } else {
                  merged.push({ ...hl });
                }
              });
              
              // Build final parts with highlights
              let currentIndex = 0;
              merged.forEach((hl) => {
                if (hl.start > currentIndex) {
                  finalParts.push({
                    text: text.substring(currentIndex, hl.start),
                    style: getBaseTextStyle(),
                  });
                }
                finalParts.push({
                  text: text.substring(hl.start, hl.end),
                  style: getHighlightStyle(),
                });
                currentIndex = hl.end;
              });
              
              if (currentIndex < text.length) {
                finalParts.push({
                  text: text.substring(currentIndex),
                  style: getBaseTextStyle(),
                });
              }
              
              if (merged.length === 0) {
                finalParts.push(part);
              }
            }
          });
          
          return finalParts.length > 0 ? finalParts : [{ text, style: getBaseTextStyle() }];
        };

        const textParts = processText(trimmed);

        return (
          <View key={idx} style={idx > 0 ? styles.insightParagraph : null}>
            {isHeading ? (
              <Text style={styles.insightsHeading}>
                {trimmed.replace(/^\d+\.|[-•*]|\*\*/g, '').trim()}
              </Text>
            ) : (
              <Text style={styleType === 'highlight' ? styles.highlightTextContainer : styleType === 'elaboration' ? styles.elaborationTextContainer : styles.insightsTextContainer}>
                {textParts.map((part, partIdx) => (
                  <Text key={partIdx} style={part.style}>
                    {part.text}
                  </Text>
                ))}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [insightsExpanded, setInsightsExpanded] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [insightsSummary, setInsightsSummary] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [elaboration, setElaboration] = useState<string | null>(null);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const [isEditingPrompt, setIsEditingPrompt] = useState(true);
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"best" | "cheapest" | "closest">("best");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [queryHistory, setQueryHistory] = useState<{
    id: number;
    query: string;
    response: string;
    timestamp: Date;
    resultsCount: number;
  }[]>([]);
  const [isScrollingInsight, setIsScrollingInsight] = useState(false);
  const router = useRouter();
  const {
    state: { nearbyStores },
  } = useStore();

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
    setHighlight(null);
    setElaboration(null);
    setInsightsExpanded(false);
    try {
      setLastSubmittedQuery(query);
      // Call AI recommendations endpoint - following routes.json FreeformRecommendationDto schema
      // query (required), count (optional, 1-50)
      const requestBody: { query: string; count?: number } = { 
        query,
        count: 10 // Default to 10 if not specified, within valid range 1-50
      };
      
      const recRes = await fetch(`${env.API_BASE_URL}/ai/recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      // Handle 201 status code as per routes.json
      if (!recRes.ok) {
        throw new Error(`API returned status ${recRes.status}`);
      }

      // Parse body as JSON if possible, else as text
      const rawText = await recRes.text();
      let recJson: any = {};
      try {
        recJson = rawText ? JSON.parse(rawText) : {};
      } catch {
        recJson = { content: rawText };
      }

      // Handle response body structure - extract products/recommendations and text content
      // Response may contain: products array, recommendations array, items array, or content/message fields
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
        recJson?.recommendation ||
        recJson?.recommendationText ||
        recJson?.insight ||
        recJson?.summary ||
        recJson?.message ||
        recJson?.content ||
        null;
      
      // Extract highlight and elaboration fields
      const highlightText = recJson?.highlight || null;
      const elaborationText = recJson?.elaboration || null;
      
      // Extract product recommendations array from response
      const items = recJson?.products || recJson?.recommendations || recJson?.items || [];
      const hasProducts = Array.isArray(items) && items.length > 0;
      
      // Check if response indicates no products found
      const responseText = insightText || highlightText || "";
      const noProductsFound = 
        !hasProducts || 
        /(cannot find|no products|not found|unable to find|no results|no matches|sorry.*find|unfortunately.*find)/i.test(responseText);
      
      if (insightText && !/^unauthorized$/i.test(String(insightText).trim())) {
        setAiResponse(insightText);
        if (noProductsFound) {
          setInsightsSummary("I cannot find the product you looking for");
        } else {
          const product = extractPrimaryProduct(insightText);
          if (product) {
            setInsightsSummary(`I found the best deals for ${product}`);
          } else if (hasProducts) {
            setInsightsSummary(`I found the best deals for ${query}`);
          }
        }
      } else if (noProductsFound) {
        setInsightsSummary("I cannot find the product you looking for");
      }
      
      // Set highlight and elaboration if present
      if (highlightText) {
        setHighlight(highlightText);
      }
      if (elaborationText) {
        setElaboration(elaborationText);
      }
      
      if (hasProducts) {
        const normalized = items.map((item: any) => enrichDistance(item));
        setRecommendations(normalized);
      } else {
        setRecommendations([]);
      }
      
      // Add to query history
      const historyEntry = {
        id: Date.now(),
        query: query,
        response: insightText || "No response received",
        timestamp: new Date(),
        resultsCount: Array.isArray(items) ? items.length : 0
      };
      setQueryHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
      
      setInsightsExpanded(false);
      setIsEditingPrompt(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setAiResponse(`Sorry, I couldn't fetch recommendations right now. ${errorMessage}`);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, loading, accessToken, extractPrimaryProduct, enrichDistance]);

  return (
    <>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isScrollingInsight}
      >
        <View style={styles.content}>
          {/* Show prompt/insights panel at TOP only when results are displayed */}
          {hasResults && (
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
                  <View style={styles.insightHeadlineContainer}>
                    <Text style={styles.insightHeadline}>
                      {insightsSummary || 
                       (lastSubmittedQuery && recommendations.length > 0 
                         ? `I found the best deals for ${lastSubmittedQuery}`
                         : lastSubmittedQuery && recommendations.length === 0
                         ? "I cannot find the product you looking for"
                         : null) ||
                       aiResponse || 
                       "I found the best deals near you"}
                    </Text>
                  </View>
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
                    <ScrollView 
                      style={styles.insightsScrollView}
                      contentContainerStyle={styles.insightsScrollContent}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                      bounces={true}
                      scrollEnabled={true}
                      onTouchStart={() => setIsScrollingInsight(true)}
                      onTouchEnd={() => setIsScrollingInsight(false)}
                      onScrollBeginDrag={() => setIsScrollingInsight(true)}
                      onScrollEndDrag={() => setIsScrollingInsight(false)}
                      onMomentumScrollEnd={() => setIsScrollingInsight(false)}
                    >
                      {(highlight || elaboration) ? (
                        <FormattedInsightText 
                          text={null}
                          highlight={highlight}
                          elaboration={elaboration}
                        />
                      ) : (
                        <Text style={styles.insightsTextMuted}>Sorry, we couldn’t find the product you’re looking for.</Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            </TouchableOpacity>
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
            ) : displayedRecommendations?.length > 0 ? (
              <View style={styles.resultsList}>
                {displayedRecommendations.map((item, idx) => {
                  const distanceValue =
                    typeof item?.distance === "number"
                      ? item.distance
                      : extractDistanceFromItem(item);
                  const displayDistance =
                    distanceValue != null && Number.isFinite(distanceValue)
                      ? distanceValue
                      : DEFAULT_DISTANCE_KM;
                  const formattedDistance = `${displayDistance.toFixed(2)} km`;
                  return (
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
                      {item?.imageUrl ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.resultImage}
                        />
                      ) : (
                        <View style={styles.placeholderImage} />
                      )}
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle} numberOfLines={2}>{item?.name || item?.title || "Product"}</Text>
                        <Text style={styles.cardMeta}>{item?.store?.name || item?.storeName || "Store"}</Text>
                        <Text style={styles.cardMeta}>• {formattedDistance}</Text>
                        {typeof item?.price !== "undefined" && (
                          <Text style={styles.cardPrice}>{`₱ ${Number(item.price).toFixed(2)}`}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.detailsBtn}
                        accessibilityRole="button"
                        onPress={() => router.push({ pathname: "/(consumers)/product", params: { name: item?.name || item?.title, storeId: item?.storeId || item?.store?.id, price: item?.price, description: item?.description, productId: item?.id, imageUrl: item?.imageUrl || "" } })}
                      >
                        <Text style={styles.detailsBtnText}>Details</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )})}
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
                    <View style={styles.insightHeadlineContainer}>
                      <Text style={styles.insightHeadline}>
                        {insightsSummary || 
                         (lastSubmittedQuery && recommendations.length > 0 
                           ? `I found the best deals for ${lastSubmittedQuery}`
                           : lastSubmittedQuery && recommendations.length === 0
                           ? "I cannot find the product you looking for"
                           : null) ||
                         aiResponse || 
                         "I found the best deals near you"}
                      </Text>
                    </View>
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
                      <ScrollView 
                        style={styles.insightsScrollView}
                        contentContainerStyle={styles.insightsScrollContent}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                        bounces={true}
                        scrollEnabled={true}
                        onTouchStart={() => setIsScrollingInsight(true)}
                        onTouchEnd={() => setIsScrollingInsight(false)}
                        onScrollBeginDrag={() => setIsScrollingInsight(true)}
                        onScrollEndDrag={() => setIsScrollingInsight(false)}
                        onMomentumScrollEnd={() => setIsScrollingInsight(false)}
                      >
                        {(aiResponse || highlight || elaboration) ? (
                          <FormattedInsightText 
                            text={aiResponse} 
                            highlight={highlight}
                            elaboration={elaboration}
                          />
                        ) : (
                          <Text style={styles.insightsTextMuted}>Sorry, we couldn’t find the product you’re looking for.</Text>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Query History Modal */}
      <Modal
        visible={showHistoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Query History</Text>
              <TouchableOpacity
                onPress={() => setShowHistoryModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.historyList}>
              {queryHistory.length > 0 ? (
                queryHistory.map((entry) => (
                  <View key={entry.id} style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyQuery} numberOfLines={2}>
                        {entry.query}
                      </Text>
                      <Text style={styles.historyTimestamp}>
                        {entry.timestamp.toLocaleDateString()} {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.historyResponse} numberOfLines={3}>
                      {entry.response}
                    </Text>
                    <View style={styles.historyFooter}>
                      <View style={styles.resultsBadge}>
                        <Ionicons name="list-outline" size={14} color="#277874" />
                        <Text style={styles.resultsText}>{entry.resultsCount} results</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.reuseButton}
                        onPress={() => {
                          setSearchQuery(entry.query);
                          setShowHistoryModal(false);
                        }}
                      >
                        <Ionicons name="refresh-outline" size={16} color="#277874" />
                        <Text style={styles.reuseButtonText}>Reuse</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyHistoryState}>
                  <Ionicons name="time-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyHistoryText}>No queries yet</Text>
                  <Text style={styles.emptyHistorySubtext}>
                    Your AI recommendation queries will appear here
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
    
    {/* History Button - positioned outside the prompt panel */}
    <TouchableOpacity 
      style={styles.historyButton} 
      onPress={() => setShowHistoryModal(true)} 
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
