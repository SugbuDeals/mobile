export type Store = {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  createdAt: Date;
  verificationStatus: "UNVERIFIED" | "VERIFIED";
  ownerId?: number;
  userId?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number | string; // API returns string, we'll convert to number
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
};

export type UpdateProductDTO = {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  isActive?: boolean;
  imageUrl?: string;
};

export type CreateStoreDTO = {
  name: string;
  description: string;
  ownerId: number;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
};

export type UpdateStoreDTO = {
  name?: string;
  description?: string;
  imageUrl?: string;
  verificationStatus?: "UNVERIFIED" | "VERIFIED";
  ownerId?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
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