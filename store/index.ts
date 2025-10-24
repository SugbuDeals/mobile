import { authReducer } from "@/features/auth/slice";
import { bookmarksReducer } from "@/features/bookmarks/slice";
import { catalogReducer } from "@/features/catalog/slice";
import { storeReducer } from "@/features/store/slice";
import { configureStore } from "@reduxjs/toolkit";

export default configureStore({
  reducer: {
    auth: authReducer,
    store: storeReducer,
    catalog: catalogReducer,
    bookmarks: bookmarksReducer,
  },
});