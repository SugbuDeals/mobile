/**
 * Deal Types Utility Functions
 * Helpers for working with promotion deal types
 */

import type { CreatePromotionDto, DealType, PromotionResponseDto } from "@/services/api/types/swagger";

export const DEAL_TYPES: { value: DealType; label: string; description: string }[] = [
  {
    value: "PERCENTAGE_DISCOUNT",
    label: "Percentage Discount",
    description: "Apply a percentage discount (e.g., 25% off)",
  },
  {
    value: "FIXED_DISCOUNT",
    label: "Fixed Amount Discount",
    description: "Apply a fixed amount off (e.g., $10 off)",
  },
  {
    value: "BOGO",
    label: "Buy One Get One (BOGO)",
    description: "Buy X quantity, get Y quantity free",
  },
  {
    value: "BUNDLE",
    label: "Bundle Deal",
    description: "Buy multiple products for a fixed price",
  },
  {
    value: "QUANTITY_DISCOUNT",
    label: "Quantity Discount",
    description: "Get discount when buying minimum quantity",
  },
  {
    value: "VOUCHER",
    label: "Voucher",
    description: "Fixed monetary value like a gift card",
  },
];

/**
 * Format deal details for display based on deal type
 */
export function formatDealDetails(promotion: PromotionResponseDto): string {
  switch (promotion.dealType) {
    case "PERCENTAGE_DISCOUNT":
      return `${promotion.percentageOff}% off`;
    
    case "FIXED_DISCOUNT":
      return `₱${promotion.fixedAmountOff} off`;
    
    case "BOGO":
      return `Buy ${promotion.buyQuantity} Get ${promotion.getQuantity} free`;
    
    case "BUNDLE":
      return `Bundle for ₱${promotion.bundlePrice}`;
    
    case "QUANTITY_DISCOUNT":
      return `Buy ${promotion.minQuantity}+ get ${promotion.quantityDiscount}% off`;
    
    case "VOUCHER":
      return `₱${promotion.voucherValue} voucher`;
    
    default:
      return "Special deal";
  }
}

/**
 * Calculate final price after applying promotion
 */
export function calculatePromotionPrice(
  originalPrice: number,
  promotion: PromotionResponseDto,
  quantity: number = 1
): number {
  switch (promotion.dealType) {
    case "PERCENTAGE_DISCOUNT":
      if (!promotion.percentageOff) return originalPrice * quantity;
      return originalPrice * quantity * (1 - promotion.percentageOff / 100);
    
    case "FIXED_DISCOUNT":
      if (!promotion.fixedAmountOff) return originalPrice * quantity;
      return Math.max(0, (originalPrice * quantity) - promotion.fixedAmountOff);
    
    case "BOGO":
      if (!promotion.buyQuantity || !promotion.getQuantity) return originalPrice * quantity;
      const setsOfBogo = Math.floor(quantity / (promotion.buyQuantity + promotion.getQuantity));
      const remaining = quantity % (promotion.buyQuantity + promotion.getQuantity);
      const paidItems = (setsOfBogo * promotion.buyQuantity) + Math.min(remaining, promotion.buyQuantity);
      return originalPrice * paidItems;
    
    case "BUNDLE":
      if (!promotion.bundlePrice) return originalPrice * quantity;
      return promotion.bundlePrice;
    
    case "QUANTITY_DISCOUNT":
      if (!promotion.minQuantity || !promotion.quantityDiscount) return originalPrice * quantity;
      if (quantity >= promotion.minQuantity) {
        return originalPrice * quantity * (1 - promotion.quantityDiscount / 100);
      }
      return originalPrice * quantity;
    
    case "VOUCHER":
      // Vouchers are applied at checkout, not to individual products
      return originalPrice * quantity;
    
    default:
      return originalPrice * quantity;
  }
}

/**
 * Get required fields for a specific deal type
 */
export function getRequiredFieldsForDealType(dealType: DealType): string[] {
  switch (dealType) {
    case "PERCENTAGE_DISCOUNT":
      return ["percentageOff"];
    case "FIXED_DISCOUNT":
      return ["fixedAmountOff"];
    case "BOGO":
      return ["buyQuantity", "getQuantity"];
    case "BUNDLE":
      return ["bundlePrice"];
    case "QUANTITY_DISCOUNT":
      return ["minQuantity", "quantityDiscount"];
    case "VOUCHER":
      return ["voucherValue"];
    default:
      return [];
  }
}

/**
 * Validate promotion data based on deal type
 */
export interface ValidationError {
  field: string;
  message: string;
}

