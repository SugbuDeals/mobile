import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, borderRadius, typography, shadows } from "@/styles/theme";
import type { StoreRecommendationItemDto } from "@/services/api/types/swagger";

interface StoreCardProps {
  store: StoreRecommendationItemDto;
  onPress?: () => void;
}

const DEFAULT_DISTANCE_KM = 1.3;

export default function StoreCard({ store, onPress }: StoreCardProps) {
  const router = useRouter();
  
  const displayDistance =
    store.distance != null && Number.isFinite(store.distance)
      ? store.distance
      : DEFAULT_DISTANCE_KM;
  const formattedDistance = `${displayDistance.toFixed(1)} km`;

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    
    if (store.id) {
      router.push({
        pathname: "/(consumers)/storedetails",
        params: {
          store: store.name,
          storeId: store.id.toString(),
        },
      });
    }
  };

  const locationText = [store.address, store.city]
    .filter(Boolean)
    .join(", ") || "Location available";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Store: ${store.name}`}
    >
      <View style={styles.cardContent}>
        {/* Store Image */}
        <View style={styles.imageContainer}>
          {store.imageUrl ? (
            <Image source={{ uri: store.imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="storefront-outline" size={32} color={colors.gray400} />
            </View>
          )}
        </View>

        {/* Store Info */}
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.storeName} numberOfLines={2}>
              {store.name}
            </Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.success} />
            </View>
          </View>

          {store.description && (
            <Text style={styles.description} numberOfLines={2}>
              {store.description}
            </Text>
          )}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={styles.metaText}>{formattedDistance}</Text>
            </View>
            {locationText && locationText !== "Location available" && (
              <View style={styles.metaItem}>
                <Ionicons name="map-outline" size={14} color={colors.gray500} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {locationText}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.viewButton}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel="View store details"
          >
            <Text style={styles.viewButtonText}>View Store</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.md,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    backgroundColor: colors.gray100,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.gray100,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  storeName: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    lineHeight: 22,
  },
  verifiedBadge: {
    padding: 4,
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.sm,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    color: colors.primaryDark,
    fontWeight: typography.fontWeight.medium,
  },
  locationText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    flex: 1,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  viewButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});

