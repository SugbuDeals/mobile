import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useEffect, useRef } from "react";
import { clearStore, setUserStore } from "./slice";
import { findStoreById, findUserStore } from "./thunk";

export const useStoreManagement = () => {
  const dispatch = useAppDispatch();
  const { user, accessToken, loading: authLoading } = useAppSelector((state) => state.auth);
  const { userStore, loading: storeLoading } = useAppSelector((state) => state.store);
  const hasAttemptedLoad = useRef(false);
  const lastUserId = useRef<number | null>(null);

  // Clear store when user logs out
  useEffect(() => {
    if (!user && !authLoading) {
      dispatch(clearStore());
      hasAttemptedLoad.current = false; // Reset the flag when user logs out
      lastUserId.current = null;
    }
  }, [user, authLoading, dispatch]);

  // Reset the flag when user changes or when userStore becomes null
  useEffect(() => {
    if (user && Number(user.id) !== lastUserId.current) {
      console.log("User changed, resetting load flag");
      hasAttemptedLoad.current = false;
      lastUserId.current = Number(user.id);
    } else if (user && !userStore && hasAttemptedLoad.current) {
      console.log("UserStore became null, resetting load flag to allow retry");
      hasAttemptedLoad.current = false;
    }
  }, [user, userStore]);

  // Load user store when user logs in and is a retailer
  useEffect(() => {
    const loadUserStore = async () => {
      if (user && accessToken && !authLoading && !storeLoading && !hasAttemptedLoad.current) {
        const normalizedRole = String((user as any).user_type ?? (user as any).role ?? "").toLowerCase();
        
        if (normalizedRole === "retailer") {
          // If we already have a userStore, don't try to load it again
          if (userStore) {
            console.log("UserStore already exists, skipping load:", userStore);
            hasAttemptedLoad.current = true;
            return;
          }
          
          hasAttemptedLoad.current = true; // Mark that we've attempted to load
          console.log("Loading store data for retailer:", user.id);
          
          // Check if user has storeId in their data
          const storeId = (user as any).storeId;
          if (storeId) {
            console.log("User has storeId:", storeId);
            try {
              // Get the store directly by ID
              const result = await dispatch(findStoreById(Number(storeId))).unwrap();
              console.log("Store data loaded by ID:", result);
              if (result) {
                dispatch(setUserStore(result));
                console.log("Store set in state:", result);
              } else {
                console.log("No store found for storeId:", storeId);
              }
            } catch (error) {
              console.error("Error loading store by ID:", error);
              // Fallback to the old method
              try {
                const result = await dispatch(findUserStore(Number((user as any).id))).unwrap();
                console.log("Store data loaded by user ID (fallback):", result);
                if (result) {
                  dispatch(setUserStore(result));
                  console.log("Store set in state (fallback):", result);
                }
              } catch (fallbackError) {
                console.error("Fallback store loading also failed:", fallbackError);
                hasAttemptedLoad.current = false;
              }
            }
          } else {
            console.log("No storeId found in user data for user:", user.id);
            // Fallback to the old method
            try {
              const result = await dispatch(findUserStore(Number((user as any).id))).unwrap();
              console.log("Store data loaded by user ID (no storeId):", result);
              if (result) {
                dispatch(setUserStore(result));
                console.log("Store set in state (no storeId):", result);
              }
            } catch (error) {
              console.error("Error loading store data (no storeId):", error);
              hasAttemptedLoad.current = false;
            }
          }
        }
      }
    };

    loadUserStore();
  }, [user, accessToken, authLoading, storeLoading, dispatch]);

  // Manual refresh function
  const refreshStore = async () => {
    if (user && accessToken && !authLoading && !storeLoading) {
      console.log("Manually refreshing store data for user:", user.id);
      
      const normalizedRole = String((user as any).user_type ?? (user as any).role ?? "").toLowerCase();
      if (normalizedRole === "retailer") {
        try {
          // Try to find user store, but don't fail if it doesn't work
          const result = await dispatch(findUserStore(Number((user as any).id))).unwrap();
          console.log("Store data refreshed:", result);
          if (result) {
            dispatch(setUserStore(result));
          } else {
            console.log("No store found during refresh - this is normal for new users");
          }
        } catch (error) {
          console.error("Error refreshing store data:", error);
          // Don't throw error - this is expected if user doesn't have a store yet
        }
      }
    }
  };

  return {
    userStore,
    storeLoading,
    isStoreLoaded: !!userStore,
    refreshStore,
  };
};

