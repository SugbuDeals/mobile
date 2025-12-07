import { productsApi, promotionsApi, storesApi, subscriptionsApi } from "@/services/api";
import { RootState } from "@/store/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { CreateProductDTO, CreateStoreDTO, CreateSubscriptionDTO, JoinSubscriptionDTO, ManageStoreStatusDTO, Product, Promotion, Store, Subscription, UserSubscription, SubscriptionAnalytics, UpdateProductDTO, UpdateProductStatusDTO, UpdateSubscriptionDTO } from "./types";
import type { CreatePromotionDTO, UpdatePromotionDTO } from "@/services/api/endpoints/promotions";

export const findStores = createAsyncThunk<
  Store[],
  undefined,
  { rejectValue: { message: string }; state: RootState }
>("store/findStores", async (_, { rejectWithValue }) => {
  try {
    return await storesApi.findStores();
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Find stores failed",
    });
  }
});

export const findNearbyStores = createAsyncThunk<
  Store[],
  { latitude: number; longitude: number; radiusKm?: number },
  { rejectValue: { message: string }; state: RootState }
>("store/findNearbyStores", async ({ latitude, longitude, radiusKm }, { rejectWithValue }) => {
  try {
    return await storesApi.findNearbyStores({
      latitude,
      longitude,
      radiusKm,
    });
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Find nearby stores failed",
    });
  }
});

export const findUserStore = createAsyncThunk<
  Store | null,
  number,
  { rejectValue: { message: string }; state: RootState }
>("store/findUserStore", async (userId, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;

    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    // Get all stores and filter by ownerId
    const stores = await storesApi.findStores();
    console.log("All stores from API:", stores);
    console.log("Looking for store with userId:", userId);
    
    // Find the store owned by this user
    const userStore = stores.find((store: any) => 
      store.ownerId === userId || 
      store.userId === userId || 
      store.owner_id === userId ||
      store.user_id === userId
    );
    
    console.log("Found user store:", userStore);
    
    // If no store found with owner fields, this might mean the API doesn't return owner info
    // In this case, we need to use a different approach or the user might not have a store yet
    if (!userStore) {
      console.log("No store found for user. This could mean:");
      console.log("1. User doesn't have a store yet");
      console.log("2. API doesn't return owner information");
      console.log("3. Store was just created and not yet indexed");
    }
    
    return userStore || null;
  } catch (error) {
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});


// Product thunks
export const findProducts = createAsyncThunk<
  Product[],
  { storeId?: number; isActive?: boolean },
  { rejectValue: { message: string }; state: RootState }
>("store/findProducts", async ({ storeId, isActive }, { rejectWithValue }) => {
  try {
    const products = await productsApi.findProducts({ storeId, isActive });
    
    // Return products as-is - price is string per server.json
    return products.map((product: any) => ({
      ...product,
      // Ensure stock is number (API should return number)
      stock: typeof product.stock === 'string' ? parseInt(product.stock) : product.stock,
    }));
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Find products failed",
    });
  }
});

export const findProductById = createAsyncThunk<
  Product,
  number,
  { rejectValue: { message: string }; state: RootState }
>("store/findProductById", async (productId, { rejectWithValue }) => {
  try {
    const product = await productsApi.findProductById(productId);
    
    // Return product as-is - price is string per server.json
    return {
      ...product,
      // Ensure stock is number (API should return number)
      stock: typeof product.stock === 'string' ? parseInt(product.stock) : product.stock,
    };
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Find product by ID failed",
    });
  }
});

export const createProduct = createAsyncThunk<
  Product,
  CreateProductDTO,
  { rejectValue: { message: string }; state: RootState }
>("store/createProduct", async (productData, { rejectWithValue }) => {
  try {
    // Convert categoryId from null to undefined for API
    const apiData = {
      ...productData,
      categoryId: productData.categoryId ?? undefined,
    };
    return await productsApi.createProduct(apiData);
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Create product failed",
    });
  }
});

export const updateProduct = createAsyncThunk<
  Product,
  { id: number } & UpdateProductDTO,
  { rejectValue: { message: string }; state: RootState }
