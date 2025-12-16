import PromotionCard from "@/components/consumers/PromotionCard";
import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import type { Promotion } from "@/features/store/promotions/types";
import { useStableThunk } from "@/hooks/useStableCallback";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const DEFAULT_BANNER = require("../../assets/images/index3.png");

export default function RetailerDashboard() {
  const { state: { user } } = useLogin();
  const { action: { findActivePromotions, findProducts }, state: { userStore, activePromotions, loading, products } } = useStore();

  // Stable thunk references to prevent unnecessary re-renders
  const stableFindActivePromotions = useStableThunk(findActivePromotions);
  const stableFindProducts = useStableThunk(findProducts);

  // Track last fetched store ID to prevent duplicate fetches
  const lastFetchedStoreIdRef = useRef<number | null>(null);
  const lastFetchedUserIdRef = useRef<number | null>(null);

  // Group promotions by title to show as single promotions with multiple products
  const groupedPromotions = useMemo(() => {
    const groups: { [key: string]: Promotion[] } = {};
    
    activePromotions.forEach(promotion => {
      // Group by title only, since products can have different discounts
      const key = promotion.title;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(promotion);
    });
    
    // Convert groups to array and sort by creation date
    return Object.values(groups).map(group => ({
      ...group[0], // Use first promotion as base
      productIds: group.map(p => p.productId), // Collect all product IDs
      products: group.map(p => p.productId), // For compatibility
      // Store individual product discounts for display
      productDiscounts: group.map(p => ({
        productId: p.productId,
        discount: p.discount,
        type: p.type
      }))
    })).sort((a, b) => {
      const aDate = typeof a.startsAt === 'string' ? new Date(a.startsAt).getTime() : 0;
      const bDate = typeof b.startsAt === 'string' ? new Date(b.startsAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [activePromotions]);

  // Fetch data when user or userStore changes
  useEffect(() => {
    const storeId = userStore?.id;
    const userId = user?.id ? Number(user.id) : null;

    // Skip if we've already fetched for this store/user
    if (storeId && lastFetchedStoreIdRef.current === storeId) {
      return;
    }
    if (userId && !storeId && lastFetchedUserIdRef.current === userId) {
      return;
    }

    // Fetch products and promotions
    if (storeId) {
      lastFetchedStoreIdRef.current = storeId;
      stableFindProducts({ storeId });
      stableFindActivePromotions(storeId);
    } else if (userId) {
      lastFetchedUserIdRef.current = userId;
      stableFindProducts({ storeId: userId });
      stableFindActivePromotions(userId);
    } else {
      // Fallback: fetch all promotions
      stableFindActivePromotions();
    }
  }, [user?.id, userStore?.id, stableFindProducts, stableFindActivePromotions]);

  // Refresh promotions when component comes into focus
  useFocusEffect(
    useCallback(() => {
      const storeId = userStore?.id;
      const userId = user?.id ? Number(user.id) : null;

      if (storeId) {
        stableFindActivePromotions(storeId);
      } else if (userId) {
        stableFindActivePromotions(userId);
      } else {
        stableFindActivePromotions();
      }
    }, [userStore?.id, user?.id, stableFindActivePromotions])
  );

  const getStoreInitial = (storeName: string) => {
    return storeName ? storeName.charAt(0).toUpperCase() : 'S';
  };

  const getStoreName = () => {
    return userStore?.name || 'Your Store';
  };

  const getStoreDescription = () => {
    return userStore?.description || 'Store description coming soon';
  };

  const getStoreBannerSource = () => {
    if (typeof userStore?.bannerUrl === "string" && userStore.bannerUrl.trim().length > 0) {
      return { uri: userStore.bannerUrl };
    }
    return DEFAULT_BANNER;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Store Header */}
      <View style={styles.storeHeader}>
        <ImageBackground
          source={getStoreBannerSource()}
          style={styles.storeBackground}
          imageStyle={styles.backgroundImage}
        >
          <View style={styles.logoOverlay}>
            <View style={styles.storeLogo}>
              {typeof userStore?.imageUrl === 'string' && userStore.imageUrl.length > 0 ? (
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 76, height: 76, borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' }}>
                    <ImageBackground
                      source={require("../../assets/images/partial-react-logo.png")}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <ImageBackground
                        source={{ uri: userStore.imageUrl }}
                        style={{ width: '100%', height: '100%' }}
                        imageStyle={{ resizeMode: 'cover' }}
                      />
                    </ImageBackground>
                  </View>
            
                </View>
              ) : (
                <>
                  <View style={styles.logoIcon}>
                    <Text style={styles.logoText}>{getStoreInitial(getStoreName())}</Text>
                  </View>
                  <Text style={styles.logoLabel}>{getStoreName().toLowerCase()}</Text>
                </>
              )}
            </View>
          </View>
        </ImageBackground>
        
        {/* Store Information Below Banner */}
        <View style={styles.storeInfoSection}>
          <View style={styles.storeHeaderRow}>
            <View style={styles.storeTitleContainer}>
              <Text style={styles.storeName}>{getStoreName()}</Text>
              <Text style={styles.storeCategories}>{getStoreDescription()}</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push("/(retailers)/settings")}
            >
              <Ionicons name="pencil" size={16} color="#277874" />
            </TouchableOpacity>
          </View>
          
          {/* Store Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="cube" size={20} color="#277874" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{products.length || 0}</Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="ticket" size={20} color="#FFBE5D" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{groupedPromotions.length || 0}</Text>
                <Text style={styles.statLabel}>Promotions</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push("/(retailers)/add-product")}
            >
              <Ionicons name="add-circle" size={20} color="#ffffff" />
              <Text style={styles.quickActionText}>Add Product</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionButton, styles.quickActionButtonSecondary]}
              onPress={() => router.push("/(retailers)/products")}
            >
              <Ionicons name="list" size={20} color="#277874" />
              <Text style={[styles.quickActionText, styles.quickActionTextSecondary]}>View Products</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Active Promotions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Promotions</Text>
          <TouchableOpacity 
            style={styles.createPromotionButton}
            onPress={() => router.push("/(retailers)/promotions")}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text style={styles.createPromotionButtonText}>Create</Text>
          </TouchableOpacity>
        </View>
        <View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading promotions...</Text>
            </View>
          ) : groupedPromotions.length > 0 ? (
            groupedPromotions.map((promotion) => (
              <PromotionCard key={`${promotion.title}-${promotion.discount}-${promotion.type}`} promotion={promotion} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="ticket-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No active promotions</Text>
              <Text style={styles.emptySubtext}>Create your first promotion to boost sales!</Text>
              <TouchableOpacity 
                style={styles.emptyActionButton}
                onPress={() => router.push("/(retailers)/promotions")}
              >
                <Text style={styles.emptyActionButtonText}>Create Promotion</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  storeHeader: {
    marginBottom: 15,
    borderRadius: 0,
    position: 'relative',
  },
  storeBackground: {
    height: 200,
    justifyContent: 'flex-end',
  },
  backgroundImage: {
    resizeMode: 'contain',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 20,
  },
  logoOverlay: {
    position: 'absolute',
    bottom: -20,
    left: 20,
    zIndex: 10,
  },
  storeLogo: {
    backgroundColor: "#ffffff",
    padding: 3,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoIcon: {
    width: 60,
    height: 60,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#277874",
  },
  logoLabel: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
  },
  storeInfoSection: {
    backgroundColor: "#f8fafc",
    padding: 20,
    paddingTop: 40,
    paddingBottom: 5,
  },
  storeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  storeTitleContainer: {
    flex: 1,
  },
  storeName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  storeCategories: {
    fontSize: 16,
    color: "#6b7280",
  },
  editButton: {
    backgroundColor: "#ffffff",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  quickActionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: "#277874",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionButtonSecondary: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#277874",
    shadowColor: "#000",
    shadowOpacity: 0.1,
  },
  quickActionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  quickActionTextSecondary: {
    color: "#277874",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  createPromotionButton: {
    backgroundColor: "#FFBE5D",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createPromotionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  emptyContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  emptyActionButton: {
    backgroundColor: "#FFBE5D",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyActionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});