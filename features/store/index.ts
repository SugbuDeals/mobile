import { useAppDispatch, useAppSelector } from "@/store/hooks";
import * as thunk from "./thunk";
import { CreateProductDTO, CreateStoreDTO, UpdateProductDTO, UpdateStoreDTO } from "./types";
export { useStoreManagement } from "./hooks";

export const useStore = () => {
  const dispatch = useAppDispatch();
  const { stores, userStore, products, promotions, activePromotions, loading, error } = useAppSelector((state) => state.store);

  const findStores = () => dispatch(thunk.findStores());
  const findUserStore = (userId: number) => dispatch(thunk.findUserStore(userId));
  const findProducts = (filters?: { storeId?: number; isActive?: boolean }) => 
    dispatch(thunk.findProducts(filters || {}));
  const createProduct = (productData: CreateProductDTO) => 
    dispatch(thunk.createProduct(productData));
  const updateProduct = (productData: { id: number } & UpdateProductDTO) => 
    dispatch(thunk.updateProduct(productData));
  const deleteProduct = (productId: number) => dispatch(thunk.deleteProduct(productId));
  const findPromotions = () => dispatch(thunk.findPromotions());
  const findActivePromotions = () => dispatch(thunk.findActivePromotions());
  const createStore = (storeData: CreateStoreDTO) => 
    dispatch(thunk.createStore(storeData));
  const updateStore = (storeData: { id: number } & UpdateStoreDTO) => 
    dispatch(thunk.updateStore(storeData));
  const findStoreById = (storeId: number) => 
    dispatch(thunk.findStoreById(storeId));

  return {
    action: {
      findStores,
      findUserStore,
      findProducts,
      createProduct,
      updateProduct,
      deleteProduct,
      findPromotions,
      findActivePromotions,
      createStore,
      updateStore,
      findStoreById,
    },
    state: {
      stores,
      userStore,
      products,
      promotions,
      activePromotions,
      loading,
      error,
    },
  };
};
