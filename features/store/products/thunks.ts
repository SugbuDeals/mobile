/**
 * Product domain thunks
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@/store/types";
import { productsApi } from "@/services/api/endpoints/products";
import type {
  Product,
  CreateProductDTO,
  UpdateProductDTO,
  UpdateProductStatusDTO,
} from "./types";

export const findProducts = createAsyncThunk<
  Product[],
  { storeId?: number; isActive?: boolean },
  { rejectValue: { message: string }; state: RootState }
>("products/findProducts", async (filters, { rejectWithValue }) => {
  try {
    const products = await productsApi.findProducts(filters);
    // Transform the data to ensure proper types
    return products.map((product: any) => ({
      ...product,
      price:
        typeof product.price === "string"
          ? parseFloat(product.price)
          : product.price,
      stock:
        typeof product.stock === "string"
          ? parseInt(product.stock, 10)
          : product.stock,
    }));
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Find products failed",
    });
  }
});

export const findProductById = createAsyncThunk<
  Product,
  number,
  { rejectValue: { message: string }; state: RootState }
>("products/findProductById", async (productId, { rejectWithValue }) => {
  try {
    const product = await productsApi.findProductById(productId);
    // Transform the data to ensure proper types
    return {
      ...product,
      price:
        typeof product.price === "string"
          ? parseFloat(product.price)
          : product.price,
      stock:
        typeof product.stock === "string"
          ? parseInt(product.stock, 10)
          : product.stock,
    };
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Find product by ID failed",
    });
  }
});

export const createProduct = createAsyncThunk<
  Product,
  CreateProductDTO,
  { rejectValue: { message: string }; state: RootState }
>("products/createProduct", async (productData, { rejectWithValue }) => {
  try {
    // Filter out null categoryId - API expects number | undefined, not null
    const { categoryId, ...rest } = productData;
    const apiData = {
      ...rest,
      ...(categoryId !== null && categoryId !== undefined ? { categoryId } : {}),
    };
    return await productsApi.createProduct(apiData);
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Create product failed",
    });
  }
});

export const updateProduct = createAsyncThunk<
  Product,
  { id: number } & UpdateProductDTO,
  { rejectValue: { message: string }; state: RootState }
>("products/updateProduct", async ({ id, ...updateData }, { rejectWithValue }) => {
  try {
    // Filter out null categoryId - API expects number | undefined, not null
    const { categoryId, ...rest } = updateData;
    const apiData = {
      ...rest,
      ...(categoryId !== null && categoryId !== undefined ? { categoryId } : {}),
    };
    return await productsApi.updateProduct(id, apiData);
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Update product failed",
    });
  }
});

export const updateProductAdminStatus = createAsyncThunk<
  Product,
  { id: number } & UpdateProductStatusDTO,
  { rejectValue: { message: string }; state: RootState }
>(
  "products/updateProductAdminStatus",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const result = await productsApi.updateProductAdminStatus(id, payload);
      return {
        ...result,
        price:
          typeof result.price === "string"
            ? parseFloat(result.price)
            : result.price,
        stock:
          typeof result.stock === "string"
            ? parseInt(result.stock, 10)
            : result.stock,
      };
    } catch (error) {
      return rejectWithValue({
        message:
          error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Update product status failed",
      });
    }
  }
);

export const deleteProduct = createAsyncThunk<
  { id: number },
  number,
  { rejectValue: { message: string }; state: RootState }
>("products/deleteProduct", async (productId, { rejectWithValue }) => {
  try {
    return await productsApi.deleteProduct(productId);
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Delete product failed",
    });
  }
});

