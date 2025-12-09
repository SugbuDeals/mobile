import { useState, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import { aiApi } from "@/services/api/endpoints/ai";
import type { ChatRequestDto, ChatResponseDto } from "@/services/api/endpoints/ai";
import type {
  ProductRecommendationItemDto,
  StoreRecommendationItemDto,
  PromotionRecommendationItemDto,
} from "@/services/api/types/swagger";
import { extractPrimaryProduct } from "@/utils/textFormatting";

export interface RecommendationItem {
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

export interface RecommendationResponse {
  aiResponse: string | null;
  insightsSummary: string | null;
  recommendations: RecommendationItem[]; // For backward compatibility
  highlight: string | null;
  elaboration: string | null;
  // New structured fields
  intent?: "product" | "store" | "promotion" | "chat";
  products: ProductRecommendationItemDto[];
  stores: StoreRecommendationItemDto[];
  promotions: PromotionRecommendationItemDto[];
}

export function useRecommendations() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<RecommendationResponse>({
    aiResponse: null,
    insightsSummary: null,
    recommendations: [],
    highlight: null,
    elaboration: null,
    intent: undefined,
    products: [],
    stores: [],
    promotions: [],
  });
  const accessToken = useAppSelector((s) => s.auth.accessToken);

  const fetchRecommendations = useCallback(
    async (
      query: string,
      enrichDistance?: (item: RecommendationItem) => RecommendationItem,
      location?: { latitude: number; longitude: number },
      radius?: 5 | 10 | 15,
      count: number = 10
    ) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery || loading) return;

      setLoading(true);
      setResponse({
        aiResponse: null,
        insightsSummary: null,
        recommendations: [],
        highlight: null,
        elaboration: null,
        intent: undefined,
        products: [],
        stores: [],
        promotions: [],
      });

      try {
        // Build request body according to new API spec
        const requestBody: ChatRequestDto = {
          content: trimmedQuery,
          count: Math.max(1, Math.min(10, count)),
        };

        // Only include location if both latitude and longitude are available
        if (location?.latitude !== undefined && location?.longitude !== undefined) {
          requestBody.latitude = location.latitude;
          requestBody.longitude = location.longitude;
          if (radius) {
            requestBody.radius = radius;
          }
          console.log("[useRecommendations] Including location in request:", {
            latitude: location.latitude,
            longitude: location.longitude,
            radius,
          });
        } else {
          console.log("[useRecommendations] No location available - skipping location parameters");
        }

        console.log("[useRecommendations] Sending request to /ai/chat:", JSON.stringify(requestBody, null, 2));

        const chatResponse: ChatResponseDto = await aiApi.chat(requestBody);

        console.log("[useRecommendations] Received response:", {
          intent: chatResponse.intent,
          productsCount: chatResponse.products?.length || 0,
          storesCount: chatResponse.stores?.length || 0,
          promotionsCount: chatResponse.promotions?.length || 0,
          hasContent: !!chatResponse.content,
        });

        // Extract content from response
        const insightText = chatResponse.content || null;
        const intent = chatResponse.intent || undefined;

        // Extract recommendations from products, stores, or promotions arrays
        const products = chatResponse.products || [];
        const stores = chatResponse.stores || [];
        const promotions = chatResponse.promotions || [];

        // Map products to RecommendationItem format
        const productItems: RecommendationItem[] = products.map((product: ProductRecommendationItemDto) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl || undefined,
          storeId: product.storeId,
          storeName: product.storeName || undefined,
          description: product.description,
          distance: product.distance || undefined,
        }));

        // Map stores to RecommendationItem format (if needed)
        const storeItems: RecommendationItem[] = stores.map((store: StoreRecommendationItemDto) => ({
          id: store.id,
          name: store.name,
          description: store.description,
          imageUrl: store.imageUrl || undefined,
          distance: store.distance || undefined,
        }));

        // Map promotions to RecommendationItem format
        const promotionItems: RecommendationItem[] = promotions.map(
          (promo: PromotionRecommendationItemDto) => ({
            id: promo.id,
            title: promo.title,
            name: promo.title,
            discount: promo.discount,
            description: promo.description,
          })
        );

        // Combine all items, prioritizing products
        const allItems = [...productItems, ...promotionItems, ...storeItems];
        const hasItems = allItems.length > 0;

        const responseText = insightText || "";
        const noItemsFound =
          !hasItems ||
          /(cannot find|no products|not found|unable to find|no results|no matches|sorry.*find|unfortunately.*find)/i.test(
            responseText
          );

        let insightsSummary: string | null = null;
        if (insightText && !/^unauthorized$/i.test(String(insightText).trim())) {
          if (noItemsFound) {
            if (intent === "store") {
              insightsSummary = "I cannot find stores matching your search";
            } else if (intent === "promotion") {
              insightsSummary = "I cannot find promotions matching your search";
            } else if (intent === "chat") {
              insightsSummary = null; // Let the AI response speak for itself
            } else {
              insightsSummary = "I cannot find products matching your search";
            }
          } else {
            const product = extractPrimaryProduct(insightText);
            if (product) {
              insightsSummary = `I found the best deals for ${product}`;
            } else if (hasItems) {
              if (intent === "store") {
                insightsSummary = `I found ${stores.length} store${stores.length !== 1 ? "s" : ""} for you`;
              } else if (intent === "promotion") {
                insightsSummary = `I found ${promotions.length} promotion${promotions.length !== 1 ? "s" : ""} for you`;
              } else {
                insightsSummary = `I found the best deals for ${trimmedQuery}`;
              }
            }
          }
        } else if (noItemsFound && intent !== "chat") {
          if (intent === "store") {
            insightsSummary = "I cannot find stores matching your search";
          } else if (intent === "promotion") {
            insightsSummary = "I cannot find promotions matching your search";
          } else {
            insightsSummary = "I cannot find products matching your search";
          }
        }

        // Enrich items with distance if enrichDistance function provided
        const normalized = hasItems
          ? allItems.map((item: RecommendationItem) =>
              enrichDistance ? enrichDistance(item) : item
            )
          : [];

        setResponse({
          aiResponse: insightText,
          insightsSummary,
          recommendations: normalized, // For backward compatibility
          highlight: null, // Not in new API response
          elaboration: null, // Not in new API response
          intent,
          products,
          stores,
          promotions,
        });
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        setResponse({
          aiResponse: `Sorry, I couldn't fetch recommendations right now. ${errorMessage}`,
          insightsSummary: null,
          recommendations: [],
          highlight: null,
          elaboration: null,
          intent: undefined,
          products: [],
          stores: [],
          promotions: [],
        });
      } finally {
        setLoading(false);
      }
    },
    [loading, accessToken]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setResponse({
      aiResponse: null,
      insightsSummary: null,
      recommendations: [],
      highlight: null,
      elaboration: null,
      intent: undefined,
      products: [],
      stores: [],
      promotions: [],
    });
  }, []);

  return {
    loading,
    response,
    fetchRecommendations,
    reset,
  };
}

