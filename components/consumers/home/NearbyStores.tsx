import React, { useMemo, useState, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, borderRadius, typography } from "@/styles/theme";
import SectionHeader from "@/components/SectionHeader";
import EmptyState from "@/components/EmptyState";
import type { Store } from "@/features/store/stores/types";
import { reviewsApi } from "@/services/api/endpoints/reviews";
import type { StoreRatingStatsDto } from "@/services/api/types/swagger";
import StoreRating from "@/components/consumers/reviews/StoreRating";

interface NearbyStoresProps {
  stores: Store[];
  loading?: boolean;
}

export default function NearbyStores({ stores, loading }: NearbyStoresProps) {
  const router = useRouter();
  const [ratingStatsMap, setRatingStatsMap] = useState<Record<number, StoreRatingStatsDto | null>>({});

  // Memoize stores with valid data for performance
  const validStores = useMemo(() => {
    return stores.filter((store) => store && store.id);
  }, [stores]);

  // Fetch rating stats for all stores
  useEffect(() => {
    if (validStores.length === 0) return;

    const fetchRatingStats = async () => {
      const statsPromises = validStores.map(async (store) => {
        try {
          const stats = await reviewsApi.getStoreRatingStats(store.id);
          return { storeId: store.id, stats: stats || null };
        } catch {
          return { storeId: store.id, stats: null };
        }
      });

      const results = await Promise.all(statsPromises);
      const newMap: Record<number, StoreRatingStatsDto | null> = {};
      results.forEach(({ storeId, stats }) => {
        newMap[storeId] = stats;
      });
      setRatingStatsMap(newMap);
    };

    fetchRatingStats();
  }, [validStores]);

  const handleViewMap = () => {
    router.push("/(consumers)/viewmap");
  };

  const handleStorePress = (storeId: number) => {
    router.push({
      pathname: "/(consumers)/storedetails",
      params: { storeId },
    });
  };

  if (loading) {
    return (
      <View style={styles.section}>
        <SectionHeader title="Nearby Stores" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Finding nearby stores...</Text>
        </View>
      </View>
    );
  }

  if (!validStores || validStores.length === 0) {
    return (
      <View style={styles.section}>
        <SectionHeader
          title="Nearby Stores"
          linkText="View Map"
          onPress={handleViewMap}
        />
        <EmptyState
          icon="location-outline"
          title="No nearby stores"
          message="We couldn't find any stores near you. Try enabling location permissions."
        />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Nearby Stores"
        linkText="View Map"
        onPress={handleViewMap}
      />
      <View style={styles.storesContainer}>
        {validStores.map((store) => {
          const distance =
            "distance" in store &&
            typeof store.distance === "number" &&
            isFinite(store.distance)
              ? store.distance
              : null;
          const address = store.address || store.city || null;

          return (
            <TouchableOpacity
              key={store.id}
              style={styles.storeCard}
              activeOpacity={0.8}
              onPress={() => handleStorePress(store.id)}
            >
              <View style={styles.imageContainer}>
                {store.imageUrl ? (
                  <Image
                    source={{ uri: store.imageUrl }}
                    style={styles.storeImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons
                      name="storefront-outline"
                      size={24}
                      color={colors.gray400}
                    />
                  </View>
                )}
              </View>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName} numberOfLines={1}>
                  {store.name}
                </Text>
                <View style={styles.infoRow}>
                  {distance !== null && (
                    <View style={styles.distanceRow}>
                      <Ionicons
                        name="location-outline"
                        size={10}
                        color={colors.primary}
                      />
                      <Text style={styles.distance}>
                        {distance.toFixed(2)} km
                      </Text>
                    </View>
                  )}
                  <StoreRating
                    ratingStats={ratingStatsMap[store.id]}
                    size="small"
                    showCount={true}
                  />
                </View>
                {address && (
                  <Text style={styles.address} numberOfLines={1}>
                    {address}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.md,
  },
  storesContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  storeCard: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    backgroundColor: colors.gray100,
    marginRight: spacing.sm,
  },
  storeImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.gray100,
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  storeInfo: {
    flex: 1,
    justifyContent: "center",
  },
  storeName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  distance: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  address: {
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
  },
});

