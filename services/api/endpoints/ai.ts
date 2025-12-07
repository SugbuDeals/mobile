/**
 * AI API endpoints
 */

import { getApiClient } from "../client";

export type ChatMessageRole = "user" | "assistant" | "system";

export interface ChatMessageDto {
  role: ChatMessageRole;
  content: string;
}

export interface ChatRequestDto {
  messages: ChatMessageDto[];
}

export interface ChatResponse {
  content: string;
  role: string;
}

export interface TextGenerationDto {
  prompt: string;
}

export interface TextGenerationResponse {
  content: string;
}

export interface FreeformRecommendationDto {
  query: string;
  count?: number;
  latitude?: number;
  longitude?: number;
}

export type RecommendationIntent = "product" | "store" | "promotion";

export interface RecommendationItem {
  id: number;
  name: string;
  description?: string;
}

export interface RecommendationResponse {
  recommendations: RecommendationItem[];
  intent: RecommendationIntent;
}

export const aiApi = {
  /**
   * Chat with AI assistant
   */
  chat: (data: ChatRequestDto): Promise<ChatResponse> => {
    return getApiClient().post<ChatResponse>("/ai/chat", data);
  },

  /**
   * Generate text using AI
   */
  generateText: (data: TextGenerationDto): Promise<TextGenerationResponse> => {
    return getApiClient().post<TextGenerationResponse>("/ai/generate", data);
  },

  /**
   * Get AI-powered recommendations
   */
  getRecommendations: (
    data: FreeformRecommendationDto
  ): Promise<RecommendationResponse> => {
    return getApiClient().post<RecommendationResponse>(
      "/ai/recommendations",
      data
    );
  },
};

