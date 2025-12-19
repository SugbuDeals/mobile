import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Linking, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import StoreMapView, { type StoreMapViewRef } from "@/components/StoreMapView";
import { colors, spacing, borderRadius, shadows, typography } from "@/styles/theme";
import { useStore } from "@/features/store";
import type { Store } from "@/features/store/stores/types";
import * as Location from "expo-location";
import { useStableThunk } from "@/hooks/useStableCallback";
import { useAsyncEffect } from "@/hooks/useAsyncEffect";
import { Region } from "react-native-maps";

export default function ViewMap() {
  const router = useRouter();
  const mapRef = useRef<StoreMapViewRef>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  
  // Get nearby stores from Redux state and fetch if needed
  const {
    state: { nearbyStores, currentTier },
    action: { findNearbyStores, getCurrentTier },
  } = useStore();

  // Stable thunk references
  const stableFindNearbyStores = useStableThunk(findNearbyStores);
  const stableGetCurrentTier = useStableThunk(getCurrentTier);

  // Auto-determine radius based on tier (BASIC: 1km, PRO: 3km)
  const radiusKm = useMemo(() => {
    if (currentTier?.tier === "PRO") {
      return 3; // PRO tier allows up to 3km
    }
    return 1; // BASIC tier allows up to 1km (default)
  }, [currentTier?.tier]);

  // Always fetch stores on mount (same pattern as home page)
  // Use ref to track if we've already fetched to prevent infinite loops
  const hasFetchedRef = useRef(false);
  
  useAsyncEffect(async () => {
    // Only fetch once on mount
    if (hasFetchedRef.current) {
      return;
    }
    
    hasFetchedRef.current = true;
    
    // Fetch tier first
    stableGetCurrentTier();
    
    // Always fetch stores to ensure we have the latest data
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.Balanced 
        });
        console.log("[ViewMap] Fetching stores at location:", pos.coords.latitude, pos.coords.longitude, "radius:", radiusKm);
        await stableFindNearbyStores({ 
          latitude: pos.coords.latitude, 
          longitude: pos.coords.longitude, 
          radiusKm: radiusKm 
        });
      } else {
        console.warn("[ViewMap] Location permission denied");
      }
    } catch (error) {
      console.warn("[ViewMap] Location permission error:", error);
    }
  }, []); // Empty deps - only run once on mount

  // Filter stores with valid coordinates
  const validStores = useMemo(() => {
    const filtered = (nearbyStores || []).filter(
      (store) =>
        typeof store.latitude === "number" &&
        typeof store.longitude === "number" &&
        isFinite(store.latitude) &&
        isFinite(store.longitude)
    );
    console.log("[ViewMap] Valid stores:", filtered.length, "out of", nearbyStores?.length || 0);
    filtered.forEach(store => {
      console.log("[ViewMap] Store:", store.id, store.name, "coords:", store.latitude, store.longitude);
    });
    return filtered;
  }, [nearbyStores]);

  // Update map region when a store is selected
  const selectedStore = useMemo(() => {
    return validStores.find(s => s.id === selectedStoreId);
  }, [selectedStoreId, validStores]);

  useEffect(() => {
    if (selectedStoreId && mapRef.current && selectedStore) {
      if (selectedStore.latitude && selectedStore.longitude) {
        const region: Region = {
          latitude: selectedStore.latitude,
          longitude: selectedStore.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        mapRef.current.animateToRegion(region, 1000);
        console.log("[ViewMap] Centered map on selected store:", selectedStore.name);
      }
    }
  }, [selectedStoreId, selectedStore]);

  // Fit map to show all stores when they load
  useEffect(() => {
    if (validStores.length > 0 && mapRef.current) {
      const coordinates = validStores.map(store => ({
        latitude: store.latitude as number,
        longitude: store.longitude as number,
      }));
      
      console.log("[ViewMap] Fitting map to", coordinates.length, "stores");
      // Delay to ensure map is rendered
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 150, right: 100, bottom: 300, left: 100 },
          animated: true,
        });
        console.log("[ViewMap] Map fitted to show all stores");
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [validStores.length]); // Only depend on length, not the array itself

  const handleStorePress = useCallback((store: Store) => {
    // Set selected store and update map
    setSelectedStoreId(store.id);
  }, []);

  const handleStoreDetails = useCallback((storeId: number) => {
    router.push({
      pathname: "/(consumers)/storedetails",
      params: { storeId },
    });
  }, [router]);

  const handleStoreCalloutPress = useCallback((store: Store) => {
    const hasCoords =
      typeof store.latitude === "number" && typeof store.longitude === "number";
    const url = hasCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`
      : `https://maps.google.com/maps?q=${encodeURIComponent(store.address || "")}`;
    Linking.openURL(url);
  }, []);

  // Navigate to selected store location
  const handleNavigateToStore = useCallback(() => {
    if (selectedStoreId && selectedStore) {
      const hasCoords =
        typeof selectedStore.latitude === "number" && typeof selectedStore.longitude === "number";
      
      if (hasCoords) {
        // Open Google Maps with directions to the selected store
        const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedStore.latitude},${selectedStore.longitude}`;
        Linking.openURL(url);
      } else if (selectedStore.address) {
        // Fallback to address if no coordinates
        const url = `https://maps.google.com/maps?q=${encodeURIComponent(selectedStore.address)}`;
        Linking.openURL(url);
      } else {
        // Navigate to navigate page if we have store info
        router.push({
          pathname: "/(consumers)/navigate",
          params: {
            storeName: selectedStore.name || "Store",
            storeId: selectedStore.id?.toString(),
            address: selectedStore.address || "",
            latitude: selectedStore.latitude?.toString(),
            longitude: selectedStore.longitude?.toString(),
          },
        });
      }
    } else {
      // No store selected, open general maps
      Linking.openURL("https://maps.google.com/maps");
    }
  }, [selectedStoreId, selectedStore, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>View Map</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <StoreMapView
          ref={mapRef}
          onStorePress={handleStorePress}
          onStoreCalloutPress={handleStoreCalloutPress}
          stores={validStores}
          autoFetchStores={false}
          selectedStoreId={selectedStoreId}
          style={styles.map}
        />
      </View>

      {/* Store List */}
      {validStores.length > 0 && (
        <View style={styles.storeListContainer}>
          <Text style={styles.storeListTitle}>Nearby Stores ({validStores.length})</Text>
          <ScrollView 
            style={styles.storeListScroll}
            showsVerticalScrollIndicator={false}
          >
            {validStores.map((store) => {
              const isSelected = selectedStoreId === store.id;
              return (
                <TouchableOpacity
                  key={store.id}
                  style={[
                    styles.storeListItem,
                    isSelected && styles.storeListItemSelected
                  ]}
                  onPress={() => handleStorePress(store)}
                  activeOpacity={0.7}
                >
                  <View style={styles.storeListItemContent}>
                    <View style={styles.storeListItemInfo}>
                      <View style={styles.storeListItemHeader}>
                        <Text style={[
                          styles.storeListItemName,
                          isSelected && styles.storeListItemNameSelected
                        ]} numberOfLines={1}>
                          {store.name}
                        </Text>
                        {isSelected && (
                          <View style={styles.selectedBadge}>
                            <Text style={styles.selectedBadgeText}>Selected</Text>
                          </View>
                        )}
                      </View>
                      {store.address && (
                        <Text style={styles.storeListItemAddress} numberOfLines={1}>
                          {store.address}
                        </Text>
                      )}
                      {store.distance !== undefined && (
                        <Text style={styles.storeListItemDistance}>
                          {typeof store.distance === 'number' 
                            ? `${store.distance.toFixed(2)} km away`
                            : store.distance
                          }
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.viewDetailsButton}
                      onPress={() => handleStoreDetails(store.id)}
                    >
                      <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Navigate Button */}
      <View style={styles.buttonContainer}>
        {selectedStoreId && selectedStore ? (
          <TouchableOpacity
            style={[styles.openMapsButton, styles.navigateButton]}
            onPress={handleNavigateToStore}
          >
            <Ionicons name="navigate" size={20} color={colors.white} />
            <Text style={[styles.buttonText, styles.navigateButtonText]}>
              Navigate to {selectedStore.name}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.openMapsButton}
            onPress={() => Linking.openURL("https://maps.google.com/maps")}
          >
            <Ionicons name="map-outline" size={20} color={colors.primary} />
            <Text style={styles.buttonText}>Open in Maps</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.black,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.md,
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  openMapsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    ...shadows.sm,
  },
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  storeListContainer: {
    position: "absolute",
    bottom: 80,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    maxHeight: 300,
    ...shadows.md,
  },
  storeListTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.black,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  storeListScroll: {
    maxHeight: 250,
    padding: spacing.sm,
  },
  storeListItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  storeListItemSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.gray50,
  },
  storeListItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  storeListItemInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  storeListItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  storeListItemName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
    flex: 1,
  },
  storeListItemNameSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  selectedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  selectedBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  storeListItemAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  storeListItemDistance: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  viewDetailsButton: {
    padding: spacing.xs,
  },
  navigateButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  navigateButtonText: {
    color: colors.white,
  },
});
