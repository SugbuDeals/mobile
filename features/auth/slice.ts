import { createSlice } from "@reduxjs/toolkit";
import { approveRetailer, deleteUser, deleteUserByAdmin, fetchAllUsers, fetchUserById, login, updateUser } from "./thunk";

const initialState = {
  accessToken: null,
  user: null,
  loading: false,
  error: null,
  allUsers: [] as any[],
  usersLoading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.error = null;
      state.allUsers = [];
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
      })
      // Fetch user by id
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.user = {
          ...(state.user || {} as any),
          ...action.payload,
        } as any;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch user";
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const merged: any = {
          ...(state.user || {} as any),
          ...action.payload,
        };
        // Ensure imageUrl is retained if server omits it but client updated it
        try {
          const requestedImageUrl = (action as any)?.meta?.arg?.data?.imageUrl;
          if (requestedImageUrl && typeof merged.imageUrl !== 'string') {
            merged.imageUrl = requestedImageUrl;
          }
        } catch {}
        state.user = merged as any;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to update user";
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.loading = false;
        state.accessToken = null;
        state.user = null;
        state.error = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to delete user account";
      })
      // Fetch all users
      .addCase(fetchAllUsers.pending, (state) => {
        state.usersLoading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.allUsers = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.error = action.payload?.message || "Failed to fetch users";
      })
      // Delete user by admin
      .addCase(deleteUserByAdmin.pending, (state) => {
        state.usersLoading = true;
      })
      .addCase(deleteUserByAdmin.fulfilled, (state) => {
        state.usersLoading = false;
      })
      .addCase(deleteUserByAdmin.rejected, (state, action) => {
        state.usersLoading = false;
        state.error = action.payload?.message || "Failed to delete user";
      })
      // Approve Retailer
      .addCase(approveRetailer.pending, (state) => {
        state.usersLoading = true;
        state.error = null;
      })
      .addCase(approveRetailer.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.error = null;
        if (action.payload?.id) {
          const index = state.allUsers.findIndex((user) => user.id === action.payload.id);
          if (index !== -1) {
            state.allUsers[index] = {
              ...state.allUsers[index],
              ...action.payload,
            };
          }
        }
      })
      .addCase(approveRetailer.rejected, (state, action) => {
        state.usersLoading = false;
        state.error = action.payload?.message || "Failed to approve retailer";
      });
  },
});

export const { logout, completeRetailerSetup } = authSlice.actions;
export const authReducer = authSlice.reducer;