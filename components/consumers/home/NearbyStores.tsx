import React from "react";
import { StyleSheet, ScrollView, Text, TouchableOpacity, View, Image } from "react-native";
import { useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";
import { colors, spacing, borderRadius, typography } from "@/styles/theme";
import SectionHeader from "@/components/SectionHeader";
import EmptyState from "@/components/EmptyState";
import type { Store } from "@/features/store/stores/types";

interface NearbyStoresProps {
  stores: Store[];
  loading?: boolean;
}

export default function NearbyStores({ stores, loading }: NearbyStoresProps) {
  const router = useRouter();

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

  if (!stores || stores.length === 0) {
    return (
      <View style={styles.section}>
        <SectionHeader title="Nearby Stores" />
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
      <SectionHeader title="Nearby Stores" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {stores.map((store) => (
          <TouchableOpacity
            key={store.id}
            style={styles.storeCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/(consumers)/storedetails",
                params: { storeId: store.id },
              })
            }
          >
            {store.imageUrl ? (
              <Image source={{ uri: store.imageUrl }} style={styles.storeImage} />
            ) : (
              <View style={styles.placeholderImage} />
            )}
            <View style={styles.storeInfo}>
              <Text style={styles.storeName} numberOfLines={2}>
                {store.name}
              </Text>
              {store.distance && (
                <Text style={styles.distance}>
                  {store.distance.toFixed(2)} km away
                </Text>
              )}
              {store.description && (
                <Text style={styles.storeDescription} numberOfLines={2}>
                  {store.description}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  scrollContent: {
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
    width: 200,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginRight: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storeImage: {
    width: "100%",
    height: 120,
    backgroundColor: colors.gray100,
  },
  placeholderImage: {
    width: "100%",
    height: 120,
    backgroundColor: colors.gray200,
  },
  storeInfo: {
    padding: spacing.md,
  },
  storeName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  distance: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  storeDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
    lineHeight: typography.lineHeight.normal * typography.fontSize.xs,
  },
});

