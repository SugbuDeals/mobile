import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ModalState {
  [key: string]: {
    isOpen: boolean;
    data: any;
  };
}

interface UIState {
  modals: ModalState;
  selectedItems: {
    [key: string]: any;
  };
  activeFilters: {
    [key: string]: any;
  };
  componentLoading: {
    [key: string]: boolean;
  };
}

const initialState: UIState = {
  modals: {},
  selectedItems: {},
  activeFilters: {},
  componentLoading: {},
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openModal: (
      state,
      action: PayloadAction<{ key: string; data?: any }>
    ) => {
      state.modals[action.payload.key] = {
        isOpen: true,
        data: action.payload.data ?? null,
      };
    },
    closeModal: (state, action: PayloadAction<string>) => {
      if (state.modals[action.payload]) {
        state.modals[action.payload].isOpen = false;
      }
    },
    setModalData: (
      state,
      action: PayloadAction<{ key: string; data: any }>
    ) => {
      if (state.modals[action.payload.key]) {
        state.modals[action.payload.key].data = action.payload.data;
      }
    },
    setSelectedItem: (
      state,
      action: PayloadAction<{ key: string; item: any }>
    ) => {
      state.selectedItems[action.payload.key] = action.payload.item;
    },
    clearSelectedItem: (state, action: PayloadAction<string>) => {
      delete state.selectedItems[action.payload];
    },
    setActiveFilter: (
      state,
      action: PayloadAction<{ key: string; filter: any }>
    ) => {
      state.activeFilters[action.payload.key] = action.payload.filter;
    },
    clearActiveFilter: (state, action: PayloadAction<string>) => {
      delete state.activeFilters[action.payload];
    },
    setComponentLoading: (
      state,
      action: PayloadAction<{ key: string; loading: boolean }>
    ) => {
      state.componentLoading[action.payload.key] = action.payload.loading;
    },
    clearComponentLoading: (state, action: PayloadAction<string>) => {
      delete state.componentLoading[action.payload];
    },
    resetUI: (state) => {
      state.modals = {};
      state.selectedItems = {};
      state.activeFilters = {};
      state.componentLoading = {};
    },
  },
});

export const {
  openModal,
  closeModal,
  setModalData,
  setSelectedItem,
  clearSelectedItem,
  setActiveFilter,
  clearActiveFilter,
  setComponentLoading,
  clearComponentLoading,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectModalState = (state: { ui: UIState }, key: string) =>
  state.ui.modals[key] || { isOpen: false, data: null };

export const selectIsModalOpen = (state: { ui: UIState }, key: string) =>
  state.ui.modals[key]?.isOpen ?? false;

export const selectSelectedItem = (state: { ui: UIState }, key: string) =>
  state.ui.selectedItems[key] ?? null;

export const selectActiveFilter = (state: { ui: UIState }, key: string) =>
  state.ui.activeFilters[key] ?? null;

export const selectComponentLoading = (state: { ui: UIState }, key: string) =>
  state.ui.componentLoading[key] ?? false;

