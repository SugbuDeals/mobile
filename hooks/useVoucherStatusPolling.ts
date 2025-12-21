/**
 * Hook to track active vouchers and poll for status changes
 * Shows popup when voucher is redeemed by retailer
 */

import { promotionsApi } from "@/services/api/endpoints/promotions";
import type { VoucherRedemptionStatus } from "@/services/api/types/swagger";
import { useAppSelector } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

interface ActiveVoucher {
  redemptionId: number;
  storeId: number;
  promotionId: number;
  status: VoucherRedemptionStatus;
  lastChecked: number;
}

const ACTIVE_VOUCHERS_KEY = "@sugbudeals:active_vouchers";
const POLL_INTERVAL = 3000; // Poll every 3 seconds
const MAX_POLL_DURATION = 5 * 60 * 1000; // Stop polling after 5 minutes

export function useVoucherStatusPolling() {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [activeVouchers, setActiveVouchers] = useState<Map<number, ActiveVoucher>>(new Map());
  const [redeemedVoucher, setRedeemedVoucher] = useState<ActiveVoucher | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const pollStartTimeRef = useRef<Map<number, number>>(new Map());

  // Load active vouchers from storage on mount
  useEffect(() => {
    const loadActiveVouchers = async () => {
      try {
        const stored = await AsyncStorage.getItem(ACTIVE_VOUCHERS_KEY);
        if (stored) {
          const vouchers = JSON.parse(stored) as ActiveVoucher[];
          const vouchersMap = new Map<number, ActiveVoucher>();
          vouchers.forEach((v) => {
            // Only track PENDING or VERIFIED vouchers
            // Polling will clean up if they're already redeemed
            if (v.status === "PENDING" || v.status === "VERIFIED") {
              vouchersMap.set(v.redemptionId, v);
              // Track when polling started for this voucher
              pollStartTimeRef.current.set(v.redemptionId, Date.now());
            }
          });
          setActiveVouchers(vouchersMap);
        }
      } catch (error) {
        console.error("Error loading active vouchers:", error);
      }
    };
    loadActiveVouchers();
  }, []);

  // Save active vouchers to storage whenever they change
  useEffect(() => {
    const saveActiveVouchers = async () => {
      try {
        const vouchersArray = Array.from(activeVouchers.values());
        await AsyncStorage.setItem(ACTIVE_VOUCHERS_KEY, JSON.stringify(vouchersArray));
      } catch (error) {
        console.error("Error saving active vouchers:", error);
      }
    };
    if (activeVouchers.size > 0) {
      saveActiveVouchers();
    }
  }, [activeVouchers]);

  // Register a voucher for tracking
  const registerVoucher = useCallback(
    (redemptionId: number, storeId: number, promotionId: number, status: VoucherRedemptionStatus) => {
      // Only track PENDING or VERIFIED vouchers
      if (status !== "PENDING" && status !== "VERIFIED") {
        return;
      }

      setActiveVouchers((prev) => {
        const updated = new Map(prev);
        updated.set(redemptionId, {
          redemptionId,
          storeId,
          promotionId,
          status,
          lastChecked: Date.now(),
        });
        return updated;
      });

      // Track when polling started for this voucher
      pollStartTimeRef.current.set(redemptionId, Date.now());
    },
    []
  );

  // Remove a voucher from tracking
  const unregisterVoucher = useCallback((redemptionId: number) => {
    setActiveVouchers((prev) => {
      const updated = new Map(prev);
      updated.delete(redemptionId);
      return updated;
    });
    pollStartTimeRef.current.delete(redemptionId);
  }, []);

  // Check voucher status for a specific store
  const checkVoucherStatus = useCallback(
    async (storeId: number, redemptionId: number) => {
      if (!currentUser) return;

      try {
        const status = await promotionsApi.checkVoucherClaimStatus(storeId);

        // The endpoint only returns redemptionId if there's a REDEEMED voucher
        // If redemptionId matches our tracked voucher and status is REDEEMED, it was just redeemed
        if (status.redemptionId === redemptionId && status.status === "REDEEMED") {
          // Find the voucher details
          const voucher = activeVouchers.get(redemptionId);
          if (voucher && voucher.status !== "REDEEMED") {
            // Voucher was just redeemed!
            setRedeemedVoucher(voucher);
            // Remove from active tracking
            unregisterVoucher(redemptionId);
          }
        }
        // If status.redemptionId is null or different, the voucher is still PENDING or VERIFIED
        // We don't need to update anything in that case - just keep polling
      } catch (error) {
        console.error(`Error checking voucher status for store ${storeId}:`, error);
      }
    },
    [currentUser, activeVouchers, unregisterVoucher]
  );

  // Poll all active vouchers
  const pollVouchers = useCallback(() => {
    if (activeVouchers.size === 0) return;

    activeVouchers.forEach((voucher, redemptionId) => {
      // Stop polling if we've been polling for too long
      const pollStartTime = pollStartTimeRef.current.get(redemptionId);
      if (pollStartTime && Date.now() - pollStartTime > MAX_POLL_DURATION) {
        unregisterVoucher(redemptionId);
        return;
      }

      // Only poll if app is in foreground
      if (appStateRef.current === "active") {
        checkVoucherStatus(voucher.storeId, redemptionId);
      }
    });
  }, [activeVouchers, checkVoucherStatus, unregisterVoucher]);

  // Set up polling interval
  useEffect(() => {
    if (activeVouchers.size === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start polling
    intervalRef.current = setInterval(pollVouchers, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeVouchers, pollVouchers]);

  // Track app state to pause polling when app is in background
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Clear redeemed voucher after it's been shown
  const clearRedeemedVoucher = useCallback(() => {
    setRedeemedVoucher(null);
  }, []);

  return {
    registerVoucher,
    unregisterVoucher,
    redeemedVoucher,
    clearRedeemedVoucher,
    activeVouchersCount: activeVouchers.size,
  };
}
