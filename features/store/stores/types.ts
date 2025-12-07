/**
 * Store domain types
 */

export type Store = {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  bannerUrl?: string;
  createdAt: Date;
  verificationStatus: "UNVERIFIED" | "VERIFIED";
  isActive?: boolean;
  ownerId?: number;
  userId?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  distance?: number;
};

export type CreateStoreDTO = {
  name: string;
  description: string;
  ownerId: number;
  imageUrl?: string;
  bannerUrl?: string;
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
  bannerUrl?: string;
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

export type ManageStoreStatusDTO = {
  verificationStatus?: "UNVERIFIED" | "VERIFIED";
  isActive?: boolean;
};

