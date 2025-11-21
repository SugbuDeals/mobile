import Card from "@/components/Card";
import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width } = Dimensions.get("window");

// Mock data for weekly views (this would come from analytics API in the future)
const weeklyData = [
  { day: "Mon", views: 120 },
  { day: "Tue", views: 180 },
  { day: "Wed", views: 90 },
  { day: "Thu", views: 280 },
  { day: "Fri", views: 150 },
  { day: "Sat", views: 80 },
  { day: "Sun", views: 200 },
];

const BarChart = ({ data }: { data: typeof weeklyData }) => {
  const maxViews = Math.max(...data.map(d => d.views));
  
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Weekly Store Views</Text>
      <View style={styles.chart}>
        {data.map((item, index) => (
          <View key={index} style={styles.barContainer}>
            <View
              style={[
                styles.bar,
                {
                  height: (item.views / maxViews) * 100,
                  backgroundColor: index === 3 ? "#FFD700" : "#277874", // Thursday is highlighted
                },
              ]}
            />
            <Text style={styles.barLabel}>{item.day}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const ViewsTodayCard = () => (
  <Card style={styles.viewsTodayCard}>
    <View style={styles.viewsTodayContent}>
      <Ionicons name="eye" size={24} color="#277874" />
      <Text style={styles.viewsTodayLabel}>Views Today</Text>
      <Text style={styles.viewsTodayNumber}>245</Text>
    </View>
  </Card>
);

const PromotionCard = ({ promotion, activePromotions }: { promotion: any; activePromotions: any[] }) => {
  const { action: { updatePromotion, deletePromotion, findProducts, findProductById }, state: { products } } = useStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [promotionProducts, setPromotionProducts] = useState<any[]>([]);

  // Find all products associated with this promotion
  React.useEffect(() => {
    console.log("PromotionCard - Looking for products with IDs:", promotion.productIds || promotion.productId);
    console.log("PromotionCard - Available products:", products);
    
    const productIds = promotion.productIds || [promotion.productId];
    
    if (productIds.length > 0 && products.length > 0) {
      const foundProducts = productIds.map((id: number) => 
        products.find(p => p.id === id)
      ).filter(Boolean); // Remove undefined products
      
      console.log("PromotionCard - Found products:", foundProducts);
      setPromotionProducts(foundProducts);
      
      // If some products are missing, try to fetch them
      const missingIds = productIds.filter((id: number) => !products.find(p => p.id === id));
      if (missingIds.length > 0) {
        console.log("PromotionCard - Missing products, fetching:", missingIds);
        missingIds.forEach((id: number) => findProductById(id));
      }
    } else if (productIds.length > 0 && products.length === 0) {
      console.log("PromotionCard - No products loaded yet, productIds:", productIds);
    }
  }, [promotion.productIds, promotion.productId, products]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDaysLeft = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatDiscount = (type: string, discount: number) => {
    if (type === 'percentage') {
      return `${discount}% OFF`;
    } else if (type === 'fixed') {
      return `$${discount} OFF`;
    }
    return `${discount}% OFF`;
  };

  const calculateDiscountedPrice = (originalPrice: number, type: string, discount: number) => {
    if (type === 'percentage') {
      return originalPrice * (1 - discount / 100);
    } else if (type === 'fixed') {
      return Math.max(0, originalPrice - discount);
    }
    return originalPrice;
  };

  const handleToggleActive = async () => {
    setIsUpdating(true);
    try {
      // Update all related promotions
      const productIds: number[] = promotion.productIds || [promotion.productId];
      const promises = productIds.map((productId: number) => {
        // Find the original promotion for this product
        const originalPromotion = activePromotions.find(p => p.productId === productId);
        if (originalPromotion) {
          return updatePromotion({
            id: originalPromotion.id,
            active: !originalPromotion.active
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(promises);
    } catch (error) {
      console.error("Error updating promotion:", error);
      Alert.alert("Error", "Failed to update promotion");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Promotion",
      "Are you sure you want to delete this promotion? This will remove it from all affected products.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsUpdating(true);
            try {
              // Delete all related promotions
              const productIds: number[] = promotion.productIds || [promotion.productId];
              const promises = productIds.map((productId: number) => {
                // Find the original promotion for this product
                const originalPromotion = activePromotions.find(p => p.productId === productId);
                if (originalPromotion) {
                  return deletePromotion(originalPromotion.id);
                }
                return Promise.resolve();
              });
              
              await Promise.all(promises);
            } catch (error) {
              console.error("Error deleting promotion:", error);
              Alert.alert("Error", "Failed to delete promotion");
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const daysLeft = calculateDaysLeft(promotion.endsAt);

  const handlePromotionClick = () => {
    setShowProductDetails(!showProductDetails);
  };

  return (
    <TouchableOpacity style={styles.promotionCard} onPress={handlePromotionClick}>
      <View style={styles.promotionContent}>
        <View style={styles.promotionHeader}>
          <Text style={styles.promotionTitle}>{promotion.title}</Text>
        </View>
        
        <Text style={styles.promotionDescription}>{promotion.description}</Text>
        
        <View style={styles.promotionDates}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={14} color="#6b7280" />
            <Text style={styles.dateText}>Starts: {formatDate(promotion.startsAt)}</Text>
          </View>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={14} color="#6b7280" />
            <Text style={styles.dateText}>Ends: {formatDate(promotion.endsAt)}</Text>
          </View>
        </View>
        
        <View style={styles.promotionFooter}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: promotion.active ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>
              {promotion.active ? 'Active' : 'Inactive'}
            </Text>
          </View>
          {daysLeft > 0 && (
            <Text style={styles.daysLeft}>
              {daysLeft} days left
            </Text>
          )}
        </View>

        {/* Product Details - shown when clicked */}
        {showProductDetails && (
          <View style={styles.productDetailsSection}>
            <View style={styles.productDetailsHeader}>
              <Ionicons name="cube-outline" size={20} color="#277874" />
              <Text style={styles.productDetailsTitle}>
                Affected Products ({promotionProducts.length})
              </Text>
            </View>
            <View style={styles.productDetailsContent}>
              {promotionProducts.length > 0 ? (
                promotionProducts.map((product, index) => {
                  // Find the specific discount for this product
                  const productDiscount = promotion.productDiscounts?.find((pd: {productId: number, discount: number, type: string}) => pd.productId === product.id) || 
                                        { discount: promotion.discount, type: promotion.type };
                  
                  return (
                    <View key={product.id} style={styles.productItem}>
                      <Text style={styles.productDetailsName}>{product.name}</Text>
                      <Text style={styles.productDetailsDescription}>{product.description}</Text>
                      <View style={styles.productDetailsFooter}>
                        <View style={styles.priceContainer}>
                          <Text style={styles.productDetailsPrice}>${product.price}</Text>
                          <Text style={styles.productDetailsDiscountedPrice}>
                            ${calculateDiscountedPrice(product.price, productDiscount.type, productDiscount.discount).toFixed(2)}
                          </Text>
                          <Text style={styles.productDiscountInfo}>
                            ({productDiscount.type === 'percentage' ? `${productDiscount.discount}%` : `$${productDiscount.discount}`} off)
                          </Text>
                        </View>
                        <Text style={styles.productDetailsStock}>Stock: {product.stock}</Text>
                      </View>
                      {index < promotionProducts.length - 1 && (
                        <View style={styles.productSeparator} />
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading product details...</Text>
                  <Text style={styles.loadingSubtext}>
                    Product IDs: {(promotion.productIds || [promotion.productId]).join(', ')}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Show discount summary when expanded */}
            <View style={styles.discountSummary}>
              <Text style={styles.discountSummaryText}>
                Individual discounts applied to selected products
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.promotionActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.toggleButton]}
            onPress={handleToggleActive}
            disabled={isUpdating}
          >
            <Ionicons 
              name={promotion.active ? "pause" : "play"} 
              size={16} 
              color="#ffffff" 
            />
            <Text style={styles.actionButtonText}>
              {isUpdating ? "Updating..." : (promotion.active ? "Pause" : "Activate")}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
            disabled={isUpdating}
          >
            <Ionicons name="trash" size={16} color="#ffffff" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Store Header */}
      <View style={styles.storeHeader}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80' }}
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

      {/* Weekly Store Views */}
      <View style={styles.section}>
        <View style={styles.weeklyViewsContainer}>
          <BarChart data={weeklyData} />
          <ViewsTodayCard />
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
  weeklyViewsContainer: {
    position: 'relative',
  },
  chartContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 50,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  barContainer: {
    alignItems: "center",
    flex: 1,
  },
  bar: {
    width: 20,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  viewsTodayCard: {
    position: 'absolute',
    top: -1,
    right: -1 ,
    width: 100,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 10,
  },
  viewsTodayContent: {
    alignItems: "center",
  },
  viewsTodayLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
    marginBottom: 4,
  },
  viewsTodayNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  promotionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: "100%",
    alignSelf: "center",
  },
  promotionContent: {
    flex: 1,
  },
  promotionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    flex: 1,
    marginRight: 12,
  },
  discountTag: {
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  discountText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  discountSummary: {
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#10B981",
  },
  discountSummaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },
  promotionDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 16,
  },
  promotionDates: {
    marginBottom: 16,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  dateText: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 8,
  },
  promotionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  daysLeft: {
    fontSize: 13,
    color: "#f59e0b",
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
  promotionActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  toggleButton: {
    backgroundColor: "#277874",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  productDetailsSection: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  productDetailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  productDetailsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#277874",
    marginLeft: 8,
  },
  productDetailsContent: {
    flex: 1,
  },
  productDetailsName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  productDetailsDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  productDetailsFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  productDetailsPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  productDetailsDiscountedPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10B981",
  },
  productDiscountInfo: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    fontStyle: "italic",
  },
  productDetailsStock: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  loadingSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  productItem: {
    marginBottom: 12,
  },
  productSeparator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
});