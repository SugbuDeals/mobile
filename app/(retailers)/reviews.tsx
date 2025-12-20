import { RatingStats, ReviewCard } from "@/components/consumers/reviews";
import { useLogin } from "@/features/auth";
import { useStoreManagement } from "@/features/store";
import { reviewsApi } from "@/services/api/endpoints/reviews";
import type { ReviewResponseDto, StoreRatingStatsDto } from "@/services/api/types/swagger";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function RetailerReviews() {
  const { userStore } = useStoreManagement();
  const { state: authState } = useLogin();
  const currentUserId = authState.user?.id ? Number(authState.user.id) : undefined;
  const storeId = userStore?.id;

  const [ratingStats, setRatingStats] = useState<StoreRatingStatsDto | null>(null);
  const [reviews, setReviews] = useState<ReviewResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReviews = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      const [statsData, reviewsData] = await Promise.all([
        reviewsApi.getStoreRatingStats(storeId).catch(() => null), // Return null if no stats available
        reviewsApi.getStoreReviews(storeId, { skip: 0, take: 50 }).catch(() => []), // Return empty array on error
      ]);
      // Handle null response when there are no reviews
      setRatingStats(statsData || null);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (error: any) {
      console.error("Failed to load reviews:", error);
      Alert.alert("Error", "Failed to load reviews. Please try again.");
      // Set defaults on error
      setRatingStats(null);
      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [storeId])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadReviews();
  };

  if (!storeId) {
    return (
      <ScrollView contentContainerStyle={styles.emptyContainer}>
        <Ionicons name="storefront-outline" size={64} color="#DDD" />
        <Text style={styles.emptyText}>No store found</Text>
        <Text style={styles.emptySubtext}>
          Please create a store to view reviews
        </Text>
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B6F5D" />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      
      {/* Header */}
      <LinearGradient
        colors={["#FFBE5D", "#277874"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="star" size={24} color="#ffffff" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Reviews & Ratings</Text>
              <Text style={styles.headerSubtitle}>View customer feedback</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >

      {ratingStats && (
        <View style={styles.statsContainer}>
          <RatingStats stats={ratingStats} />
        </View>
      )}

      <View style={styles.reviewsHeader}>
        <Text style={styles.reviewsTitle}>
          All Reviews ({reviews.length})
        </Text>
        {ratingStats && (
          <View style={styles.summaryBadge}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.summaryText}>
              {ratingStats.averageRating.toFixed(1)} / 5.0
            </Text>
          </View>
        )}
      </View>

      {reviews.length === 0 ? (
        <View style={styles.emptyReviewsContainer}>
          <Ionicons name="chatbubble-outline" size={64} color="#DDD" />
          <Text style={styles.emptyText}>No reviews yet</Text>
          <Text style={styles.emptySubtext}>
            Reviews from customers will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ReviewCard 
              review={item} 
              currentUserId={currentUserId}
              showReplies={true} 
            />
          )}
          scrollEnabled={false}
          contentContainerStyle={styles.reviewsList}
        />
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomRightRadius: 40,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#277874",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
  },
  statsContainer: {
    marginBottom: 24,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  summaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  reviewsList: {
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#F9FAFB",
  },
  emptyReviewsContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#BBB",
    marginTop: 8,
    textAlign: "center",
  },
});
