import { createSlice } from "@reduxjs/toolkit";
import { login } from "./auth.thunk";
import { AuthState } from "./auth.type";

const initialState: AuthState = {
  accessToken: null,
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.error = null;
    },
    completeRetailerSetup: (state) => {
      if (state.user) {
        state.user.retailer_setup_completed = true;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.access_token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed";
      });
  },
});

export const { logout, completeRetailerSetup } = authSlice.actions;
export const authReducer = authSlice.reducer;