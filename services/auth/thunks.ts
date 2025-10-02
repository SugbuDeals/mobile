import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "./api";
import { AuthResponse, LoginCredentials } from "./types";

export const login = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.login(credentials);
    await AsyncStorage.setItem("token", response.access_token);

    return response;
  } catch (error: any) {
    return rejectWithValue(error.message || "Login failed");
  }
});
