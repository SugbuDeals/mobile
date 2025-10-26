import env from "@/config/env";
import { RootState } from "@/store/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { Category, CreateCategoryDTO, Product, UpdateCategoryDTO } from "./types";

export const findCategories = createAsyncThunk<
  Category[],
  void,
  { rejectValue: { message: string }; state: RootState }
>("catalog/findCategories", async (_, { getState, rejectWithValue }) => {
  try {
    const { accessToken } = getState().auth;
    const response = await fetch(`${env.API_BASE_URL}/category`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({ message: error.message || "Find categories failed" });
    }
    return response.json();
  } catch (error) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

export const findProducts = createAsyncThunk<
  Product[],
  void,
  { rejectValue: { message: string }; state: RootState }
>("catalog/findProducts", async (_, { getState, rejectWithValue }) => {
  try {
    const { accessToken } = getState().auth;
    const response = await fetch(`${env.API_BASE_URL}/product`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({ message: error.message || "Find products failed" });
    }
    return response.json();
  } catch (error) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

// Category CRUD operations
export const createCategory = createAsyncThunk<
  Category,
  CreateCategoryDTO,
  { rejectValue: { message: string }; state: RootState }
>("catalog/createCategory", async (categoryData, { getState, rejectWithValue }) => {
  try {
    const { accessToken } = getState().auth;
    
    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    const response = await fetch(`${env.API_BASE_URL}/category`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({
        message: error.message || "Create category failed",
      });
    }

    return response.json();
  } catch (error) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

export const updateCategory = createAsyncThunk<
  Category,
  { id: number } & UpdateCategoryDTO,
  { rejectValue: { message: string }; state: RootState }
>("catalog/updateCategory", async ({ id, ...updateData }, { getState, rejectWithValue }) => {
  try {
    const { accessToken } = getState().auth;
    
    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    const response = await fetch(`${env.API_BASE_URL}/category/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({
        message: error.message || "Update category failed",
      });
    }

    return response.json();
  } catch (error) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

export const deleteCategory = createAsyncThunk<
  { id: number },
  number,
  { rejectValue: { message: string }; state: RootState }
>("catalog/deleteCategory", async (categoryId, { getState, rejectWithValue }) => {
  try {
    const { accessToken } = getState().auth;
    
    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    const response = await fetch(`${env.API_BASE_URL}/category/${categoryId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({
        message: error.message || "Delete category failed",
      });
    }

    return { id: categoryId };
  } catch (error) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

