import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Linking, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import StoreMapView from "@/components/StoreMapView";
import { colors, spacing, borderRadius, shadows, typography } from "@/styles/theme";
import type { Store } from "@/features/store/stores/types";

export default function ViewMap() {
  const router = useRouter();

  const handleStorePress = useCallback((store: Store) => {
    router.push({
      pathname: "/(consumers)/storedetails",
      params: { storeId: store.id },
    });
  }, [router]);

  const handleStoreCalloutPress = useCallback((store: Store) => {
    const hasCoords =
      typeof store.latitude === "number" && typeof store.longitude === "number";
    const url = hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`
      : `https://maps.google.com/maps?q=${encodeURIComponent(store.address || "")}`;
    Linking.openURL(url);
  }, []);

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
          onStorePress={handleStorePress}
          onStoreCalloutPress={handleStoreCalloutPress}
          autoFetchStores={true}
          radiusKm={10}
          style={styles.map}
        />
      </View>

      {/* Open in Maps Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.openMapsButton}
          onPress={() => Linking.openURL("https://maps.google.com/maps")}
        >
          <Ionicons name="map-outline" size={20} color={colors.primary} />
          <Text style={styles.buttonText}>Open in Maps</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
    marginBottom: 70,
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
    margin: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.md,
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
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
});
