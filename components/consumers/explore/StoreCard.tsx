import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, borderRadius, typography, shadows } from "@/styles/theme";
import type { StoreRecommendationItemDto, StoreRatingStatsDto } from "@/services/api/types/swagger";
import StoreRating from "@/components/consumers/reviews/StoreRating";

interface StoreCardProps {
  store: StoreRecommendationItemDto;
  onPress?: () => void;
  ratingStats?: StoreRatingStatsDto | null;
}

const DEFAULT_DISTANCE_KM = 1.3;

export default function StoreCard({ store, onPress, ratingStats }: StoreCardProps) {
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
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Store: ${store.name}`}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.storeRow}>
          {store.imageUrl ? (
            <Image source={{ uri: store.imageUrl }} style={styles.thumbnail} />
          ) : (
            <View style={styles.storeLogo}>
              <Ionicons name="storefront-outline" size={22} color="#277874" />
            </View>
          )}
          <View style={{ maxWidth: 220, flex: 1 }}>
            <Text style={styles.storeName} numberOfLines={1}>
              {store.name}
            </Text>
            <Text style={styles.storeLocation} numberOfLines={2}>
              {store.description || "Store"}
              {formattedDistance ? ` • ${formattedDistance}` : ""}
            </Text>
            {ratingStats !== undefined && (
              <View style={styles.ratingContainer}>
                <StoreRating ratingStats={ratingStats} size="small" showCount={true} />
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      </View>

      <View style={styles.cardBottomRow}>
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>Store</Text>
        </View>
        <View style={styles.spacer} />
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handlePress}
        >
          <Ionicons name="arrow-forward-circle" size={20} color="#277874" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  thumbnail: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  storeLogo: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  storeName: {
    fontWeight: "700",
    fontSize: 16,
    maxWidth: 200,
  },
  storeLocation: {
    color: "#6B7280",
    fontSize: 13,
    textTransform: "capitalize",
    marginTop: 2,
  },
  ratingContainer: {
    marginTop: 6,
  },
  cardBottomRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  activePill: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  activePillText: {
    color: "#1B6F5D",
    fontWeight: "600",
    fontSize: 12,
  },
  spacer: {
    flex: 1,
  },
  actionButton: {
    padding: 8,
  },
});