>("store/updateProduct", async ({ id, ...updateData }, { rejectWithValue }) => {
  try {
    // Convert categoryId from null to undefined for API
    const apiData = {
      ...updateData,
      categoryId: updateData.categoryId ?? undefined,
    };
    return await productsApi.updateProduct(id, apiData);
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Update product failed",
    });
  }
});

export const updateProductAdminStatus = createAsyncThunk<
  Product,
  { id: number } & UpdateProductStatusDTO,
  { rejectValue: { message: string }; state: RootState }
>("store/updateProductAdminStatus", async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    const result = await productsApi.updateProductAdminStatus(id, payload);
    // Return result as-is - price is string per server.json
    return {
      ...result,
      // Ensure stock is number (API should return number)
      stock: typeof result.stock === "string" ? parseInt(result.stock, 10) : result.stock,
    };
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Update product status failed",
    });
  }
});

export const deleteProduct = createAsyncThunk<
  { id: number },
  number,
  { rejectValue: { message: string }; state: RootState }
>("store/deleteProduct", async (productId, { rejectWithValue }) => {
  try {
    await productsApi.deleteProduct(productId);
    return { id: productId };
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Delete product failed",
    });
  }
});

// Promotion thunks
export const findPromotions = createAsyncThunk<
  Promotion[],
  undefined,
  { rejectValue: { message: string }; state: RootState }
>("store/findPromotions", async (_, { rejectWithValue }) => {
  try {
    const apiPromotions = await promotionsApi.findPromotions();
    // Map API promotions to feature Promotion format
    // PromotionResponseDto: startsAt is string (ISO 8601), endsAt is string | null, no createdAt/updatedAt
    return apiPromotions.map((p: any) => ({
      id: p.id,
      title: p.title,
      type: p.type, // Keep as string (e.g., "PERCENTAGE")
      description: p.description || "",
      startsAt: typeof p.startsAt === "string" ? p.startsAt : new Date(p.startsAt).toISOString(),
      endsAt: p.endsAt ? (typeof p.endsAt === "string" ? p.endsAt : new Date(p.endsAt).toISOString()) : null,
      active: p.active,
      discount: p.discount,
      productId: p.productId ?? null, // Nullable per server.json
    }));
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Find promotions failed",
    });
  }
});

export const findActivePromotions = createAsyncThunk<
  Promotion[],
  { storeId?: number },
  { rejectValue: { message: string }; state: RootState }
>("store/findActivePromotions", async ({ storeId }, { rejectWithValue, getState }) => {
  try {
    const { products } = getState().store;
    const productsList = products.products;

    // Use the new active promotions endpoint
    const apiPromotions = await promotionsApi.findActivePromotions();
    
    // Map API promotions to feature Promotion format
    // PromotionResponseDto: startsAt is string (ISO 8601), endsAt is string | null, no createdAt/updatedAt
    let activePromotions = apiPromotions.map((p: any) => ({
      id: p.id,
      title: p.title,
      type: p.type, // Keep as string (e.g., "PERCENTAGE")
      description: p.description || "",
      startsAt: typeof p.startsAt === "string" ? p.startsAt : new Date(p.startsAt).toISOString(),
      endsAt: p.endsAt ? (typeof p.endsAt === "string" ? p.endsAt : new Date(p.endsAt).toISOString()) : null,
      active: p.active,
      discount: p.discount,
      productId: p.productId ?? null, // Nullable per server.json
    }));
    
    // If storeId is provided, filter promotions by store ownership
    if (storeId) {
      // Get product IDs that belong to the specified store
      const storeProductIds = productsList
        .filter((product: any) => product.storeId === storeId)
        .map((product: any) => product.id);
      
      // Filter promotions to only include those for products owned by the store
      activePromotions = activePromotions.filter((promotion: any) => 
        storeProductIds.includes(promotion.productId)
      );
    }
    
    return activePromotions;
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Find active promotions failed",
    });
  }
});

// Store management thunks
export const createStore = createAsyncThunk<
  Store,
  CreateStoreDTO,
  { rejectValue: { message: string }; state: RootState }
>("store/createStore", async (storeData, { rejectWithValue }) => {
  try {
    return await storesApi.createStore(storeData);
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Create store failed",
    });
  }
});

