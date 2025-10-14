import env from "@/config/env";
import { RootState } from "@/store/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { Category, Product } from "./types";

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

