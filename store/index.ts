import { authReducer } from "@/features/auth/slice";
import { configureStore } from "@reduxjs/toolkit";

export default configureStore({
  reducer: {
    auth: authReducer
  },
});