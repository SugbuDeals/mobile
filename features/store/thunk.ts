import { productsApi, promotionsApi, storesApi, subscriptionsApi } from "@/services/api";
import type { CreatePromotionDto, DealType, SubscriptionAnalyticsDto } from "@/services/api/types/swagger";
import { RootState } from "@/store/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { CreatePromotionDTO, UpdatePromotionDTO } from "./promotions/types";
import { CreateProductDTO, CreateStoreDTO, ManageStoreStatusDTO, Product, Promotion, Store, UpdateProductDTO, UpdateProductStatusDTO } from "./types";

export const findStores = createAsyncThunk<
  Store[],
  undefined,
  { rejectValue: { message: string }; state: RootState }
>("store/findStores", async (_, { rejectWithValue }) => {
  try {
    return await storesApi.findStores();
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Find stores failed",
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
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Find nearby stores failed",
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
    const userStore = stores.find((store: Store) => 
      store.ownerId === userId
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
    return products.map((product: Product) => ({
      ...product,
      // Ensure stock is number (API should return number)
      stock: typeof product.stock === 'string' ? parseInt(product.stock) : product.stock,
    }));
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Find products failed",
    });
  }
});

export const findProductById = createAsyncThunk<
  Product,
  number,
  { rejectValue: { message: string }; state: RootState }
