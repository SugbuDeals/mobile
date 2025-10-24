import env from "@/config/env";
import { RootState } from "@/store/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { CreateProductDTO, CreateStoreDTO, Product, Promotion, Store, UpdateProductDTO, UpdateStoreDTO } from "./types";

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

    return response.json();
  } catch (error) {
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
  undefined,
  { rejectValue: { message: string }; state: RootState }
>("store/findActivePromotions", async (_, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;

    const response = await fetch(`${env.API_BASE_URL}/promotions/active`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return rejectWithValue({
        message: error.message || "Find active promotions failed",
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
    const { accessToken, user } = getState().auth;

    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    // Add userId from auth state if not provided
    const requestData = {
      ...updateData,
      userId: updateData.userId || user?.id,
    };

    const response = await fetch(`${env.API_BASE_URL}/store/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({
        message: error.message || "Update store failed",
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