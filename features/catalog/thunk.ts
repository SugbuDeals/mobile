import { RootState } from "@/store/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { categoriesApi, productsApi } from "@/services/api";
import { Category, CreateCategoryDTO, Product, UpdateCategoryDTO } from "./types";

export const findCategories = createAsyncThunk<
  Category[],
  void,
  { rejectValue: { message: string }; state: RootState }
>("catalog/findCategories", async (_, { rejectWithValue }) => {
  try {
    return await categoriesApi.findCategories();
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Find categories failed",
    });
  }
});

export const findProducts = createAsyncThunk<
  Product[],
  void,
  { rejectValue: { message: string }; state: RootState }
>("catalog/findProducts", async (_, { rejectWithValue }) => {
  try {
    const products = await productsApi.findProducts();
    // Map API products to catalog Product format
    return products.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: typeof p.price === "string" ? parseFloat(p.price) : (p.price as number | undefined),
      storeId: p.storeId,
      isActive: p.isActive,
      imageUrl: p.imageUrl,
    }));
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Find products failed",
    });
  }
});

// Category CRUD operations
export const createCategory = createAsyncThunk<
  Category,
  CreateCategoryDTO,
  { rejectValue: { message: string }; state: RootState }
>("catalog/createCategory", async (categoryData, { rejectWithValue }) => {
  try {
    return await categoriesApi.createCategory(categoryData);
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Create category failed",
    });
  }
});

export const updateCategory = createAsyncThunk<
  Category,
  { id: number } & UpdateCategoryDTO,
  { rejectValue: { message: string }; state: RootState }
>("catalog/updateCategory", async ({ id, ...updateData }, { rejectWithValue }) => {
  try {
    return await categoriesApi.updateCategory(id, updateData);
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Update category failed",
    });
  }
});

export const deleteCategory = createAsyncThunk<
  { id: number },
  number,
  { rejectValue: { message: string }; state: RootState }
>("catalog/deleteCategory", async (categoryId, { rejectWithValue }) => {
  try {
    await categoriesApi.deleteCategory(categoryId);
    return { id: categoryId };
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Delete category failed",
    });
  }
});

