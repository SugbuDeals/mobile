import { useLogin } from "@/features/auth";
import { reviewsApi } from "@/services/api/endpoints/reviews";
import type { ReviewResponseDto, StoreRatingStatsDto } from "@/services/api/types/swagger";
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
        <ActivityIndicator size="large" color="#1B6F5D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Ionicons name="star" size={24} color="#FFD700" />
        <Text style={styles.sectionHeaderTitle}>Reviews & Ratings</Text>
      </View>

      {ratingStats && <RatingStats stats={ratingStats} />}

      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Customer Reviews</Text>
        {currentUserId && !existingReview && (
          <TouchableOpacity
            style={styles.writeButton}
            onPress={() => setShowReviewForm(true)}
          >
            <Ionicons name="create-outline" size={18} color="#1B6F5D" />
            <Text style={styles.writeButtonText}>Write Review</Text>
          </TouchableOpacity>
        )}
      </View>

      {existingReview && currentUserId && (
        <View style={styles.myReviewContainer}>
          <Text style={styles.myReviewLabel}>Your Review</Text>
          <ReviewCard
            review={existingReview}
            currentUserId={currentUserId}
            onUpdate={handleUpdateReview}
            onDelete={handleDeleteReview}
          />
        </View>
      )}

      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-outline" size={48} color="#DDD" />
          <Text style={styles.emptyText}>No reviews yet</Text>
          <Text style={styles.emptySubtext}>
            Be the first to review this store!
          </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#E5E7EB",
  },
  sectionHeaderTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  writeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  writeButtonText: {
    color: "#1B6F5D",
    fontSize: 14,
    fontWeight: "600",
  },
  myReviewContainer: {
    marginBottom: 16,
  },
  myReviewLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  reviewsList: {
    gap: 12,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#BBB",
    marginTop: 4,
  },
});
