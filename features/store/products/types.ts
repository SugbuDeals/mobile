/**
 * Product domain types matching server.json ProductResponseDto
 * price is string (Decimal as string from backend)
 */

export type Product = {
  id: number;
  name: string;
  description: string;
  price: string; // Decimal as string per server.json
  stock: number;
  isActive: boolean;
  storeId: number;
  createdAt: string; // ISO 8601 format date-time
  imageUrl: string | null; // Nullable per server.json
  categoryId: number | null; // Nullable per server.json
};

/**
 * CreateProductDTO matching server.json CreateProductDTO
 * price is number in request (will be converted to string by backend)
 */
export type CreateProductDTO = {
  name: string;
  description: string;
  price: number; // Number in request, backend converts to Decimal string
  stock: number;
  isActive?: boolean;
  storeId: number;
  imageUrl?: string;
  categoryId?: number;
};

/**
 * UpdateProductDTO matching server.json UpdateProductDTO
 * price is number in request (will be converted to string by backend)
 */
export type UpdateProductDTO = {
  name?: string;
  description?: string;
  price?: number; // Number in request, backend converts to Decimal string
  stock?: number;
  isActive?: boolean;
  imageUrl?: string;
  categoryId?: number;
};

export type UpdateProductStatusDTO = {
  isActive: boolean;
};

