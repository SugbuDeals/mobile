/**
 * Promotion domain types
 */

export type Promotion = {
  id: number;
  title: string;
  type: "percentage" | "fixed";
  description: string;
  startsAt?: Date | string;
  endsAt?: Date | string;
  active: boolean;
  discount: number;
  productId: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
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