export function validatePromotionData(data: Partial<CreatePromotionDto>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.dealType) {
    errors.push({ field: "dealType", message: "Deal type is required" });
    return errors;
  }

  switch (data.dealType) {
    case "PERCENTAGE_DISCOUNT":
      if (data.percentageOff === undefined || data.percentageOff === null) {
        errors.push({ field: "percentageOff", message: "Percentage off is required" });
      } else if (data.percentageOff <= 0 || data.percentageOff > 100) {
        errors.push({ field: "percentageOff", message: "Percentage must be between 0 and 100" });
      }
      break;

    case "FIXED_DISCOUNT":
      if (data.fixedAmountOff === undefined || data.fixedAmountOff === null) {
        errors.push({ field: "fixedAmountOff", message: "Fixed amount off is required" });
      } else if (data.fixedAmountOff <= 0) {
        errors.push({ field: "fixedAmountOff", message: "Fixed amount must be greater than 0" });
      }
      break;

    case "BOGO":
      if (data.buyQuantity === undefined || data.buyQuantity === null) {
        errors.push({ field: "buyQuantity", message: "Buy quantity is required" });
      } else if (data.buyQuantity <= 0) {
        errors.push({ field: "buyQuantity", message: "Buy quantity must be greater than 0" });
      }
      if (data.getQuantity === undefined || data.getQuantity === null) {
        errors.push({ field: "getQuantity", message: "Get quantity is required" });
      } else if (data.getQuantity <= 0) {
        errors.push({ field: "getQuantity", message: "Get quantity must be greater than 0" });
      }
      break;

    case "BUNDLE":
      if (data.bundlePrice === undefined || data.bundlePrice === null) {
        errors.push({ field: "bundlePrice", message: "Bundle price is required" });
      } else if (data.bundlePrice <= 0) {
        errors.push({ field: "bundlePrice", message: "Bundle price must be greater than 0" });
      }
      if (!data.productIds || data.productIds.length < 2) {
        errors.push({ field: "productIds", message: "Bundle deals require at least 2 products" });
      }
      break;

    case "QUANTITY_DISCOUNT":
      if (data.minQuantity === undefined || data.minQuantity === null) {
        errors.push({ field: "minQuantity", message: "Minimum quantity is required" });
      } else if (data.minQuantity <= 1) {
        errors.push({ field: "minQuantity", message: "Minimum quantity must be greater than 1" });
      }
      if (data.quantityDiscount === undefined || data.quantityDiscount === null) {
        errors.push({ field: "quantityDiscount", message: "Quantity discount is required" });
      } else if (data.quantityDiscount <= 0 || data.quantityDiscount > 100) {
        errors.push({ field: "quantityDiscount", message: "Quantity discount must be between 0 and 100" });
      }
      break;

    case "VOUCHER":
      if (data.voucherValue === undefined || data.voucherValue === null) {
        errors.push({ field: "voucherValue", message: "Voucher value is required" });
      } else if (data.voucherValue <= 0) {
        errors.push({ field: "voucherValue", message: "Voucher value must be greater than 0" });
      }
      // voucherQuantity defaults to 100 if not provided
      const voucherQuantity = data.voucherQuantity ?? 100;
      if (voucherQuantity <= 0) {
        errors.push({ field: "voucherQuantity", message: "Maximum vouchers must be greater than 0" });
      }
      break;
  }

  return errors;
}

/**
 * Get deal type display name
 */
export function getDealTypeLabel(dealType: DealType | undefined | null): string {
  if (!dealType || 
      typeof dealType !== "string" ||
      dealType.trim() === "" ||
      !["PERCENTAGE_DISCOUNT", "FIXED_DISCOUNT", "BOGO", "BUNDLE", "QUANTITY_DISCOUNT", "VOUCHER"].includes(dealType)) {
    return "";
  }
  const deal = DEAL_TYPES.find((d) => d.value === dealType);
  const label = deal?.label || "";
  // Ensure we never return "undefined" as a string
  return label === "undefined" ? "" : label;
}

/**
 * Convert legacy promotion format to new format
 * For backward compatibility with old API responses
 */
export function convertLegacyPromotion(legacy: any): PromotionResponseDto {
  // If it already has dealType, return as is
  if (legacy.dealType) {
    return legacy as PromotionResponseDto;
  }

  // Convert old type/discount format to new dealType format
  const dealType: DealType = 
    legacy.type === "percentage" || legacy.type === "PERCENTAGE"
      ? "PERCENTAGE_DISCOUNT"
      : "FIXED_DISCOUNT";

  const promotion: PromotionResponseDto = {
    ...legacy,
    dealType,
    type: legacy.type, // Keep for backward compatibility
    discount: legacy.discount, // Keep for backward compatibility
  };

  // Map discount to appropriate field
  if (dealType === "PERCENTAGE_DISCOUNT") {
    promotion.percentageOff = legacy.discount;
  } else if (dealType === "FIXED_DISCOUNT") {
    promotion.fixedAmountOff = legacy.discount;
  }

  return promotion;
}

/**
 * Convert new promotion format to legacy format
 * For backward compatibility with old API endpoints
 */
export function convertToLegacyPromotion(promotion: CreatePromotionDto): any {
  let type = "percentage";
  let discount = 0;

  // Map to legacy format
  if (promotion.dealType === "PERCENTAGE_DISCOUNT" && promotion.percentageOff) {
    type = "percentage";
    discount = promotion.percentageOff;
  } else if (promotion.dealType === "FIXED_DISCOUNT" && promotion.fixedAmountOff) {
    type = "fixed";
    discount = promotion.fixedAmountOff;
  }

  return {
    title: promotion.title,
    type,
    description: promotion.description,
    startsAt: promotion.startsAt,
    endsAt: promotion.endsAt,
    active: promotion.active,
    discount,
    productIds: promotion.productIds,
  };
}


