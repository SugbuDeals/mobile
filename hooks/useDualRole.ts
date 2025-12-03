import { DualRoleManager, DualRoleProfile, RoleVariant } from "@/utils/dualRoleManager";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";

type RetailerStatus = "pending" | "skipped" | "completed";

export const useDualRole = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [profile, setProfile] = useState<DualRoleProfile | null>(null);
  const [activeRole, setActiveRole] = useState<RoleVariant>("CONSUMER");
  const [loading, setLoading] = useState(false);

  const consumerName =
    (user as any)?.fullname ?? (user as any)?.name ?? "";
  const consumerEmail = (user as any)?.email ?? "";
  const userKey =
    (user as any)?.id ??
    (consumerEmail ? consumerEmail.toLowerCase() : undefined);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!userKey) {
        setProfile(null);
        setActiveRole("CONSUMER");
        return;
      }
      setLoading(true);
      const storedProfile = await DualRoleManager.get(userKey);
      if (cancelled) return;
      setProfile(storedProfile);
      if (storedProfile) {
        const storedRole = await DualRoleManager.getActiveRole(userKey);
        if (!cancelled && storedRole) {
          setActiveRole(storedRole);
        }
      } else {
        setActiveRole("CONSUMER");
      }
      if (!cancelled) {
        setLoading(false);
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, [userKey]);

  const canSwitch = useMemo(() => {
    if (!profile) return false;
    return DualRoleManager.isInSync(profile, {
      name: consumerName,
      email: consumerEmail,
    });
  }, [profile, consumerName, consumerEmail]);

  const switchRole = useCallback(async () => {
    if (!profile) return;
    const nextRole: RoleVariant =
      activeRole === "CONSUMER" ? "RETAILER" : "CONSUMER";
    await DualRoleManager.setActiveRole(profile.userKey, nextRole);
    setActiveRole(nextRole);
  }, [profile, activeRole]);

  const refresh = useCallback(async () => {
    if (!userKey) return;
    const storedProfile = await DualRoleManager.get(userKey);
    setProfile(storedProfile);
  }, [userKey]);

  const syncSnapshot = useCallback(
    async (data: { name?: string; email?: string; password?: string }) => {
      if (!profile) return;
      const next = await DualRoleManager.syncConsumerSnapshot(
        profile.userKey,
        data
      );
      if (next) {
        setProfile(next);
      }
    },
    [profile]
  );

  const updateRetailerStatus = useCallback(
    async (status: RetailerStatus) => {
      if (!profile) return;
      const next = await DualRoleManager.setRetailerStatus(
        profile.userKey,
        status
      );
      if (next) {
        setProfile(next);
      }
    },
    [profile]
  );

  return {
    loading,
    profile,
    activeRole,
    canSwitch,
    switchRole,
    refresh,
    syncSnapshot,
    updateRetailerStatus,
    hasDualRole: Boolean(profile),
  };
};