// updateStore is already defined above, this duplicate is removed

export const updateStoreAdminStatus = createAsyncThunk<
  Store,
  { id: number } & ManageStoreStatusDTO,
  { rejectValue: { message: string }; state: RootState }
>("store/updateStoreAdminStatus", async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    return await storesApi.updateStoreAdminStatus(id, payload);
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Update store status failed",
    });
  }
});

export const deleteStore = createAsyncThunk<
  { id: number },
  number,
  { rejectValue: { message: string }; state: RootState }
>("store/deleteStore", async (storeId, { rejectWithValue }) => {
  try {
    await storesApi.deleteStore(storeId);
    return { id: storeId };
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Delete store failed",
    });
  }
});

export const findStoreById = createAsyncThunk<
  Store | null,
  number,
  { rejectValue: { message: string }; state: RootState }
>("store/findStoreById", async (storeId, { rejectWithValue }) => {
  try {
    const store = await storesApi.findStoreById(storeId);
    // If 404 or null, return null (not an error)
    if (store === null) {
      return null;
    }
    return store;
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Find store by ID failed",
    });
  }
});

// Promotion management thunks
export const createPromotion = createAsyncThunk<
  Promotion,
  CreatePromotionDTO,
  { rejectValue: { message: string }; state: RootState }
>("store/createPromotion", async (promotionData, { rejectWithValue }) => {
  try {
    // Map feature DTO to API DTO format
    // Use API CreatePromotionDTO which matches server.json
    const apiData: CreatePromotionDTO = {
      title: promotionData.title,
      type: promotionData.type,
      description: promotionData.description,
      discount: promotionData.discount,
      productId: promotionData.productId,
      ...(promotionData.startsAt && { startsAt: promotionData.startsAt }),
      ...(promotionData.endsAt && { endsAt: promotionData.endsAt }),
      ...(promotionData.active !== undefined && { active: promotionData.active }),
    };
    
    const result = await promotionsApi.createPromotion(apiData);
    
    // Map API response to feature Promotion format
    // PromotionResponseDto: startsAt is string (ISO 8601), endsAt is string | null, no createdAt/updatedAt
    return {
      id: result.id,
      title: result.title,
      type: result.type, // Keep as string (e.g., "PERCENTAGE")
      description: result.description || "",
      startsAt: typeof result.startsAt === "string" ? result.startsAt : new Date(result.startsAt).toISOString(),
      endsAt: result.endsAt ? (typeof result.endsAt === "string" ? result.endsAt : new Date(result.endsAt).toISOString()) : null,
      active: result.active,
      discount: result.discount,
      productId: result.productId ?? null, // Nullable per server.json
    };
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Create promotion failed",
    });
  }
});

export const updatePromotion = createAsyncThunk<
  Promotion,
  { id: number } & UpdatePromotionDTO,
  { rejectValue: { message: string }; state: RootState }
>("store/updatePromotion", async ({ id, ...updateData }, { rejectWithValue }) => {
  try {
    // Map feature DTO to API DTO format
    // Use API UpdatePromotionDTO which matches server.json
    const apiData: UpdatePromotionDTO = {
      ...updateData,
      ...(updateData.endsAt !== undefined && { endsAt: updateData.endsAt }),
    };
    
    const result = await promotionsApi.updatePromotion(id, apiData);
    
    // Map API response to feature Promotion format
    // PromotionResponseDto: startsAt is string (ISO 8601), endsAt is string | null, no createdAt/updatedAt
    return {
      id: result.id,
      title: result.title,
      type: result.type, // Keep as string (e.g., "PERCENTAGE")
      description: result.description || "",
      startsAt: typeof result.startsAt === "string" ? result.startsAt : new Date(result.startsAt).toISOString(),
      endsAt: result.endsAt ? (typeof result.endsAt === "string" ? result.endsAt : new Date(result.endsAt).toISOString()) : null,
      active: result.active,
      discount: result.discount,
      productId: result.productId ?? null, // Nullable per server.json
    };
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Update promotion failed",
    });
  }
});

export const deletePromotion = createAsyncThunk<
  { id: number },
  number,
  { rejectValue: { message: string }; state: RootState }
