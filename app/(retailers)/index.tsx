import Card from "@/components/Card";
import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
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

const PromotionCard = ({ promotion }: { promotion: any }) => {
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

  const daysLeft = calculateDaysLeft(promotion.endsAt);

  return (
    <TouchableOpacity style={styles.promotionCard}>
      <View style={styles.promotionContent}>
        <View style={styles.promotionHeader}>
          <Text style={styles.promotionTitle}>{promotion.title}</Text>
          <View style={styles.discountTag}>
            <Text style={styles.discountText}>
              {formatDiscount(promotion.type, promotion.discount)}
            </Text>
          </View>
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
      </View>
    </TouchableOpacity>
  );
};

export default function RetailerDashboard() {
  const { state: { user } } = useLogin();
  const { action: { findActivePromotions }, state: { userStore, activePromotions, loading } } = useStore();

  // Debug: Log userStore changes
  React.useEffect(() => {
    console.log("Dashboard - userStore state:", userStore);
  }, [userStore]);

  useEffect(() => {
    // Fetch active promotions
    findActivePromotions();
  }, []);

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
              <View style={styles.logoIcon}>
                <Text style={styles.logoText}>{getStoreInitial(getStoreName())}</Text>
              </View>
              <Text style={styles.logoLabel}>{getStoreName().toLowerCase()}</Text>
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
        <Text style={styles.sectionTitle}>Active Promotions</Text>
        <View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading promotions...</Text>
            </View>
          ) : activePromotions.length > 0 ? (
            activePromotions.map((promotion) => (
              <PromotionCard key={promotion.id} promotion={promotion} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="ticket-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No active promotions</Text>
              <Text style={styles.emptySubtext}>Create your first promotion to boost sales!</Text>
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
    backgroundColor: "#277874",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoIcon: {
    width: 40,
    height: 40,
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
});
