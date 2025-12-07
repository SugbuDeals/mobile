/**
 * Product domain types
 */

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number | string;
  stock: number;
  isActive: boolean;
  storeId: number;
  imageUrl?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  categoryId?: number | null;
};

export type CreateProductDTO = {
  name: string;
  description: string;
  price: number;
  stock: number;
  isActive?: boolean;
  storeId: number;
  imageUrl?: string;
  categoryId?: number | null;
};

export type UpdateProductDTO = {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  isActive?: boolean;
  imageUrl?: string;
  categoryId?: number | null;
};

export type UpdateProductStatusDTO = {
  isActive: boolean;
};

