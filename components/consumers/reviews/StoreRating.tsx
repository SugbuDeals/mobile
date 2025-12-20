import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { StoreRatingStatsDto } from "@/services/api/types/swagger";

interface StoreRatingProps {
  ratingStats: StoreRatingStatsDto | null;
  size?: "small" | "medium" | "large";
  showCount?: boolean;
  showStars?: boolean;
}

export default function StoreRating({
  ratingStats,
  size = "medium",
  showCount = true,
  showStars = true,
}: StoreRatingProps) {
  const starSize = size === "small" ? 12 : size === "large" ? 18 : 14;
  const textSize = size === "small" ? 12 : size === "large" ? 16 : 14;

  if (!ratingStats || ratingStats.totalRatings === 0) {
    return (
      <View style={styles.container}>
        {showStars && (
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name="star-outline"
                size={starSize}
                color="#DDD"
              />
            ))}
          </View>
        )}
        {showCount && (
          <Text style={[styles.ratingText, { fontSize: textSize }]}>
            No ratings
          </Text>
        )}
      </View>
    );
  }

  const roundedRating = Math.round(ratingStats.averageRating);

  return (
    <View style={styles.container}>
      {showStars && (
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= roundedRating ? "star" : "star-outline"}
              size={starSize}
              color="#FFD700"
            />
          ))}
        </View>
      )}
      <View style={styles.ratingInfo}>
        <Text style={[styles.ratingText, { fontSize: textSize }]}>
          {ratingStats.averageRating.toFixed(1)}
        </Text>
        {showCount && (
          <Text style={[styles.countText, { fontSize: textSize - 2 }]}>
            ({ratingStats.totalRatings})
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  ratingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontWeight: "600",
    color: "#333",
  },
  countText: {
    color: "#666",
  },
});
