/**
 * Review API endpoints
 * 
 * Aligned with OpenAPI specification:
 * - POST /review (operationId: ReviewController_createReview)
 * - GET /review/{id} (operationId: ReviewController_getReview)
 * - PATCH /review/{id} (operationId: ReviewController_updateReview)
 * - DELETE /review/{id} (operationId: ReviewController_deleteReview)
 * - GET /review/store/{storeId} (operationId: ReviewController_getStoreReviews)
 * - POST /review/reply (operationId: ReviewController_createReply)
 * - GET /review/reply/{reviewId} (operationId: ReviewController_getReplies)
 * - PATCH /review/reply/{id} (operationId: ReviewController_updateReply) - Not in official spec but implemented
 * - DELETE /review/reply/{id} (operationId: ReviewController_deleteReply) - Not in official spec but implemented
 * - POST /review/like (operationId: ReviewController_likeReview)
 * - POST /review/dislike (operationId: ReviewController_dislikeReview)
 * - GET /review/stats/{storeId} (operationId: ReviewController_getStoreRatingStats)
 */

import { getApiClient } from "../client";
import type {
    CreateReplyDto,
    CreateReviewDto,
    ReactionDto,
    ReactionResponseDto,
    ReplyResponseDto,
    ReviewResponseDto,
    StoreRatingStatsDto,
    UpdateReplyDto,
    UpdateReviewDto,
} from "../types/swagger";

// Re-export Swagger types for convenience
export type {
    CreateReplyDto, CreateReviewDto, ReactionDto,
    ReactionResponseDto, ReplyResponseDto, ReviewResponseDto, StoreRatingStatsDto, UpdateReplyDto, UpdateReviewDto
};

export interface GetStoreReviewsParams {
  skip?: number; // Number of records to skip for pagination
  take?: number; // Number of records to return
  [key: string]: string | number | boolean | undefined;
}

export const reviewsApi = {
  /**
   * Creates a new review (comment) for a store
   * Consumers can comment about the store, and optionally include a rating (1-5 stars)
   * Each user can only have one review per store
   * Operation: ReviewController_createReview
   * Endpoint: POST /review
   */
  createReview: (data: CreateReviewDto): Promise<ReviewResponseDto> => {
    return getApiClient().post<ReviewResponseDto>("/review", data);
  },

  /**
   * Retrieves a single review by ID
   * If authenticated, includes user reaction data
   * Operation: ReviewController_getReview
   * Endpoint: GET /review/{id}
   */
  getReview: (reviewId: number): Promise<ReviewResponseDto> => {
    return getApiClient().get<ReviewResponseDto>(`/review/${reviewId}`);
  },

  /**
   * Updates an existing review (comment and/or rating)
   * Users can only update their own reviews
   * Operation: ReviewController_updateReview
   * Endpoint: PATCH /review/{id}
   */
  updateReview: (
    reviewId: number,
    data: UpdateReviewDto
  ): Promise<ReviewResponseDto> => {
    return getApiClient().patch<ReviewResponseDto>(`/review/${reviewId}`, data);
  },

  /**
   * Deletes an existing review
   * Users can only delete their own reviews
   * Operation: ReviewController_deleteReview
   * Endpoint: DELETE /review/{id}
   */
  deleteReview: (reviewId: number): Promise<void> => {
    return getApiClient().delete<void>(`/review/${reviewId}`);
  },

  /**
   * Retrieves all reviews for a specific store with pagination
   * If authenticated, includes user reaction data
   * Operation: ReviewController_getStoreReviews
   * Endpoint: GET /review/store/{storeId}
   */
  getStoreReviews: (
    storeId: number,
    params?: GetStoreReviewsParams
  ): Promise<ReviewResponseDto[]> => {
    return getApiClient().get<ReviewResponseDto[]>(
      `/review/store/${storeId}`,
      params
    );
  },

  /**
   * Creates a reply to an existing review or another reply
   * If parentReplyId is provided, this will be a nested reply
   * All authenticated users (consumers, retailers, admins) can reply to reviews and replies
   * Operation: ReviewController_createReply
   * Endpoint: POST /review/reply
   */
  createReply: (data: CreateReplyDto): Promise<ReplyResponseDto> => {
    return getApiClient().post<ReplyResponseDto>("/review/reply", data);
  },

  /**
   * Retrieves all top-level replies for a specific review, including nested replies (replies to replies)
   * Operation: ReviewController_getReplies
   * Endpoint: GET /review/reply/{reviewId}
   */
  getReplies: (reviewId: number): Promise<ReplyResponseDto[]> => {
    return getApiClient().get<ReplyResponseDto[]>(`/review/reply/${reviewId}`);
  },

  /**
   * Updates an existing reply
   * Users can only update their own replies
   * Operation: ReviewController_updateReply
   * Endpoint: PATCH /review/reply/{id}
   */
  updateReply: (
    replyId: number,
    data: UpdateReplyDto
  ): Promise<ReplyResponseDto> => {
    return getApiClient().patch<ReplyResponseDto>(`/review/reply/${replyId}`, data);
  },

  /**
   * Deletes an existing reply
   * Users can only delete their own replies
   * Operation: ReviewController_deleteReply
   * Endpoint: DELETE /review/reply/{id}
   */
  deleteReply: (replyId: number): Promise<void> => {
    return getApiClient().delete<void>(`/review/reply/${replyId}`);
  },

  /**
   * Likes a review
   * If already liked, removes the like. If disliked, changes to like.
   * Operation: ReviewController_likeReview
   * Endpoint: POST /review/like
   */
  likeReview: (data: ReactionDto): Promise<ReactionResponseDto> => {
    return getApiClient().post<ReactionResponseDto>("/review/like", data);
  },

  /**
   * Dislikes a review
   * If already disliked, removes the dislike. If liked, changes to dislike.
   * Operation: ReviewController_dislikeReview
   * Endpoint: POST /review/dislike
   */
  dislikeReview: (data: ReactionDto): Promise<ReactionResponseDto> => {
    return getApiClient().post<ReactionResponseDto>("/review/dislike", data);
  },

  /**
   * Retrieves rating statistics for a store
   * Includes average rating, total count, and breakdown by star rating
   * Returns null if there are no reviews for the store
   * Operation: ReviewController_getStoreRatingStats
   * Endpoint: GET /review/stats/{storeId}
   */
  getStoreRatingStats: (storeId: number): Promise<StoreRatingStatsDto | null> => {
    return getApiClient().get<StoreRatingStatsDto | null>(
      `/review/stats/${storeId}`,
      undefined,
      { skipAuth: true } // Public endpoint
    );
  },
};
