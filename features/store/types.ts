export type Store = {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  verificationStatus: "UNVERIFIED" | "VERIFIED";
  ownerId?: number;
  userId?: number;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number | string; // API returns string, we'll convert to number
  stock: number;
  isActive: boolean;
  storeId: number;
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
};

export type UpdateProductDTO = {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  isActive?: boolean;
};

export type CreateStoreDTO = {
  name: string;
  description: string;
  ownerId: number;
};

export type UpdateStoreDTO = {
  name?: string;
  description?: string;
  verificationStatus?: "UNVERIFIED" | "VERIFIED";
  userId: number; // Required by API
};

export type Promotion = {
  id: number;
  title: string;
  type: string;
  description: string;
  startsAt?: Date;
  endsAt?: Date;
  active: boolean;
  discount: number;
  productId: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type CreatePromotionDTO = {
  title: string;
  type: 'percentage' | 'fixed';
  description: string;
  startsAt: string;
  endsAt: string;
  discount: number;
  productId: number;
};

export type UpdatePromotionDTO = {
  title?: string;
  type?: 'percentage' | 'fixed';
  description?: string;
  startsAt?: string;
  endsAt?: string;
  discount?: number;
  productId?: number;
  active?: boolean;
};