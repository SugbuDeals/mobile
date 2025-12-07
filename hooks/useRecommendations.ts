import { useState, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import env from "@/config/env";
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
  recommendations: RecommendationItem[];
  highlight: string | null;
  elaboration: string | null;
}

export function useRecommendations() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<RecommendationResponse>({
    aiResponse: null,
    insightsSummary: null,
    recommendations: [],
    highlight: null,
    elaboration: null,
  });
  const accessToken = useAppSelector((s) => s.auth.accessToken);

  const fetchRecommendations = useCallback(
    async (query: string, enrichDistance?: (item: any) => any) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery || loading) return;

      setLoading(true);
      setResponse({
        aiResponse: null,
        insightsSummary: null,
        recommendations: [],
        highlight: null,
        elaboration: null,
      });

      try {
        const requestBody: { query: string; count?: number } = {
          query: trimmedQuery,
          count: 10,
        };

        const recRes = await fetch(`${env.API_BASE_URL}/ai/recommendations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(requestBody),
        });

        if (!recRes.ok) {
          throw new Error(`API returned status ${recRes.status}`);
        }

        const rawText = await recRes.text();
        let recJson: any = {};
        try {
          recJson = rawText ? JSON.parse(rawText) : {};
        } catch {
          recJson = { content: rawText };
        }

        const directAssistantText =
          typeof recJson?.content === "string" && recJson?.role === "assistant"
            ? recJson.content
            : null;
        const fromMessages = Array.isArray(recJson?.messages)
          ? recJson.messages.find(
              (m: any) => m?.role === "assistant" && typeof m?.content === "string"
            )?.content
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

        const highlightText = recJson?.highlight || null;
        const elaborationText = recJson?.elaboration || null;

        const items =
          recJson?.products || recJson?.recommendations || recJson?.items || [];
        const hasProducts = Array.isArray(items) && items.length > 0;

        const responseText = insightText || highlightText || "";
        const noProductsFound =
          !hasProducts ||
          /(cannot find|no products|not found|unable to find|no results|no matches|sorry.*find|unfortunately.*find)/i.test(
            responseText
          );

        let insightsSummary: string | null = null;
        if (insightText && !/^unauthorized$/i.test(String(insightText).trim())) {
          if (noProductsFound) {
            insightsSummary = "I cannot find the product you looking for";
          } else {
            const product = extractPrimaryProduct(insightText);
            if (product) {
              insightsSummary = `I found the best deals for ${product}`;
            } else if (hasProducts) {
              insightsSummary = `I found the best deals for ${trimmedQuery}`;
            }
          }
        } else if (noProductsFound) {
          insightsSummary = "I cannot find the product you looking for";
        }

        const normalized = hasProducts
          ? items.map((item: any) =>
              enrichDistance ? enrichDistance(item) : item
            )
          : [];

        setResponse({
          aiResponse: insightText,
          insightsSummary,
          recommendations: normalized,
          highlight: highlightText,
          elaboration: elaborationText,
        });
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        setResponse({
          aiResponse: `Sorry, I couldn't fetch recommendations right now. ${errorMessage}`,
          insightsSummary: null,
          recommendations: [],
          highlight: null,
          elaboration: null,
        });
      } finally {
        setLoading(false);
      }
    },
    [loading, accessToken]
  );

  return {
    loading,
    response,
    fetchRecommendations,
  };
}

