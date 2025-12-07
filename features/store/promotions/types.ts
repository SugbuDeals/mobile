/**
 * Promotion domain types matching server.json PromotionResponseDto
 */
export type Promotion = {
  id: number;
  title: string;
  type: string; // Promotion type (e.g., "PERCENTAGE")
  description: string;
  startsAt: string; // ISO 8601 format date-time
  endsAt: string | null; // Nullable per server.json
  active: boolean;
  discount: number;
  productId: number | null; // Nullable per server.json
};

export type CreatePromotionDTO = {
  title: string;
  type: "percentage" | "fixed";
  description: string;
  startsAt: string;
  endsAt: string;
  discount: number;
  productId: number;
  active?: boolean;
};

export type UpdatePromotionDTO = {
  title?: string;
  type?: "percentage" | "fixed";
  description?: string;
  startsAt?: string;
  endsAt?: string;
  discount?: number;
  productId?: number;
  active?: boolean;
};

