import type { StoreRatingStatsDto } from "@/services/api/types/swagger";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface RatingStatsProps {
  stats: StoreRatingStatsDto;
}

export default function RatingStats({ stats }: RatingStatsProps) {
  const renderStarBar = (starCount: number, total: number) => {
    const percentage = total > 0 ? (starCount / total) * 100 : 0;
    return (
      <View style={styles.starBarContainer}>
        <View style={styles.starBarBackground}>
          <View style={[styles.starBarFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.starBarText}>{starCount}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.ratingDisplay}>
          <Text style={styles.averageRating}>
            {stats.averageRating.toFixed(1)}
          </Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={
                  star <= Math.round(stats.averageRating)
                    ? "star"
                    : "star-outline"
                }
                size={20}
                color="#FFD700"
              />
            ))}
          </View>
          <Text style={styles.totalRatings}>
            {stats.totalRatings} {stats.totalRatings === 1 ? "review" : "reviews"}
          </Text>
        </View>
      </View>

      <View style={styles.breakdown}>
        {[
          { label: "5", count: stats.fiveStarCount },
          { label: "4", count: stats.fourStarCount },
          { label: "3", count: stats.threeStarCount },
          { label: "2", count: stats.twoStarCount },
          { label: "1", count: stats.oneStarCount },
        ]
          .reverse()
          .map(({ label, count }) => (
            <View key={label} style={styles.starRow}>
              <Text style={styles.starLabel}>{label}★</Text>
              {renderStarBar(count, stats.totalRatings)}
            </View>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  header: {
    marginBottom: 16,
  },
  ratingDisplay: {
    alignItems: "center",
  },
  averageRating: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
  },
  totalRatings: {
    fontSize: 14,
    color: "#666",
  },
  breakdown: {
    gap: 8,
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  starLabel: {
    fontSize: 14,
    color: "#666",
    width: 24,
  },
  starBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  starBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
    overflow: "hidden",
  },
  starBarFill: {
    height: "100%",
    backgroundColor: "#FFD700",
  },
  starBarText: {
    fontSize: 12,
    color: "#666",
    minWidth: 30,
    textAlign: "right",
  },
});

