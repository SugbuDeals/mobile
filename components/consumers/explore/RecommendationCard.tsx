import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, borderRadius, typography } from "@/styles/theme";
import type { RecommendationTab } from "./RecommendationTabs";

interface RecommendationItem {
  id?: number;
  name?: string;
  title?: string;
  price?: number | string;
  discount?: number;
  imageUrl?: string;
  storeId?: number;
  store?: { id?: number; name?: string };
  storeName?: string;
  description?: string;
  distance?: number;
}

interface RecommendationCardProps {
  item: RecommendationItem;
  activeTab: RecommendationTab;
  distance?: number;
  onPress?: () => void;
}

const DEFAULT_DISTANCE_KM = 1.3;

export default function RecommendationCard({
  item,
  activeTab,
  distance,
  onPress,
}: RecommendationCardProps) {
  const router = useRouter();
  const displayDistance =
    distance != null && Number.isFinite(distance)
      ? distance
      : DEFAULT_DISTANCE_KM;
  const formattedDistance = `${displayDistance.toFixed(2)} km`;

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    // Only navigate if productId is a valid number
    const validProductId =
      item?.id != null &&
      typeof item.id === "number" &&
      Number.isFinite(item.id) &&
      item.id > 0
        ? item.id
        : undefined;
    
    if (!validProductId) {
      // Don't navigate if productId is invalid
      return;
    }
    
    router.push({
      pathname: "/(consumers)/product",
      params: {
        name: item?.name || item?.title || "",
        storeId: item?.storeId || item?.store?.id || "",
        price: item?.price || "",
        description: item?.description || "",
        productId: validProductId.toString(),
        imageUrl: item?.imageUrl || "",
      },
    });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.storeRow}>
          {item?.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
          ) : (
            <View style={styles.storeLogo}>
              <Ionicons name="bag-outline" size={22} color="#277874" />
            </View>
          )}
          <View style={{ maxWidth: 220 }}>
            <Text style={styles.storeName} numberOfLines={1}>
              {item?.name || item?.title || "Product"}
            </Text>
            <Text style={styles.storeLocation} numberOfLines={1}>
              {item?.store?.name || item?.storeName || "Store"}
              {typeof item?.price !== "undefined" ? ` • ₱${Number(item.price).toFixed(2)}` : ""}
              {formattedDistance ? ` • ${formattedDistance}` : ""}
            </Text>
          </View>
        </View>
        {item?.discount ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{item.discount}% OFF</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        )}
      </View>

      <View style={styles.cardBottomRow}>
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>Product</Text>
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
  },
  discountBadge: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
  },
  discountBadgeText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
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

