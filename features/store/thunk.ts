import env from "@/config/env";
import { RootState } from "@/store/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { CreateProductDTO, CreatePromotionDTO, CreateStoreDTO, JoinSubscriptionDTO, Product, Promotion, Store, Subscription, UpdateProductDTO, UpdatePromotionDTO, UpdateStoreDTO } from "./types";

export const findStores = createAsyncThunk<
  Store[],
  undefined,
  { rejectValue: { message: string }; state: RootState }
>("store/findStores", async (_, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;

    const response = await fetch(`${env.API_BASE_URL}/store`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return rejectWithValue({
        message: error.message || "Find stores failed",
      });
    }

    return response.json();
  } catch (error) {
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

export const findNearbyStores = createAsyncThunk<
  Store[],
  { latitude: number; longitude: number; radiusKm?: number },
  { rejectValue: { message: string }; state: RootState }
>("store/findNearbyStores", async ({ latitude, longitude, radiusKm }, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;
    const params = new URLSearchParams();
    params.append("latitude", String(latitude));
    params.append("longitude", String(longitude));
    if (radiusKm) params.append("radius", String(radiusKm));

    const response = await fetch(`${env.API_BASE_URL}/store/nearby?${params.toString()}` , {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({ message: error.message || "Find nearby stores failed" });
    }

    return response.json();
  } catch (error) {
    return rejectWithValue({ message: error instanceof Error ? error.message : "An unknown error occured" });
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
    const response = await fetch(`${env.API_BASE_URL}/store`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({
        message: error.message || "Find user store failed",
      });
    }

    const stores = await response.json();
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
>("store/findProducts", async ({ storeId, isActive }, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;

    const params = new URLSearchParams();
    if (storeId) params.append('storeId', storeId.toString());
    if (isActive !== undefined) params.append('isActive', isActive.toString());

    const response = await fetch(`${env.API_BASE_URL}/product?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return rejectWithValue({
        message: error.message || "Find products failed",
      });
    }

    const products = await response.json();
    
    // Transform the data to ensure proper types
    return products.map((product: any) => ({
      ...product,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      stock: typeof product.stock === 'string' ? parseInt(product.stock) : product.stock,
    }));
  } catch (error) {
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

export const findProductById = createAsyncThunk<
  Product,
  number,
  { rejectValue: { message: string }; state: RootState }
>("store/findProductById", async (productId, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;

    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    console.log("findProductById - Fetching product with ID:", productId);

    const response = await fetch(`${env.API_BASE_URL}/product/${productId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("findProductById - Response status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.log("findProductById - Error response:", error);
      return rejectWithValue({
        message: error.message || "Find product by ID failed",
      });
    }

    const product = await response.json();
    console.log("findProductById - Success response:", product);
    
    // Transform the data to ensure proper types
    return {
      ...product,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      stock: typeof product.stock === 'string' ? parseInt(product.stock) : product.stock,
    };
  } catch (error) {
    console.log("findProductById - Exception:", error);
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

export const createProduct = createAsyncThunk<
  Product,
  CreateProductDTO,
  { rejectValue: { message: string }; state: RootState }
>("store/createProduct", async (productData, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;
    
    console.log("Creating product with data:", productData);
    console.log("Access token available:", !!accessToken);

    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    const response = await fetch(`${env.API_BASE_URL}/product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(productData),
    });

    console.log("Product creation response status:", response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.log("Product creation error:", error);
      return rejectWithValue({
        message: error.message || "Create product failed",
      });
    }

    const result = await response.json();
    console.log("Product creation successful:", result);
    return result;
  } catch (error) {
    console.log("Product creation catch error:", error);
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

export const updateProduct = createAsyncThunk<
  Product,
  { id: number } & UpdateProductDTO,
  { rejectValue: { message: string }; state: RootState }
>("store/updateProduct", async ({ id, ...updateData }, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;
    
    console.log("Updating product with data:", { id, ...updateData });
    console.log("Access token available:", !!accessToken);

    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    const response = await fetch(`${env.API_BASE_URL}/product/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updateData),
    });

    console.log("Product update response status:", response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.log("Product update error:", error);
      return rejectWithValue({
        message: error.message || "Update product failed",
      });
    }

    const result = await response.json();
    console.log("Product update successful:", result);
    return result;
  } catch (error) {
    console.log("Product update catch error:", error);
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

export const deleteProduct = createAsyncThunk<
  { id: number },
  number,
  { rejectValue: { message: string }; state: RootState }
>("store/deleteProduct", async (productId, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;
    
    console.log("Deleting product with id:", productId);
    console.log("Access token available:", !!accessToken);

    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    const response = await fetch(`${env.API_BASE_URL}/product/${productId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("Product deletion response status:", response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.log("Product deletion error:", error);
      return rejectWithValue({
        message: error.message || "Delete product failed",
      });
    }

    const result = await response.json().catch(() => ({ id: productId }));
    console.log("Product deletion successful:", result);
    return result;
  } catch (error) {
    console.log("Product deletion catch error:", error);
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

// Promotion thunks
export const findPromotions = createAsyncThunk<
  Promotion[],
  undefined,
  { rejectValue: { message: string }; state: RootState }
>("store/findPromotions", async (_, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;

    const response = await fetch(`${env.API_BASE_URL}/promotions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return rejectWithValue({
        message: error.message || "Find promotions failed",
      });
    }

    return response.json();
  } catch (error) {
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

export const findActivePromotions = createAsyncThunk<
  Promotion[],
  { storeId?: number },
  { rejectValue: { message: string }; state: RootState }
>("store/findActivePromotions", async ({ storeId }, { rejectWithValue, getState }) => {
  try {
    const { accessToken, user } = getState().auth;
    const { userStore, products } = getState().store;

    console.log("findActivePromotions - Making API call to:", `${env.API_BASE_URL}/promotions`);
    console.log("findActivePromotions - Using access token:", accessToken ? "Present" : "Missing");
    console.log("findActivePromotions - Current user:", user);
    console.log("findActivePromotions - Current userStore:", userStore);
    console.log("findActivePromotions - Requested storeId:", storeId);

    const response = await fetch(`${env.API_BASE_URL}/promotions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("findActivePromotions - Response status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.log("findActivePromotions - Error response:", error);
      return rejectWithValue({
        message: error.message || "Find active promotions failed",
      });
    }

    const allPromotions = await response.json();
    console.log("findActivePromotions - All promotions response:", allPromotions);
    
    // Filter for active promotions
    let activePromotions = allPromotions.filter((promotion: any) => promotion.active === true);
    console.log("findActivePromotions - Filtered active promotions:", activePromotions);
    
    // If storeId is provided, filter promotions by store ownership
    if (storeId) {
      // Get product IDs that belong to the specified store
      const storeProductIds = products
        .filter(product => product.storeId === storeId)
        .map(product => product.id);
      
      console.log("findActivePromotions - Store product IDs:", storeProductIds);
      
      // Filter promotions to only include those for products owned by the store
      activePromotions = activePromotions.filter((promotion: any) => 
        storeProductIds.includes(promotion.productId)
      );
      
      console.log("findActivePromotions - Store-filtered promotions:", activePromotions);
    }
    
    return activePromotions;
  } catch (error) {
    console.log("findActivePromotions - Exception:", error);
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

// Store management thunks
export const createStore = createAsyncThunk<
  Store,
  CreateStoreDTO,
  { rejectValue: { message: string }; state: RootState }
>("store/createStore", async (storeData, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;

    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    const response = await fetch(`${env.API_BASE_URL}/store`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(storeData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({
        message: error.message || "Create store failed",
      });
    }

    return response.json();
  } catch (error) {
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

export const updateStore = createAsyncThunk<
  Store,
  { id: number } & UpdateStoreDTO,
  { rejectValue: { message: string }; state: RootState }
>("store/updateStore", async ({ id, ...updateData }, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;

    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    console.log("Updating store with data:", updateData);
    console.log("Store ID:", id);

    const response = await fetch(`${env.API_BASE_URL}/store/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updateData),
    });

    console.log("Update store response status:", response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.log("Update store error:", error);
      return rejectWithValue({
        message: error.message || "Update store failed",
      });
    }

    const result = await response.json();
    console.log("Update store successful:", result);
    return result;
  } catch (error) {
    console.log("Update store catch error:", error);
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

export const findStoreById = createAsyncThunk<
  Store,
  number,
  { rejectValue: { message: string }; state: RootState }
>("store/findStoreById", async (storeId, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;

    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    const response = await fetch(`${env.API_BASE_URL}/store/${storeId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({
        message: error.message || "Find store by ID failed",
      });
    }

    return response.json();
  } catch (error) {
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

// Promotion management thunks
export const createPromotion = createAsyncThunk<
  Promotion,
  CreatePromotionDTO,
  { rejectValue: { message: string }; state: RootState }
>("store/createPromotion", async (promotionData, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;
    
    console.log("Creating promotion with data:", promotionData);
    console.log("Access token available:", !!accessToken);

    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    const response = await fetch(`${env.API_BASE_URL}/promotions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(promotionData),
    });

    console.log("Promotion creation response status:", response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.log("Promotion creation error:", error);
      return rejectWithValue({
        message: error.message || "Create promotion failed",
      });
    }

    const result = await response.json();
    console.log("Promotion creation successful:", result);
    console.log("Promotion creation response data:", result);
    return result;
  } catch (error) {
    console.log("Promotion creation catch error:", error);
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

export const updatePromotion = createAsyncThunk<
  Promotion,
  { id: number } & UpdatePromotionDTO,
  { rejectValue: { message: string }; state: RootState }
>("store/updatePromotion", async ({ id, ...updateData }, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;
    
    console.log("Updating promotion with data:", { id, ...updateData });
    console.log("Access token available:", !!accessToken);

    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    const response = await fetch(`${env.API_BASE_URL}/promotions/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updateData),
    });

    console.log("Promotion update response status:", response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.log("Promotion update error:", error);
      return rejectWithValue({
        message: error.message || "Update promotion failed",
      });
    }

    const result = await response.json();
    console.log("Promotion update successful:", result);
    return result;
  } catch (error) {
    console.log("Promotion update catch error:", error);
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

export const deletePromotion = createAsyncThunk<
  { id: number },
  number,
  { rejectValue: { message: string }; state: RootState }
>("store/deletePromotion", async (promotionId, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;
    
    console.log("Deleting promotion with id:", promotionId);
    console.log("Access token available:", !!accessToken);

    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    const response = await fetch(`${env.API_BASE_URL}/promotions/${promotionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("Promotion deletion response status:", response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.log("Promotion deletion error:", error);
      return rejectWithValue({
        message: error.message || "Delete promotion failed",
      });
    }

    const result = await response.json().catch(() => ({ id: promotionId }));
    console.log("Promotion deletion successful:", result);
    return result;
  } catch (error) {
    console.log("Promotion deletion catch error:", error);
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

// Subscription thunks
export const getActiveSubscription = createAsyncThunk<
  Subscription | null,
  number,
  { rejectValue: { message: string }; state: RootState }
>("store/getActiveSubscription", async (userId, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;

    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    const response = await fetch(`${env.API_BASE_URL}/subscription/user/${userId}/active`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      // If 404, user has no active subscription (return null, not an error)
      if (response.status === 404) {
        return null;
      }
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({
        message: error.message || "Get active subscription failed",
      });
    }

    return response.json();
  } catch (error) {
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

export const joinSubscription = createAsyncThunk<
  Subscription,
  JoinSubscriptionDTO,
  { rejectValue: { message: string }; state: RootState }
>("store/joinSubscription", async (data, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;

    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    const response = await fetch(`${env.API_BASE_URL}/subscription/retailer/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({
        message: error.message || "Join subscription failed",
      });
    }

    return response.json();
  } catch (error) {
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});