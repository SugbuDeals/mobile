import { useAppDispatch, useAppSelector } from "@/store/hooks";
import * as thunk from "./thunk";
import { CreateProductDTO, CreatePromotionDTO, CreateStoreDTO, CreateSubscriptionDTO, JoinSubscriptionDTO, ManageStoreStatusDTO, UpdateProductDTO, UpdateProductStatusDTO, UpdatePromotionDTO, UpdateStoreDTO, UpdateSubscriptionDTO } from "./types";
export { useStoreManagement } from "./hooks";

export const useStore = () => {
  const dispatch = useAppDispatch();
  const storeState = useAppSelector((state) => state.store);

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
  const updateProductAdminStatus = (payload: { id: number } & UpdateProductStatusDTO) =>
    dispatch(thunk.updateProductAdminStatus(payload));
  const deleteProduct = (productId: number) => dispatch(thunk.deleteProduct(productId));
  const findPromotions = () => dispatch(thunk.findPromotions());
  const findActivePromotions = (storeId?: number) => dispatch(thunk.findActivePromotions({ storeId }));
  const findNearbyStores = (params: { latitude: number; longitude: number; radiusKm?: number }) => dispatch(thunk.findNearbyStores(params));
  const createPromotion = (promotionData: CreatePromotionDTO) => 
    dispatch(thunk.createPromotion(promotionData));
  const updatePromotion = (promotionData: { id: number } & UpdatePromotionDTO) => 
    dispatch(thunk.updatePromotion(promotionData));
  const deletePromotion = (promotionId: number) => dispatch(thunk.deletePromotion(promotionId));
  const createStore = (storeData: CreateStoreDTO) => 
    dispatch(thunk.createStore(storeData));
  const updateStore = (storeData: { id: number } & UpdateStoreDTO) => 
    dispatch(thunk.updateStore(storeData));
  const updateStoreAdminStatus = (payload: { id: number } & ManageStoreStatusDTO) =>
    dispatch(thunk.updateStoreAdminStatus(payload));
  const findStoreById = (storeId: number) => 
    dispatch(thunk.findStoreById(storeId));
  const getActiveSubscription = (userId: number) => 
    dispatch(thunk.getActiveSubscription(userId));
  const joinSubscription = (data: JoinSubscriptionDTO) => 
    dispatch(thunk.joinSubscription(data));
  const findSubscriptions = (filters?: {
    plan?: "FREE" | "BASIC" | "PREMIUM";
    isActive?: boolean;
    search?: string;
    skip?: number;
    take?: number;
  }) => dispatch(thunk.findSubscriptions(filters || {}));
  const cancelRetailerSubscription = () => 
    dispatch(thunk.cancelRetailerSubscription());
  const updateRetailerSubscription = (data: JoinSubscriptionDTO) => 
    dispatch(thunk.updateRetailerSubscription(data));
  const createSubscription = (data: CreateSubscriptionDTO) => 
    dispatch(thunk.createSubscription(data));
  const updateSubscription = (data: { id: number } & UpdateSubscriptionDTO) => 
    dispatch(thunk.updateSubscription(data));
  const deleteSubscription = (id: number) => 
    dispatch(thunk.deleteSubscription(id));
  const getSubscriptionAnalytics = () => 
    dispatch(thunk.getSubscriptionAnalytics());

  return {
    action: {
      findStores,
      findUserStore,
      findNearbyStores,
      findProducts,
      findProductById,
      createProduct,
      updateProduct,
      updateProductAdminStatus,
      deleteProduct,
      findPromotions,
      findActivePromotions,
      createPromotion,
      updatePromotion,
      deletePromotion,
      createStore,
      updateStore,
      updateStoreAdminStatus,
      findStoreById,
      getActiveSubscription,
      joinSubscription,
      findSubscriptions,
      cancelRetailerSubscription,
      updateRetailerSubscription,
      createSubscription,
      updateSubscription,
      deleteSubscription,
      getSubscriptionAnalytics,
    },
    state: storeState,
  };
};