>("store/findProductById", async (productId, { rejectWithValue }) => {
  // Validate productId before making API call
  if (!productId || !Number.isFinite(productId) || productId <= 0) {
    return rejectWithValue({
      message: "Invalid product ID",
    });
  }

  try {
    const product = await productsApi.findProductById(productId);
    if (!product) {
      return rejectWithValue({
        message: "Product not found",
      });
    }
    
    // Return product as-is - price is string per server.json
    return {
      ...product,
      // Ensure stock is number (API should return number)
      stock: typeof product.stock === 'string' ? parseInt(product.stock) : product.stock,
    };
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Find product by ID failed",
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
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Create product failed",
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
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Update product failed",
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
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Update product status failed",
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
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Delete product failed",
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
    return apiPromotions.map((p: any) => {
      // Extract productId from promotionProducts if productId is not present
      let productId = p.productId ?? null;
      if (!productId && p.promotionProducts && p.promotionProducts.length > 0) {
        productId = p.promotionProducts[0].productId ?? null;
      }
      
      return {
      id: p.id,
      title: p.title,
      type: p.type, // Keep as string (e.g., "PERCENTAGE")
      description: p.description || "",
      startsAt: typeof p.startsAt === "string" ? p.startsAt : new Date(p.startsAt).toISOString(),
      endsAt: p.endsAt ? (typeof p.endsAt === "string" ? p.endsAt : new Date(p.endsAt).toISOString()) : null,
      active: p.active,
      discount: p.discount,
        productId: productId,
      };
    });
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Find promotions failed",
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
    let activePromotions = apiPromotions.map((p: any) => {
      // Extract productId from promotionProducts if productId is not present (for backward compatibility)
      let productId = p.productId ?? null;
      if (!productId && p.promotionProducts && p.promotionProducts.length > 0) {
        productId = p.promotionProducts[0].productId ?? null;
      }
      
      return {
      id: p.id,
      title: p.title,
      type: p.type, // Keep as string (e.g., "PERCENTAGE")
      description: p.description || "",
      startsAt: typeof p.startsAt === "string" ? p.startsAt : new Date(p.startsAt).toISOString(),
      endsAt: p.endsAt ? (typeof p.endsAt === "string" ? p.endsAt : new Date(p.endsAt).toISOString()) : null,
      active: p.active,
      discount: p.discount,
        productId: productId,
        promotionProducts: p.promotionProducts || undefined, // Preserve all products in the promotion
      };
    });
    
    // If storeId is provided, filter promotions by store ownership
    if (storeId) {
      // Get product IDs that belong to the specified store
      const storeProductIds = productsList
        .filter((product: Product) => product.storeId === storeId)
        .map((product: Product) => product.id);
      
      // Filter promotions to only include those for products owned by the store
      activePromotions = activePromotions.filter((promotion: Promotion) => 
        storeProductIds.includes(promotion.productId ?? -1)
      );
    }
    
    return activePromotions;
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Find active promotions failed",
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
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Create store failed",
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
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Update store status failed",
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
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Delete store failed",
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
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Find store by ID failed",
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
    // API expects productIds array, not productId
    // Convert to API format - handle both productId (legacy) and productIds
    const productIds = promotionData.productIds || (promotionData.productId ? [promotionData.productId] : []);
    
    // Map legacy type field to dealType if dealType is not provided
    let dealType: DealType = promotionData.dealType as DealType;
    if (!dealType && promotionData.type) {
      // Convert legacy type to dealType
      dealType = promotionData.type === "percentage" || promotionData.type === "PERCENTAGE" 
        ? "PERCENTAGE_DISCOUNT" 
        : "FIXED_DISCOUNT";
    }
    
    // Ensure dealType is set (default to PERCENTAGE_DISCOUNT if missing)
    if (!dealType) {
      dealType = "PERCENTAGE_DISCOUNT";
    }
    
    // Build API data with dealType and appropriate deal-specific fields
    const apiData: CreatePromotionDto = {
      title: promotionData.title,
      dealType: dealType,
      description: promotionData.description,
      productIds,
      ...(promotionData.startsAt && { startsAt: promotionData.startsAt }),
      ...(promotionData.endsAt && { endsAt: promotionData.endsAt }),
      ...(promotionData.active !== undefined && { active: promotionData.active }),
    };
    
    // Map discount to appropriate deal-specific field
    if (dealType === "PERCENTAGE_DISCOUNT" && promotionData.discount !== undefined) {
      apiData.percentageOff = promotionData.discount;
    } else if (dealType === "FIXED_DISCOUNT" && promotionData.discount !== undefined) {
      apiData.fixedAmountOff = promotionData.discount;
    }
    
    // Include any other deal-specific fields that might be present
    if (promotionData.percentageOff !== undefined) apiData.percentageOff = promotionData.percentageOff;
    if (promotionData.fixedAmountOff !== undefined) apiData.fixedAmountOff = promotionData.fixedAmountOff;
    if (promotionData.buyQuantity !== undefined) apiData.buyQuantity = promotionData.buyQuantity;
    if (promotionData.getQuantity !== undefined) apiData.getQuantity = promotionData.getQuantity;
    if (promotionData.bundlePrice !== undefined) apiData.bundlePrice = promotionData.bundlePrice;
    if (promotionData.minQuantity !== undefined) apiData.minQuantity = promotionData.minQuantity;
    if (promotionData.quantityDiscount !== undefined) apiData.quantityDiscount = promotionData.quantityDiscount;
    if (promotionData.voucherValue !== undefined) apiData.voucherValue = promotionData.voucherValue;
    if (promotionData.voucherQuantity !== undefined) apiData.voucherQuantity = promotionData.voucherQuantity;
    
    const result: any = await promotionsApi.createPromotion(apiData);
    
    // Extract productId from promotionProducts if productId is not present (for backward compatibility)
    let productId = result.productId ?? null;
    if (!productId && result.promotionProducts && result.promotionProducts.length > 0) {
      productId = result.promotionProducts[0].productId ?? null;
    }
    
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
      productId: productId,
      promotionProducts: result.promotionProducts || undefined, // Preserve all products in the promotion
    };
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Create promotion failed",
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
    
    const result: any = await promotionsApi.updatePromotion(id, apiData);
    
    // Extract productId from promotionProducts if productId is not present
    let productId = result.productId ?? null;
    if (!productId && result.promotionProducts && result.promotionProducts.length > 0) {
      productId = result.promotionProducts[0].productId ?? null;
    }
    
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
      productId: productId,
    };
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Update promotion failed",
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
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Delete promotion failed",
    });
  }
});

// Subscription thunks - Only analytics is available (subscriptions are fixed in backend)
export const getSubscriptionAnalytics = createAsyncThunk<
  SubscriptionAnalyticsDto,
  void,
  { rejectValue: { message: string }; state: RootState }
>("store/getSubscriptionAnalytics", async (_, { rejectWithValue }) => {
  try {
    const result = await subscriptionsApi.getAnalytics();
    return result;
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Get subscription analytics failed",
    });
  }
});