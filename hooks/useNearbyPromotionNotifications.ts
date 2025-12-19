import { useStore } from "@/features/store";
import { useNotifications } from "@/features/notifications";
import { useAppSelector } from "@/store/hooks";
import { calculateDistance } from "@/utils/distance";
import { getNotificationPreference } from "@/utils/notificationPreferences";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

const LOCATION_CHECK_INTERVAL = 60000; // 60 seconds - minimal data usage
const MIN_DISTANCE_CHANGE_KM = 0.1; // Only check if moved at least 100m

type IntervalId = ReturnType<typeof setInterval>;

interface TrackedPromotion {
  promotionId: number;
  storeId: number;
  notifiedAt: number;
}

/**
 * Hook to track location and notify about nearby promotions
 * Only works when app is in foreground
 * Respects consumer tier (BASIC: 1km, PRO: 3km)
 * Can be disabled via notification preferences
 * Uses existing store and product data from Redux to minimize API calls
 */
export function useNearbyPromotionNotifications() {
  const router = useRouter();
  const {
    state: { activePromotions, currentTier, stores, products },
    action: { findActivePromotions, getCurrentTier },
  } = useStore();
  const { action: notificationActions } = useNotifications();
  const currentUser = useAppSelector((state) => state.auth.user);

  const [isEnabled, setIsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const locationIntervalRef = useRef<IntervalId | null>(null);
  const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const notifiedPromotionsRef = useRef<Map<number, TrackedPromotion>>(new Map());
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Determine radius based on tier
  const radiusKm = currentTier?.tier === "PRO" ? 3 : 1;

  // Load notification preference on mount
  useEffect(() => {
    getNotificationPreference().then(setNotificationsEnabled);
  }, []);

  // Fetch tier and promotions on mount
  useEffect(() => {
    getCurrentTier();
    findActivePromotions();
  }, [getCurrentTier, findActivePromotions]);

  // Create a map of productId -> store for efficient lookup
  // This uses existing Redux data, no additional API calls
  const productToStoreMap = useMemo(() => {
    const map = new Map<number, typeof stores[0]>();
    if (products && stores) {
      products.forEach((product) => {
        if (product.storeId) {
          const store = stores.find((s) => s.id === product.storeId);
          if (store && store.latitude !== null && store.longitude !== null) {
            map.set(product.id, store);
          }
        }
      });
    }
    return map;
  }, [products, stores]);

  // Check for nearby promotions
  const checkNearbyPromotions = useCallback(
    async (userLocation: { latitude: number; longitude: number }) => {
      // Skip if notifications are disabled
      if (!notificationsEnabled) {
        return;
      }

      // Skip if no promotions available
      if (!activePromotions || activePromotions.length === 0) {
        return;
      }

      // Skip if we don't have store/product data yet
      if (productToStoreMap.size === 0) {
        return;
      }

      const nearbyPromotions: Array<{
        promotion: typeof activePromotions[0];
        distance: number;
        storeName: string;
        storeId: number;
      }> = [];

      // Group promotions by store to avoid duplicate notifications
      const storePromotionMap = new Map<number, typeof activePromotions[0]>();

      for (const promotion of activePromotions) {
        // Skip if we already notified about this promotion recently (within last hour)
        const tracked = notifiedPromotionsRef.current.get(promotion.id);
        if (tracked && Date.now() - tracked.notifiedAt < 3600000) {
          continue;
        }

        // Get store from productId using our map (no API call needed)
        if (!promotion.productId) continue;
        
        const store = productToStoreMap.get(promotion.productId);
        if (!store || store.latitude === null || store.longitude === null) {
          continue;
        }

        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          store.latitude,
          store.longitude
        );

        // Check if within radius
        if (distance <= radiusKm) {
          // Only notify once per store (to avoid spam)
          if (!storePromotionMap.has(store.id)) {
            storePromotionMap.set(store.id, promotion);
            nearbyPromotions.push({
              promotion,
              distance,
              storeName: store.name,
              storeId: store.id,
            });
          }
        }
      }

      // Create notifications for new nearby promotions
      for (const { promotion, distance, storeName, storeId } of nearbyPromotions) {
        // Mark as notified
        notifiedPromotionsRef.current.set(promotion.id, {
          promotionId: promotion.id,
          storeId,
          notifiedAt: Date.now(),
        });

        // Create notification in database (only if user is logged in)
        if (currentUser?.id) {
          const distanceText = distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`;
          
          notificationActions.createNotification({
            userId: Number(currentUser.id),
            type: "PROMOTION_NEARBY",
            title: "🎉 Promotion Nearby!",
            message: `${promotion.title} at ${storeName} (${distanceText} away)`,
            storeId: storeId,
            promotionId: promotion.id,
          }).then(() => {
            // Refresh unread count after creating notification to ensure accuracy
            notificationActions.getUnreadCount();
          }).catch((error) => {
            // Silently handle errors to avoid annoying users
            console.warn("Failed to create nearby promotion notification:", error);
          });
        }
      }
    },
    [activePromotions, radiusKm, notificationsEnabled, productToStoreMap, currentUser?.id, notificationActions]
  );

  // Get current location and check for promotions
  const checkLocation = useCallback(async () => {
    // Skip if notifications disabled or app not active
    if (!notificationsEnabled || appStateRef.current !== "active") {
      return;
    }

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Balanced accuracy for minimal battery/data usage
      });

      const currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // Only check if location changed significantly (saves battery/data)
      if (lastLocationRef.current) {
        const distanceMoved = calculateDistance(
          lastLocationRef.current.latitude,
          lastLocationRef.current.longitude,
          currentLocation.latitude,
          currentLocation.longitude
        );

        if (distanceMoved < MIN_DISTANCE_CHANGE_KM) {
          return; // Not moved enough, skip check
        }
      }

      lastLocationRef.current = currentLocation;
      await checkNearbyPromotions(currentLocation);
    } catch (error) {
      // Silently handle errors to avoid annoying users
      console.warn("Location check error:", error);
    }
  }, [checkNearbyPromotions, notificationsEnabled]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      appStateRef.current = nextAppState;

      if (nextAppState === "active" && isEnabled && notificationsEnabled) {
        // App became active, start checking
        checkLocation();
        if (locationIntervalRef.current) {
          clearInterval(locationIntervalRef.current);
        }
        locationIntervalRef.current = setInterval(checkLocation, LOCATION_CHECK_INTERVAL);
      } else if (nextAppState !== "active") {
        // App went to background, stop checking
        if (locationIntervalRef.current) {
          clearInterval(locationIntervalRef.current);
          locationIntervalRef.current = null;
        }
      }
    });

    return () => {
      subscription.remove();
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [isEnabled, notificationsEnabled, checkLocation]);

  // Start/stop tracking based on enabled state
  useEffect(() => {
    if (isEnabled && notificationsEnabled && appStateRef.current === "active") {
      // Initial check
      checkLocation();
      // Set up interval
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
      locationIntervalRef.current = setInterval(checkLocation, LOCATION_CHECK_INTERVAL);
    } else {
      // Stop tracking
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [isEnabled, notificationsEnabled, checkLocation]);

  // Expose function to refresh notification preference
  const refreshNotificationPreference = useCallback(async () => {
    const enabled = await getNotificationPreference();
    setNotificationsEnabled(enabled);
  }, []);

  return {
    isEnabled,
    setIsEnabled,
    refreshNotificationPreference,
  };
}

