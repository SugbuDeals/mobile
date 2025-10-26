import { useAppDispatch, useAppSelector } from "@/store/hooks";
import * as thunk from "./thunk";
import { CreateProductDTO, CreatePromotionDTO, CreateStoreDTO, UpdateProductDTO, UpdatePromotionDTO, UpdateStoreDTO } from "./types";
export { useStoreManagement } from "./hooks";

export const useStore = () => {
  const dispatch = useAppDispatch();
  const { stores, userStore, products, promotions, activePromotions, loading, error } = useAppSelector((state) => state.store);

  const findStores = () => dispatch(thunk.findStores());
  const findUserStore = (userId: number) => dispatch(thunk.findUserStore(userId));
  const findProducts = (filters?: { storeId?: number; isActive?: boolean }) => 
    dispatch(thunk.findProducts(filters || {}));
  const findProductById = (productId: number) => 
    dispatch(thunk.findProductById(productId));
  const createProduct = (productData: CreateProductDTO) => 
    dispatch(thunk.createProduct(productData));
  const updateProduct = (productData: { id: number } & UpdateProductDTO) => 
    dispatch(thunk.updateProduct(productData));
  const deleteProduct = (productId: number) => dispatch(thunk.deleteProduct(productId));
  const findPromotions = () => dispatch(thunk.findPromotions());
  const findActivePromotions = (storeId?: number) => dispatch(thunk.findActivePromotions({ storeId }));
  const createPromotion = (promotionData: CreatePromotionDTO) => 
    dispatch(thunk.createPromotion(promotionData));
  const updatePromotion = (promotionData: { id: number } & UpdatePromotionDTO) => 
    dispatch(thunk.updatePromotion(promotionData));
  const deletePromotion = (promotionId: number) => dispatch(thunk.deletePromotion(promotionId));
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
      findProductById,
      createProduct,
      updateProduct,
      deleteProduct,
      findPromotions,
      findActivePromotions,
      createPromotion,
      updatePromotion,
      deletePromotion,
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
