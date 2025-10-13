import { createSlice } from "@reduxjs/toolkit";
import { findStores } from "./thunk";
import { Store } from "./types";

const initialState: {
  stores: Store[];
  selectedStore: Store | null;
  loading: boolean;
  error: string | null;
} = {
  stores: [],
  selectedStore: null,
  loading: false,
  error: null,
};

const storeSlice = createSlice({
  name: "store",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      /**
       * [GET] store/findStore
       */
      .addCase(findStores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findStores.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.stores = action.payload;
      })
      .addCase(findStores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Find stores failed";
      });
  },
});

export const {} = storeSlice.actions;
export const storeReducer = storeSlice.reducer;
