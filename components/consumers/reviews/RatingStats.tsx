import type { StoreRatingStatsDto } from "@/services/api/types/swagger";
import { borderRadius, colors, spacing } from "@/styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface RatingStatsProps {
  stats: StoreRatingStatsDto;
}

export default function RatingStats({ stats }: RatingStatsProps) {
  const { averageRating, totalRatings, fiveStarCount, fourStarCount, threeStarCount, twoStarCount, oneStarCount } = stats;

  const getStarPercentage = (count: number) => {
    if (totalRatings === 0) return 0;
    return (count / totalRatings) * 100;
  };

  const StarBar = ({ starCount, count, starValue }: { starCount: number; count: number; starValue: number }) => {
    const percentage = getStarPercentage(count);
    
    return (
      <View style={styles.starRow}>
        <View style={styles.starLabel}>
          <Text style={styles.starValue}>{starValue}</Text>
          <Ionicons name="star" size={12} color={colors.secondaryDark} />
        </View>
        <View style={styles.barContainer}>
          <View style={styles.barBackground}>
            <View style={[styles.barFill, { width: `${percentage}%` }]} />
          </View>
        </View>
        <Text style={styles.starCount}>{count}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Overall Rating Display */}
      <View style={styles.overallRating}>
        <View style={styles.ratingCircle}>
          <Text style={styles.ratingNumber}>{averageRating.toFixed(1)}</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= Math.round(averageRating) ? "star" : "star-outline"}
                size={14}
                color={colors.secondaryDark}
              />
            ))}
          </View>
        </View>
        <View style={styles.ratingInfo}>
          <Text style={styles.totalRatings}>{totalRatings} {totalRatings === 1 ? "review" : "reviews"}</Text>
          <Text style={styles.ratingSubtext}>Based on customer feedback</Text>
        </View>
      </View>

      {/* Rating Breakdown */}
      <View style={styles.breakdown}>
        <Text style={styles.breakdownTitle}>Rating Breakdown</Text>
        <View style={styles.starsList}>
          <StarBar starCount={5} count={fiveStarCount} starValue={5} />
          <StarBar starCount={4} count={fourStarCount} starValue={4} />
          <StarBar starCount={3} count={threeStarCount} starValue={3} />
          <StarBar starCount={2} count={twoStarCount} starValue={2} />
          <StarBar starCount={1} count={oneStarCount} starValue={1} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  overallRating: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    marginBottom: spacing.md,
  },
  ratingCircle: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  ratingInfo: {
    flex: 1,
  },
  totalRatings: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  ratingSubtext: {
    fontSize: 13,
    color: colors.gray500,
  },
  breakdown: {
    marginTop: spacing.xs,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray800,
    marginBottom: spacing.sm,
  },
  starsList: {
    gap: spacing.xs,
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  starLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: 45,
  },
  starValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.gray700,
  },
  barContainer: {
    flex: 1,
    height: 6,
  },
  barBackground: {
    height: "100%",
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  starCount: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.gray600,
    minWidth: 28,
    textAlign: "right",
  },
});
