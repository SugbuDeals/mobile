/**
 * Store management hook for retailer-specific store loading
 */

import { useEffect, useRef } from "react";
import { useAppSelector } from "@/store/hooks";
import { useStores } from "./hooks";
import type { Store } from "./stores/types";

export function useStoreManagement() {
  const authState = useAppSelector((state) => state.auth);
  const user = authState.user;
  const stores = useStores();
  const hasLoadedRef = useRef(false);
  const userIdRef = useRef<number | null>(null);

  // Reset hasLoadedRef when user changes or logs out
  useEffect(() => {
    const currentUserId = user?.id ? Number(user.id) : null;
    if (userIdRef.current !== currentUserId) {
      hasLoadedRef.current = false;
      userIdRef.current = currentUserId;
    }
  }, [user?.id]);

  // Auto-load user store when user is available
  useEffect(() => {
    if (
      user &&
      user.user_type === "retailer" &&
      !hasLoadedRef.current &&
      !stores.state.loading &&
      !stores.state.userStore &&
      user.id
    ) {
      hasLoadedRef.current = true;
      stores.actions.findUserStore(Number(user.id));
    }
  }, [user, stores.state.userStore, stores.state.loading, stores.actions]);

  const refreshStore = () => {
    if (user && user.user_type === "retailer" && user.id) {
      hasLoadedRef.current = false;
      stores.actions.findUserStore(Number(user.id));
    }
  };

  return {
    userStore: stores.state.userStore,
    storeLoading: stores.state.loading,
    isStoreLoaded: !!stores.state.userStore || hasLoadedRef.current,
    refreshStore,
  };
}

