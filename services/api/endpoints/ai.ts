/**
 * AI API endpoints
 * 
 * Aligned with server.json OpenAPI specification:
 * - POST /ai/chat (operationId: AiController_chat)
 * 
 * Unified chatbot endpoint that intelligently handles all AI interactions:
 * - General Conversation
 * - Product Recommendations
 * - Store Recommendations
 * - Promotion Recommendations
 * - Similar Products
 */

import { getApiClient } from "../client";
import type {
  ChatRequestDto,
  ChatResponseDto,
} from "../types/swagger";

// Re-export Swagger types for convenience
export type {
  ChatRequestDto,
  ChatResponseDto,
};

export const aiApi = {
  /**
   * Unified AI chatbot endpoint
   * Automatically detects intent and handles:
   * - General conversation
   * - Product recommendations (from verified stores only)
   * - Store recommendations (verified stores only)
   * - Promotion recommendations (from verified stores only)
   * - Similar products (from verified stores only)
   * 
   * Results are sorted by combined relevance (70%) and distance (30%) when location is provided.
   * 
   * Operation: AiController_chat
   * Endpoint: POST /ai/chat
   */
  chat: (data: ChatRequestDto): Promise<ChatResponseDto> => {
    return getApiClient().post<ChatResponseDto>("/ai/chat", data);
  },
};

