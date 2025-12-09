import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useStore } from "@/features/store";
import { colors, spacing } from "@/styles/theme";
import StoreMarker from "./StoreMarker";
import type { Store } from "@/features/store/stores/types";

export interface StoreMapViewProps {
  /** Optional initial region. If not provided, will use user location or default */
  initialRegion?: Region;
  /** Callback when a store marker is pressed */
  onStorePress?: (store: Store) => void;
  /** Callback when a store callout is pressed */
  onStoreCalloutPress?: (store: Store) => void;
  /** Optional stores array. If not provided, will use nearbyStores from Redux */
  stores?: Store[];
  /** Whether to automatically fetch nearby stores on mount */
  autoFetchStores?: boolean;
  /** Radius in kilometers for fetching nearby stores */
  radiusKm?: number;
  /** Custom style for the map container */
  style?: object;
}

/**
 * Reusable map view component that displays stores with custom markers.
 * 
 * Manages location permissions, map region, and automatically fits map to show all stores.
 * Integrates with Redux for store data and handles loading/error states internally.
 * 
 * @component
 * @example
 * ```tsx
 * <StoreMapView
 *   onStorePress={(store) => router.push(`/store/${store.id}`)}
 *   autoFetchStores
 *   radiusKm={10}
 * />
 * ```
 * 
 * @param {StoreMapViewProps} props - StoreMapView component props
 * @returns {JSX.Element} StoreMapView component
 */
export default function StoreMapView({
  initialRegion,
  onStorePress,
  onStoreCalloutPress,
  stores: externalStores,
  autoFetchStores = false,
  radiusKm = 10,
  style,
}: StoreMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const {
    state: { nearbyStores, loading },
    action: { findNearbyStores },
  } = useStore();

  const [region, setRegion] = useState<Region | null>(initialRegion || null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Use external stores if provided, otherwise use Redux nearbyStores
  const stores = useMemo(() => {
    return externalStores || nearbyStores || [];
  }, [externalStores, nearbyStores]);

  // Filter stores with valid coordinates
  const validStores = useMemo(() => {
    return stores.filter(
      (store) =>
        typeof store.latitude === "number" &&
        typeof store.longitude === "number" &&
        isFinite(store.latitude) &&
        isFinite(store.longitude)
    );
  }, [stores]);

  // Get coordinates for fitting map
  const storeCoordinates = useMemo(() => {
    return validStores.map((store) => ({
      latitude: store.latitude as number,
      longitude: store.longitude as number,
    }));
  }, [validStores]);

  // Request location permission and set initial region
  const requestLocationAndFetchStores = useCallback(async () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const userRegion: Region = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };

        setRegion(userRegion);

        if (autoFetchStores) {
          await findNearbyStores({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            radiusKm,
          });
        }
      } else {
        // Default to a fallback location if permission denied
        const fallbackRegion: Region = {
          latitude: 10.3157,
          longitude: 123.8854,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        };
        setRegion(fallbackRegion);
        setLocationError("Location permission denied");
      }
    } catch (error) {
      const fallbackRegion: Region = {
        latitude: 10.3157,
        longitude: 123.8854,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      };
      setRegion(fallbackRegion);
      setLocationError(
        error instanceof Error ? error.message : "Failed to get location"
      );
    } finally {
      setIsLoadingLocation(false);
    }
  }, [autoFetchStores, findNearbyStores, radiusKm]);

  // Initialize location and fetch stores on mount if needed
  useEffect(() => {
    if (!initialRegion && autoFetchStores) {
      requestLocationAndFetchStores();
    } else if (!initialRegion) {
      // Just request location without fetching stores
      requestLocationAndFetchStores();
    }
  }, [initialRegion, autoFetchStores, requestLocationAndFetchStores]);

  // Fit map to show all stores when they load
  useEffect(() => {
    if (storeCoordinates.length > 0 && mapRef.current && region) {
      // Small delay to ensure map is rendered
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(storeCoordinates, {
          edgePadding: {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50,
          },
          animated: true,
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [storeCoordinates, region]);

  const handleStorePress = useCallback(
    (store: Store) => {
      onStorePress?.(store);
    },
    [onStorePress]
  );

  const handleStoreCalloutPress = useCallback(
    (store: Store) => {
      onStoreCalloutPress?.(store);
    },
    [onStoreCalloutPress]
  );

  // Show loading state
  if (isLoadingLocation || (!region && autoFetchStores)) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  // Show error state
  if (!region) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.errorText}>
          {locationError || "Unable to load map"}
        </Text>
      </View>
    );
  }

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      provider={PROVIDER_GOOGLE}
      initialRegion={region}
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass={true}
      toolbarEnabled={false}
    >
      {validStores.map((store) => (
        <StoreMarker
          key={store.id}
          store={store}
          onPress={handleStorePress}
          onCalloutPress={handleStoreCalloutPress}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.gray100,
  },
  map: {
    flex: 1,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.gray600,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: "center",
    padding: spacing.lg,
  },
});

