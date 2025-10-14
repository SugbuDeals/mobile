import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store/types";
import { findCategories, findProducts } from "./thunk";

export const useCatalog = () => {
  const dispatch = useAppDispatch();
  const { categories, products, loading, error } = useAppSelector(
    (s: RootState) => s.catalog
  );

  const loadCategories = () => dispatch(findCategories());
  const loadProducts = () => dispatch(findProducts());

  return {
    action: { loadCategories, loadProducts },
    state: { categories, products, loading, error },
  };
};

