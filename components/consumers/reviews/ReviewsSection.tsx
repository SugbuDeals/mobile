import { useLogin } from "@/features/auth";
import { reviewsApi } from "@/services/api/endpoints/reviews";
import type { ReviewResponseDto, StoreRatingStatsDto } from "@/services/api/types/swagger";
import { borderRadius, colors, spacing } from "@/styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { RatingStats, ReviewCard, ReviewForm } from "./index";

interface ReviewsSectionProps {
  storeId: number;
}

export default function ReviewsSection({ storeId }: ReviewsSectionProps) {
  const { state: authState } = useLogin();
  const currentUserId = authState.user?.id;

  const [ratingStats, setRatingStats] = useState<StoreRatingStatsDto | null>(null);
  const [reviews, setReviews] = useState<ReviewResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [existingReview, setExistingReview] = useState<ReviewResponseDto | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadReviews = async () => {
    try {
      const [statsData, reviewsData] = await Promise.all([
        reviewsApi.getStoreRatingStats(storeId).catch(() => null), // Return null if no stats available
        reviewsApi.getStoreReviews(storeId, { skip: 0, take: 20 }).catch(() => []), // Return empty array on error
      ]);
      // Handle null response when there are no reviews
      setRatingStats(statsData || null);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      
      // Check if current user has a review
      if (currentUserId && Array.isArray(reviewsData)) {
        const userReview = reviewsData.find((r) => r.userId === currentUserId);
        setExistingReview(userReview || null);
      } else {
        setExistingReview(null);
      }
    } catch (error: any) {
      console.error("Failed to load reviews:", error);
      // Don't show alert for public endpoint errors
      if (error?.status !== 401) {
        Alert.alert("Error", "Failed to load reviews");
      }
      // Set defaults on error
      setRatingStats(null);
      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [storeId, currentUserId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReviews();
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    loadReviews();
  };

  const handleUpdateReview = () => {
    if (existingReview) {
      setShowReviewForm(true);
    }
  };

  const handleDeleteReview = () => {
    if (!existingReview) return;

    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete your review?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await reviewsApi.deleteReview(existingReview.id);
              Alert.alert("Success", "Review deleted successfully");
              setExistingReview(null);
              loadReviews();
            } catch (error: any) {
              Alert.alert("Error", error?.message || "Failed to delete review");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Overall Rating Breakdown Section */}
      {ratingStats && (
        <View style={styles.ratingSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="star" size={18} color={colors.secondaryDark} />
              </View>
              <Text style={styles.sectionHeaderTitle}>Overall Rating</Text>
            </View>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {ratingStats.averageRating.toFixed(1)}
              </Text>
              <Ionicons name="star" size={14} color={colors.secondaryDark} />
            </View>
          </View>
          <RatingStats stats={ratingStats} />
        </View>
      )}

      {/* Customer Reviews Section */}
      <View style={styles.reviewsSection}>
        <View style={styles.reviewsHeader}>
          <View>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            {ratingStats && (
              <Text style={styles.reviewsCount}>
                {ratingStats.totalRatings} {ratingStats.totalRatings === 1 ? "review" : "reviews"}
              </Text>
            )}
          </View>
          {currentUserId && !existingReview && (
            <TouchableOpacity
              style={styles.writeButton}
              onPress={() => setShowReviewForm(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={16} color={colors.white} />
              <Text style={styles.writeButtonText}>Write Review</Text>
            </TouchableOpacity>
          )}
        </View>

      {/* User's Review */}
      {existingReview && currentUserId && (
        <View style={styles.myReviewContainer}>
          <View style={styles.myReviewHeader}>
            <Ionicons name="person-circle" size={20} color={colors.primary} />
            <Text style={styles.myReviewLabel}>Your Review</Text>
          </View>
          <ReviewCard
            review={existingReview}
            currentUserId={currentUserId}
            onUpdate={handleUpdateReview}
            onDelete={handleDeleteReview}
          />
        </View>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="chatbubble-outline" size={56} color={colors.gray300} />
          </View>
          <Text style={styles.emptyText}>No reviews yet</Text>
          <Text style={styles.emptySubtext}>
            Be the first to share your experience!
          </Text>
          {currentUserId && !existingReview && (
            <TouchableOpacity
              style={styles.emptyWriteButton}
              onPress={() => setShowReviewForm(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyWriteButtonText}>Write the first review</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={reviews.filter((r) => !existingReview || r.id !== existingReview.id)}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ReviewCard
              review={item}
              currentUserId={currentUserId}
              showReplies={true}
            />
          )}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          scrollEnabled={false}
          contentContainerStyle={styles.reviewsList}
        />
      )}
      </View>

      <ReviewForm
        storeId={storeId}
        visible={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        onSuccess={handleReviewSuccess}
        existingReview={existingReview ? {
          id: existingReview.id,
          rating: existingReview.rating,
          comment: existingReview.comment,
        } : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
  },
  loadingContainer: {
    padding: spacing.xxxl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  ratingSection: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerIconContainer: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.md,
    backgroundColor: colors.secondaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.gray900,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  headerBadgeText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  reviewsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  reviewsCount: {
    fontSize: 13,
    color: colors.gray500,
    fontWeight: "500",
  },
  writeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  writeButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  myReviewContainer: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  myReviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  myReviewLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  reviewsList: {
    gap: spacing.sm,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray700,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray500,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  emptyWriteButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  emptyWriteButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
});
