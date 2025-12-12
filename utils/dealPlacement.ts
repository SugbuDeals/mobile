/**
 * Deal Placement Logic
 * 
 * Controls where different deal types should be displayed in the app.
 * This ensures users see deals in the right context:
 * - Vouchers: Only in store details (store-specific)
 * - BOGO, Bundle: Prominently in home and store details
 * - Other deals: Everywhere appropriate
 */

import type { DealType, PromotionResponseDto } from "@/services/api/types/swagger";

export type DealPlacement = "home" | "store" | "product" | "checkout" | "explore";

/**
 * Define where each deal type should be displayed
 */
export const DEAL_PLACEMENT_RULES: Record<DealType, DealPlacement[]> = {
  // Percentage discounts - show everywhere
  PERCENTAGE_DISCOUNT: ["home", "store", "product", "explore"],
  
  // Fixed discounts - show everywhere
  FIXED_DISCOUNT: ["home", "store", "product", "explore"],
  
  // BOGO - show everywhere except checkout (needs product context)
  BOGO: ["home", "store", "product", "explore"],
  
  // Bundle deals - show everywhere except checkout (needs multiple products)
  BUNDLE: ["home", "store", "product", "explore"],
  
  // Quantity discounts - show everywhere
  QUANTITY_DISCOUNT: ["home", "store", "product", "explore"],
  
  // Vouchers - ONLY show in store details and checkout
  // Vouchers are store-specific and not tied to individual products
  VOUCHER: ["store", "checkout"],
};

/**
 * Check if a deal should be displayed in a specific location
 */
export function shouldShowDealAt(
  dealType: DealType,
  location: DealPlacement
): boolean {
  const allowedPlacements = DEAL_PLACEMENT_RULES[dealType];
  return allowedPlacements.includes(location);
}

/**
 * Filter promotions based on placement location
 */
export function filterPromotionsByPlacement(
  promotions: PromotionResponseDto[],
  location: DealPlacement
): PromotionResponseDto[] {
  return promotions.filter((promo) =>
    shouldShowDealAt(promo.dealType, location)
  );
}

/**
 * Get vouchers only (for store details voucher section)
 */
export function getVouchersOnly(
  promotions: PromotionResponseDto[]
): PromotionResponseDto[] {
  return promotions.filter((promo) => promo.dealType === "VOUCHER");
}

/**
 * Get non-voucher deals (for general promotions sections)
 */
export function getNonVoucherDeals(
  promotions: PromotionResponseDto[]
): PromotionResponseDto[] {
  return promotions.filter((promo) => promo.dealType !== "VOUCHER");
}

/**
 * Get deal priority for sorting
 * Higher number = higher priority (shown first)
 */
export function getDealPriority(dealType: DealType): number {
  const priorities: Record<DealType, number> = {
    BOGO: 6, // Highest priority - most exciting
    BUNDLE: 5,
    PERCENTAGE_DISCOUNT: 4,
    QUANTITY_DISCOUNT: 3,
    FIXED_DISCOUNT: 2,
    VOUCHER: 1, // Lower priority in mixed lists
  };
  return priorities[dealType] || 0;
}

/**
 * Sort promotions by priority
 */
export function sortPromotionsByPriority(
  promotions: PromotionResponseDto[]
): PromotionResponseDto[] {
  return [...promotions].sort((a, b) => {
    const priorityA = getDealPriority(a.dealType);
    const priorityB = getDealPriority(b.dealType);
    return priorityB - priorityA;
  });
}

/**
 * Get display context for a deal type
 * Returns helpful info about where and how the deal should be shown
 */
export function getDealDisplayContext(dealType: DealType): {
  placements: DealPlacement[];
  requiresStore: boolean;
  requiresProduct: boolean;
  priority: number;
} {
  return {
    placements: DEAL_PLACEMENT_RULES[dealType],
    requiresStore: dealType === "VOUCHER",
    requiresProduct: ["BOGO", "BUNDLE", "QUANTITY_DISCOUNT"].includes(dealType),
    priority: getDealPriority(dealType),
  };
}


