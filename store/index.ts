import { authReducer } from "@/features/auth/slice";
import { storeReducer } from "@/features/store/slice";
import { configureStore } from "@reduxjs/toolkit";

export default configureStore({
  reducer: {
    auth: authReducer,
    store: storeReducer,
  },
});
