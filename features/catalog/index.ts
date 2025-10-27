import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store/types";
import { createCategory, deleteCategory, findCategories, findProducts, updateCategory } from "./thunk";
import { CreateCategoryDTO, UpdateCategoryDTO } from "./types";

export const useCatalog = () => {
  const dispatch = useAppDispatch();
  const { categories, products, loading, error } = useAppSelector(
    (s: RootState) => s.catalog
  );

  const loadCategories = () => dispatch(findCategories());
  const loadProducts = () => dispatch(findProducts());
  const addCategory = (data: CreateCategoryDTO) => dispatch(createCategory(data));
  const editCategory = (id: number, data: UpdateCategoryDTO) => dispatch(updateCategory({ id, ...data }));
  const removeCategory = (id: number) => dispatch(deleteCategory(id));

  return {
    action: { loadCategories, loadProducts, addCategory, editCategory, removeCategory },
    state: { categories, products, loading, error },
  };
};

