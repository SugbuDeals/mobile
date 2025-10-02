import authReducer from "@/services/auth/slice";
import { configureStore } from "@reduxjs/toolkit";

export default configureStore({
  reducer: {
    auth: authReducer,
  },
});
