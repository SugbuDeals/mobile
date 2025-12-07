import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect } from "react";
import {
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { PromotionCard } from "./components/PromotionCard";

const DEFAULT_BANNER = require("../../assets/images/index3.png");

export default function RetailerDashboard() {
  const { state: { user } } = useLogin();
  const { action: { findActivePromotions, findProducts }, state: { userStore, activePromotions, loading, products } } = useStore();

  // Group promotions by title to show as single promotions with multiple products
  const groupedPromotions = React.useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    
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
    })).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [activePromotions]);

  // Debug: Log userStore changes
  React.useEffect(() => {
    console.log("Dashboard - userStore state:", userStore);
  }, [userStore]);

  // Debug: Log activePromotions changes
  React.useEffect(() => {
    console.log("Dashboard - activePromotions state:", activePromotions);
    console.log("Dashboard - activePromotions length:", activePromotions.length);
    console.log("Dashboard - groupedPromotions:", groupedPromotions);
  }, [activePromotions, groupedPromotions]);

  // Debug: Log products changes
  React.useEffect(() => {
    console.log("Dashboard - products state:", products);
    console.log("Dashboard - products length:", products.length);
  }, [products]);

  useEffect(() => {
    // Fetch active promotions and products
    console.log("Dashboard - Fetching active promotions...");
    
    // Also fetch products so we can show product details in promotions
    if (user && userStore) {
      console.log("Dashboard - Fetching products for store:", userStore.id);
      findProducts({ storeId: userStore.id });
      // Fetch promotions only for this store
      findActivePromotions(userStore.id);
    } else if (user && (user as any).id) {
      console.log("Dashboard - No userStore, trying with user ID:", (user as any).id);
      findProducts({ storeId: Number((user as any).id) });
      // Fetch promotions only for this store
      findActivePromotions(Number((user as any).id));
    } else {
      // If no store info available, fetch all promotions (fallback)
      findActivePromotions();
    }
  }, [user, userStore]);

  // Refresh promotions when component comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("Dashboard - Refreshing promotions on focus...");
      if (userStore) {
        findActivePromotions(userStore.id);
      } else if (user && (user as any).id) {
        findActivePromotions(Number((user as any).id));
      } else {
        findActivePromotions();
      }
    }, [findActivePromotions, userStore, user])
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
          <Text style={styles.storeName}>{getStoreName()}</Text>
          <Text style={styles.storeCategories}>{getStoreDescription()}</Text>
          <View style={styles.storeStatus}>
            <View style={styles.openButton}>
              <Text style={styles.openButtonText}>Open Now</Text>
            </View>
            <View style={styles.closingButton}>
              <Text style={styles.closingButtonText}>Closes at 9:00 PM</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push("/(retailers)/settings")}
            >
              <Ionicons name="pencil" size={16} color="#277874" />
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
              <PromotionCard key={`${promotion.title}-${promotion.discount}-${promotion.type}`} promotion={promotion} activePromotions={activePromotions} />
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
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 20,
  },
  logoOverlay: {
    position: 'absolute',
    bottom: -35,
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
  storeName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  storeCategories: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 16,
  },
  storeStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  openButton: {
    backgroundColor: "#277874",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  openButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  closingButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  closingButtonText: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 14,
  },
  editButton: {
    backgroundColor: "#ffffff",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
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