import { useCallback, useMemo } from "react";
import type { Store } from "@/features/store/stores/types";

interface DistanceEnrichmentItem {
  distance?: number;
  distanceKm?: number;
  distance_km?: number;
  storeDistance?: number;
  store_distance?: number;
  storeId?: number;
  store?: { id?: number; distance?: number; distanceKm?: number; distance_km?: number };
}

export function useDistanceEnrichment(nearbyStores: Store[] = []) {
  const normalizeDistance = useCallback((raw: any): number | null => {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string") {
      const parsed = parseFloat(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  }, []);

  const extractDistanceFromItem = useCallback(
    (item: DistanceEnrichmentItem | null): number | null => {
      if (!item) return null;
      const candidates = [
        item.distance,
        item.distanceKm,
        item.distance_km,
        item.storeDistance,
        item.store_distance,
        item.store?.distance,
        item.store?.distanceKm,
        item.store?.distance_km,
      ];
      for (const candidate of candidates) {
        const normalized = normalizeDistance(candidate);
        if (normalized != null) return normalized;
      }
      return null;
    },
    [normalizeDistance]
  );

  const storeDistanceMap = useMemo(() => {
    const map = new Map<number, number>();
    nearbyStores.forEach((store) => {
      const normalized = normalizeDistance((store as any)?.distance);
      if (normalized != null && typeof store?.id === "number") {
        map.set(store.id, normalized);
      }
    });
    return map;
  }, [nearbyStores, normalizeDistance]);

  const enrichDistance = useCallback(
    <T extends DistanceEnrichmentItem>(item: T): T => {
      if (!item) return item;
      const inferred = extractDistanceFromItem(item);
      if (inferred != null) return { ...item, distance: inferred };

      const storeId = item?.storeId || item?.store?.id;
      if (storeId && storeDistanceMap.has(storeId)) {
        return { ...item, distance: storeDistanceMap.get(storeId)! };
      }

      return item;
    },
    [extractDistanceFromItem, storeDistanceMap]
  );

  return {
    enrichDistance,
    extractDistanceFromItem,
    normalizeDistance,
  };
}

