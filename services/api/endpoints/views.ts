/**
 * Views API endpoints
 * 
 * Aligned with server.json OpenAPI specification:
 * - POST /views (operationId: ViewController_recordView)
 * - GET /views/list (operationId: ViewController_listMyViews)
 * - GET /views/{entityType}/{entityId}/count (operationId: ViewController_getEntityViewCount)
 * - GET /views/analytics/retailer (operationId: ViewController_getRetailerAnalytics)
 */

import { getApiClient } from "../client";
import type {
    EntityType,
    GetRetailerAnalyticsParams,
    RecordViewDto,
    RetailerAnalyticsResponseDto,
    ListViewsParams as SwaggerListViewsParams,
    ViewCountResponseDto,
    ViewResponseDto,
} from "../types/swagger";

// Re-export Swagger types for convenience
export type {
    EntityType, GetRetailerAnalyticsParams, RecordViewDto, RetailerAnalyticsResponseDto, ViewCountResponseDto, ViewResponseDto
};

// Extended ListViewsParams with index signature for API compatibility
export interface ListViewsParamsExtended extends SwaggerListViewsParams {
  [key: string]: string | number | EntityType | undefined;
}

export const viewsApi = {
  /**
   * Record that the authenticated user viewed an entity (store, product, or promotion)
   * If the user has already viewed this entity, updates the viewedAt timestamp
   * Otherwise, creates a new view record. This endpoint is idempotent and authenticated.
   * Operation: ViewController_recordView
   * Endpoint: POST /views
   * 
   * @param data - Entity type and ID to record as viewed
   */
  recordView: (data: RecordViewDto): Promise<ViewResponseDto> => {
    return getApiClient().post<ViewResponseDto>("/views", data);
  },

  /**
   * Retrieves all views for the authenticated user with optional filtering by entity type and pagination support
   * Results are ordered by most recent views first
   * Operation: ViewController_listMyViews
   * Endpoint: GET /views/list
   * 
   * @param params - Optional pagination and filtering parameters
   */
  listMyViews: (params?: ListViewsParamsExtended): Promise<ViewResponseDto[]> => {
    return getApiClient().get<ViewResponseDto[]>("/views/list", params as Record<string, unknown> | undefined);
  },

  /**
   * Returns the total number of unique users who have viewed a specific entity
   * PUBLIC ENDPOINT - No authentication required
   * The count represents unique users, not total views (same user viewing multiple times counts as 1)
   * Operation: ViewController_getEntityViewCount
   * Endpoint: GET /views/{entityType}/{entityId}/count
   * 
   * @param entityType - Type of entity to get view count for (STORE, PRODUCT, or PROMOTION)
   * @param entityId - Numeric ID of the entity to get view count for
   */
  getEntityViewCount: (
    entityType: EntityType,
    entityId: number
  ): Promise<ViewCountResponseDto> => {
    const client = getApiClient();
    return client.get<ViewCountResponseDto>(
      `/views/${entityType}/${entityId}/count`,
      undefined,
      { skipAuth: true }
    );
  },

  /**
   * Returns comprehensive view engagement analytics for stores and products owned by the authenticated retailer
   * Supports time period filtering (daily, weekly, monthly, custom) and optional entity type filtering
   * Only retailers and admins can access this endpoint
   * Operation: ViewController_getRetailerAnalytics
   * Endpoint: GET /views/analytics/retailer
   * 
   * @param params - Time period and optional filtering parameters
   */
  getRetailerAnalytics: (
    params: GetRetailerAnalyticsParams
  ): Promise<RetailerAnalyticsResponseDto> => {
    return getApiClient().get<RetailerAnalyticsResponseDto>(
      "/views/analytics/retailer",
      params as unknown as Record<string, unknown>
    );
  },
};
