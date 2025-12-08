/**
 * AI API endpoints
 * 
 * Aligned with server.json OpenAPI specification:
 * - POST /ai/chat (operationId: AiController_chat)
 * - POST /ai/recommendations (operationId: AiController_getRecommendations)
 * - POST /ai/similar-products (operationId: AiController_getSimilarProducts)
 */

import { getApiClient } from "../client";
import type {
  ChatRequestDto,
  ChatResponseDto,
  ChatMessageDto,
  FreeformRecommendationDto,
  RecommendationResponseDto,
  SimilarProductsDto,
  SimilarProductsResponseDto,
} from "../types/swagger";

// Re-export Swagger types for convenience
export type {
  ChatRequestDto,
  ChatResponseDto,
  ChatMessageDto,
  FreeformRecommendationDto,
  RecommendationResponseDto,
  SimilarProductsDto,
  SimilarProductsResponseDto,
};

// Alias for backward compatibility
export type ChatMessageRole = ChatMessageDto["role"];

export const aiApi = {
  /**
   * Chat with AI assistant
   * Supports multi-turn conversations with message history
   * Operation: AiController_chat
   * Endpoint: POST /ai/chat
   */
  chat: (data: ChatRequestDto): Promise<ChatResponseDto> => {
    return getApiClient().post<ChatResponseDto>("/ai/chat", data);
  },

  /**
   * Get AI-powered recommendations (unified agent endpoint)
   * Automatically detects intent: product, store, promotion, or chat
   * Operation: AiController_getRecommendations
   * Endpoint: POST /ai/recommendations
   */
  getRecommendations: (
    data: FreeformRecommendationDto
  ): Promise<RecommendationResponseDto> => {
    return getApiClient().post<RecommendationResponseDto>(
      "/ai/recommendations",
      data
    );
  },

  /**
   * Get similar products recommendations
   * Uses AI to find and recommend products similar to a given product
   * Operation: AiController_getSimilarProducts
   * Endpoint: POST /ai/similar-products
   */
  getSimilarProducts: (
    data: SimilarProductsDto
  ): Promise<SimilarProductsResponseDto> => {
    return getApiClient().post<SimilarProductsResponseDto>(
      "/ai/similar-products",
      data
    );
  },
};