>("store/deletePromotion", async (promotionId, { rejectWithValue }) => {
  try {
    await promotionsApi.deletePromotion(promotionId);
    return { id: promotionId };
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Delete promotion failed",
    });
  }
});

// Subscription thunks
export const getActiveSubscription = createAsyncThunk<
  UserSubscription | null,
  number,
  { rejectValue: { message: string }; state: RootState }
>("store/getActiveSubscription", async (userId, { rejectWithValue }) => {
  try {
    return await subscriptionsApi.getActiveSubscription(userId);
  } catch (error: any) {
    // If 404, user has no active subscription (return null, not an error)
    if (error?.status === 404) {
      return null;
    }
    return rejectWithValue({
      message: error?.message || "Get active subscription failed",
    });
  }
});

export const joinSubscription = createAsyncThunk<
  UserSubscription,
  JoinSubscriptionDTO,
  { rejectValue: { message: string }; state: RootState }
>("store/joinSubscription", async (data, { rejectWithValue }) => {
  try {
    return await subscriptionsApi.joinSubscription(data);
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Join subscription failed",
    });
  }
});

export const findSubscriptions = createAsyncThunk<
  Subscription[],
  {
    plan?: "FREE" | "BASIC" | "PREMIUM";
    isActive?: boolean;
    search?: string;
    skip?: number;
    take?: number;
  },
  { rejectValue: { message: string }; state: RootState }
>("store/findSubscriptions", async ({ plan, isActive, search, skip, take }, { rejectWithValue }) => {
  try {
    return await subscriptionsApi.findSubscriptions({
      plan,
      isActive,
      search,
      skip,
      take,
    });
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Find subscriptions failed",
    });
  }
});

export const cancelRetailerSubscription = createAsyncThunk<
  UserSubscription,
  void,
  { rejectValue: { message: string }; state: RootState }
>("store/cancelRetailerSubscription", async (_, { rejectWithValue }) => {
  try {
    return await subscriptionsApi.cancelRetailerSubscription();
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Cancel subscription failed",
    });
  }
});

export const updateRetailerSubscription = createAsyncThunk<
  UserSubscription,
  JoinSubscriptionDTO,
  { rejectValue: { message: string }; state: RootState }
>("store/updateRetailerSubscription", async (data, { rejectWithValue }) => {
  try {
    return await subscriptionsApi.updateRetailerSubscription(data);
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Update subscription failed",
    });
  }
});

// Admin Subscription thunks
export const createSubscription = createAsyncThunk<
  Subscription,
  CreateSubscriptionDTO,
  { rejectValue: { message: string }; state: RootState }
>("store/createSubscription", async (data, { rejectWithValue }) => {
  try {
    // Convert price from number to string for API
    const apiData = {
      ...data,
      price: String(data.price),
    } as any;
    return await subscriptionsApi.createSubscription(apiData);
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Create subscription failed",
    });
  }
});

export const updateSubscription = createAsyncThunk<
  Subscription,
  { id: number } & UpdateSubscriptionDTO,
  { rejectValue: { message: string }; state: RootState }
>("store/updateSubscription", async ({ id, ...data }, { rejectWithValue }) => {
  try {
    // Convert price from number to string for API if present
    const apiData = {
      ...data,
      ...(data.price !== undefined && { price: String(data.price) }),
    } as any;
    return await subscriptionsApi.updateSubscription(id, apiData);
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Update subscription failed",
    });
  }
});

export const deleteSubscription = createAsyncThunk<
  { id: number },
  number,
  { rejectValue: { message: string }; state: RootState }
>("store/deleteSubscription", async (id, { rejectWithValue }) => {
  try {
    await subscriptionsApi.deleteSubscription(id);
    return { id };
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Delete subscription failed",
    });
  }
});

export const getSubscriptionAnalytics = createAsyncThunk<
  SubscriptionAnalytics,
  void,
  { rejectValue: { message: string }; state: RootState }
>("store/getSubscriptionAnalytics", async (_, { rejectWithValue }) => {
  try {
    return await subscriptionsApi.getSubscriptionAnalytics();
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Get subscription analytics failed",
    });
  }
});