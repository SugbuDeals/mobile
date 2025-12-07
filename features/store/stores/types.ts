/**
 * Store domain types matching server.json StoreResponseDto
 */

export type Store = {
  id: number;
  name: string;
  description: string;
  createdAt: string; // ISO 8601 format date-time
  verificationStatus: "UNVERIFIED" | "VERIFIED";
  ownerId: number;
  isActive: boolean;
  imageUrl: string | null; // Nullable per server.json
  bannerUrl: string | null; // Nullable per server.json
  latitude: number | null; // Nullable per server.json
  longitude: number | null; // Nullable per server.json
  address: string | null; // Nullable per server.json
  city: string | null; // Nullable per server.json
  state: string | null; // Nullable per server.json
  country: string | null; // Nullable per server.json
  postalCode: string | null; // Nullable per server.json
  distance?: number; // Only present in StoreWithDistanceResponseDto
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

