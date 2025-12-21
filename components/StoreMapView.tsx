import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
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
  /** Selected store ID to highlight */
  selectedStoreId?: number | null;
}

export interface StoreMapViewRef {
  animateToRegion: (region: Region, duration?: number) => void;
  fitToCoordinates: (coordinates: { latitude: number; longitude: number }[], options?: any) => void;
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
const StoreMapView = forwardRef<StoreMapViewRef, StoreMapViewProps>(({
  initialRegion,
  onStorePress,
  onStoreCalloutPress,
  stores: externalStores,
  autoFetchStores = false,
  radiusKm: providedRadiusKm,
  style,
  selectedStoreId,
}, ref) => {
  const mapRef = useRef<MapView>(null);

  // Expose map methods via ref
  useImperativeHandle(ref, () => ({
    animateToRegion: (region: Region, duration = 1000) => {
      mapRef.current?.animateToRegion(region, duration);
    },
    fitToCoordinates: (coordinates: { latitude: number; longitude: number }[], options?: any) => {
      mapRef.current?.fitToCoordinates(coordinates, options);
    },
  }));
  const {
    state: { nearbyStores, loading, currentTier },
    action: { findNearbyStores, getCurrentTier },
  } = useStore();

  // Auto-determine radius based on tier if not provided
  // BASIC: 1km max, PRO: 3km max
  const radiusKm = useMemo(() => {
    if (providedRadiusKm !== undefined) {
      return providedRadiusKm;
    }
    // Auto-determine based on tier
    if (currentTier?.tier === "PRO") {
      return 3; // PRO tier allows up to 3km
    }
    return 1; // BASIC tier allows up to 1km (default)
  }, [providedRadiusKm, currentTier?.tier]);

  // Fetch tier on mount if auto-fetching stores
  useEffect(() => {
    if (autoFetchStores) {
      getCurrentTier();
    }
  }, [autoFetchStores, getCurrentTier]);

  const [region, setRegion] = useState<Region | null>(initialRegion || null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const hasFetchedStoresRef = useRef(false);

  // Use external stores if provided, otherwise use Redux nearbyStores
  const stores = useMemo(() => {
    return externalStores || nearbyStores || [];
  }, [externalStores, nearbyStores]);

  // Filter stores with valid coordinates
  const validStores = useMemo(() => {
    const filtered = stores.filter(
      (store) => {
        const hasValidCoords = 
          typeof store.latitude === "number" &&
          typeof store.longitude === "number" &&
          isFinite(store.latitude) &&
          isFinite(store.longitude);
        
        if (!hasValidCoords) {
          console.warn("[StoreMapView] Store", store.id, store.name, "has invalid coordinates:", store.latitude, store.longitude);
        }
        return hasValidCoords;
      }
    );
    console.log("[StoreMapView] Valid stores count:", filtered.length, "Total stores:", stores.length);
    filtered.forEach(store => {
      console.log("[StoreMapView] Valid store:", store.id, store.name, "at", store.latitude, store.longitude);
    });
    return filtered;
  }, [stores]);

  // Get coordinates for fitting map
  const storeCoordinates = useMemo(() => {
    return validStores.map((store) => ({
      latitude: store.latitude as number,
      longitude: store.longitude as number,
    }));
  }, [validStores]);

  // Set region based on stores if we have stores but no region yet
  // This is critical when stores are passed externally (e.g., from view map page)
  const hasSetRegionFromStoresRef = useRef(false);
  useEffect(() => {
    if (storeCoordinates.length > 0 && !hasSetRegionFromStoresRef.current) {
      // Calculate center and bounds from store coordinates
      const latitudes = storeCoordinates.map(c => c.latitude);
      const longitudes = storeCoordinates.map(c => c.longitude);
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      // Ensure minimum delta so map is zoomed in enough
      const latDelta = Math.max(maxLat - minLat, 0.005) * 2.5; // Add padding, ensure minimum zoom
      const lngDelta = Math.max(maxLng - minLng, 0.005) * 2.5; // Add padding, ensure minimum zoom
      
      const newRegion: Region = {
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      };
      
      // Always set region from stores if we have external stores, or if no region is set
      if (externalStores && externalStores.length > 0) {
        // Force update region when external stores are provided
        setRegion(newRegion);
        hasSetRegionFromStoresRef.current = true;
        console.log("[StoreMapView] Set region from external stores:", newRegion, "for", storeCoordinates.length, "stores");
      } else if (!region && !initialRegion) {
        setRegion(newRegion);
        hasSetRegionFromStoresRef.current = true;
        console.log("[StoreMapView] Set region from stores:", newRegion, "for", storeCoordinates.length, "stores");
      }
    }
  }, [storeCoordinates.length, region, initialRegion, externalStores?.length]);


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
          // Store location for potential re-fetch when radiusKm changes
          lastLocationRef.current = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          // Mark that we've fetched stores
          hasFetchedStoresRef.current = true;
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
  // Wait a bit for tier to load before initial fetch to ensure correct radius
  // BUT: If we have external stores, prioritize setting region from stores first
  useEffect(() => {
    // If we have external stores with coordinates, set region from them first
    if (externalStores && externalStores.length > 0 && storeCoordinates.length > 0 && !region && !initialRegion) {
      // Region will be set by the effect that handles storeCoordinates
      console.log("[StoreMapView] Has external stores, will set region from stores");
      return;
    }
    
    if (!initialRegion && autoFetchStores) {
      // Small delay to allow tier to load first (similar to home page pattern)
      const timer = setTimeout(() => {
        requestLocationAndFetchStores();
      }, 100);
      return () => clearTimeout(timer);
    } else if (!initialRegion && !externalStores) {
      // Just request location without fetching stores (only if no external stores)
      requestLocationAndFetchStores();
    }
  }, [initialRegion, autoFetchStores, requestLocationAndFetchStores, externalStores, storeCoordinates, region]);

  // Re-fetch stores when radiusKm changes (e.g., when tier loads) if we already have a location
  // This ensures we get all stores within the correct subscription tier limits
  useEffect(() => {
    if (
      autoFetchStores &&
      lastLocationRef.current &&
      region &&
      hasFetchedStoresRef.current
    ) {
      // Re-fetch with updated radius when tier loads to ensure we get all nearby stores
      // This is important because the initial fetch might have used a default radius
      findNearbyStores({
        latitude: lastLocationRef.current.latitude,
        longitude: lastLocationRef.current.longitude,
        radiusKm,
      }).catch((error) => {
        console.warn("Failed to re-fetch stores with updated radius:", error);
      });
    }
  }, [radiusKm, autoFetchStores, findNearbyStores, region]);

  // Fit map to show all stores when they load
  // This is important to ensure all markers are visible
  useEffect(() => {
    if (storeCoordinates.length > 0 && mapRef.current && region) {
      // Small delay to ensure map is rendered and region is set
      const timer = setTimeout(() => {
        console.log("[StoreMapView] Fitting map to", storeCoordinates.length, "stores at coordinates:", storeCoordinates);
        try {
          mapRef.current?.fitToCoordinates(storeCoordinates, {
            edgePadding: {
              top: 100,
              right: 100,
              bottom: 100,
              left: 100,
            },
            animated: true,
          });
          console.log("[StoreMapView] Map fit completed");
        } catch (error) {
          console.warn("[StoreMapView] Error fitting map:", error);
        }
      }, 1000); // Increased delay to ensure map is fully rendered

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

  console.log("[StoreMapView] Rendering map with", validStores.length, "stores, region:", region, "selectedStoreId:", selectedStoreId);
  
  // Log all stores being rendered
  if (validStores.length > 0) {
    console.log("[StoreMapView] All stores to render:", validStores.map(s => ({
      id: s.id,
      name: s.name,
      lat: s.latitude,
      lng: s.longitude
    })));
  }

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      provider={PROVIDER_GOOGLE}
      initialRegion={region || undefined}
      region={region || undefined}
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass={true}
      toolbarEnabled={false}
    >
      {validStores.length > 0 ? (
        validStores.map((store) => {
          const isSelected = selectedStoreId === store.id;
          console.log("[StoreMapView] Rendering marker for store:", store.id, store.name, "at", store.latitude, store.longitude, "selected:", isSelected);
          return (
            <StoreMarker
              key={store.id}
              store={store}
              onPress={handleStorePress}
              onCalloutPress={handleStoreCalloutPress}
              isSelected={isSelected}
              showsCallout={isSelected}
            />
          );
        })
      ) : (
        <View>
          {/* No stores to display */}
        </View>
      )}
    </MapView>
  );
});

StoreMapView.displayName = 'StoreMapView';

export default StoreMapView;

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

