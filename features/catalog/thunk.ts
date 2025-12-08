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
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Find categories failed",
    });
  }
});

export const findProducts = createAsyncThunk<
  Product[],
  void,
  { rejectValue: { message: string }; state: RootState }
>("catalog/findProducts", async (_, { rejectWithValue }) => {
  try {
    // ProductResponseDto[] is already compatible with Product[] (Product is alias)
    return await productsApi.findProducts();
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Find products failed",
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
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Create category failed",
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
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Update category failed",
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
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Delete category failed",
    });
  }
});

