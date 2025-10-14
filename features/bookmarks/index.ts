import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/types";
import {
    bookmarkProduct,
    bookmarkStore,
    listProductBookmarks,
    listStoreBookmarks,
    unbookmarkProduct,
    unbookmarkStore,
} from "./thunk";

export const useBookmarks = () => {
  const dispatch = useAppDispatch();
  const { stores, products, loading, error } = useAppSelector(
    (s: RootState) => s.bookmarks
  );

  const loadStoreBookmarks = (args?: { take?: number; skip?: number }) =>
    dispatch(listStoreBookmarks(args));
  const loadProductBookmarks = (args?: { take?: number; skip?: number }) =>
    dispatch(listProductBookmarks(args));
  const addStoreBookmark = (storeId: number) => dispatch(bookmarkStore({ storeId }));
  const removeStoreBookmark = (storeId: number) => dispatch(unbookmarkStore({ storeId }));
  const addProductBookmark = (productId: number) => dispatch(bookmarkProduct({ productId }));
  const removeProductBookmark = (productId: number) => dispatch(unbookmarkProduct({ productId }));

  const isStoreBookmarked = (storeId?: number) =>
    storeId != null && stores.some((s) => s.storeId === storeId);
  const isProductBookmarked = (productId?: number) =>
    productId != null && products.some((p) => p.productId === productId);

  return {
    action: {
      loadStoreBookmarks,
      loadProductBookmarks,
      addStoreBookmark,
      removeStoreBookmark,
      addProductBookmark,
      removeProductBookmark,
    },
    state: { stores, products, loading, error },
    helpers: { isStoreBookmarked, isProductBookmarked },
  };
};


