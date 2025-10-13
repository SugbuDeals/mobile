import Card from "@/components/Card";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
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

// Mock data for the dashboard
const weeklyData = [
  { day: "Mon", views: 120 },
  { day: "Tue", views: 180 },
  { day: "Wed", views: 90 },
  { day: "Thu", views: 280 },
  { day: "Fri", views: 150 },
  { day: "Sat", views: 80 },
  { day: "Sun", views: 200 },
];

const activePromotions = [
  {
    id: 1,
    name: "Pilot Frixion Erasable Pen",
    discount: "40% OFF",
    daysLeft: 3,
    views: 178,
    image: "🖊️", // Using emoji as placeholder
  },
  {
    id: 2,
    name: "Spiral Notebooks",
    discount: "25% OFF",
    daysLeft: 5,
    views: 145,
    image: "📓", // Using emoji as placeholder
  },
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

const PromotionCard = ({ promotion }: { promotion: typeof activePromotions[0] }) => (
  <Card style={styles.promotionCard}>
    <View style={styles.promotionContent}>
      <View style={styles.promotionImage}>
        <Text style={styles.promotionEmoji}>{promotion.image}</Text>
      </View>
      <View style={styles.promotionInfo}>
        <View style={styles.promotionHeader}>
          <View style={styles.discountTag}>
            <Text style={styles.discountText}>{promotion.discount}</Text>
          </View>
          <Text style={styles.daysLeft}>Ends in {promotion.daysLeft} days</Text>
        </View>
        <Text style={styles.promotionName}>{promotion.name}</Text>
        <View style={styles.promotionViews}>
          <Ionicons name="eye" size={16} color="#6b7280" />
          <Text style={styles.viewsText}>{promotion.views} Views</Text>
        </View>
      </View>
    </View>
  </Card>
);

export default function RetailerDashboard() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Store Header */}
      <View style={styles.storeHeader}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80' }}
          style={styles.storeBackground}
          imageStyle={styles.backgroundImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
            style={styles.overlay}
          >
            <View style={styles.logoOverlay}>
              <View style={styles.storeLogo}>
                <Ionicons name="storefront" size={24} color="#277874" />
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
        
        {/* Store Information Below Banner */}
        <View style={styles.storeInfoSection}>
          <Text style={styles.storeName}>QuickMart</Text>
          <Text style={styles.storeCategories}>Stationary, Groceries, Home</Text>
          <View style={styles.storeStatus}>
            <View style={styles.openButton}>
              <Text style={styles.openButtonText}>Open Now</Text>
            </View>
            <View style={styles.closingButton}>
              <Text style={styles.closingButtonText}>Closes at 9:00 PM</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
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
        <View style={styles.promotionsContainer}>
          {activePromotions.map((promotion) => (
            <PromotionCard key={promotion.id} promotion={promotion} />
          ))}
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
    bottom: -25,
    left: 20,
    zIndex: 10,
  },
  storeLogo: {
    width: 60,
    height: 60,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  storeInfoSection: {
    backgroundColor: "#f8fafc",
    padding: 20,
    paddingTop: 40,
    paddingBottom: 20,
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
    backgroundColor: "#16a34a",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
    borderRadius: 20,
  },
  closingButtonText: {
    color: "#16a34a",
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
    marginBottom: 15,
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
    top: -5,
    right: -5,
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
  promotionsContainer: {
    gap: 5,
  },
  promotionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  promotionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  promotionImage: {
    width: 50,
    height: 50,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  promotionEmoji: {
    fontSize: 24,
  },
  promotionInfo: {
    flex: 1,
  },
  promotionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  discountTag: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16a34a",
  },
  daysLeft: {
    fontSize: 12,
    color: "#f59e0b",
    fontWeight: "500",
  },
  promotionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  promotionViews: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewsText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
});
