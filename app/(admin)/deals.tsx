import { useCatalog } from "@/features/catalog";
import { useStore } from "@/features/store";
import type { Product } from "@/features/store/products/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Svg, { Path } from "react-native-svg";

const { width } = Dimensions.get("window");

// Color palette for categories
const categoryColors = [
  "#277874", "#FFBE5D", "#8B5CF6", "#F87171", "#60A5FA", 
  "#F59E0B", "#1E40AF", "#10B981", "#EF4444", "#06B6D4"
];

// SVG Pie Chart Component
const SimpleChart = ({ categories }: { categories: Array<{ name: string; percentage: number; color: string }> }) => {
  const size = 120;
  const radius = size / 2;
  const centerX = radius;
  const centerY = radius;
  const innerRadius = 30;
  const outerRadius = 60;
  
  let cumulativeFraction = 0;
  
  const createArcPath = (startAngle: number, endAngle: number, innerR: number, outerR: number) => {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + innerR * Math.cos(startAngleRad);
    const y1 = centerY + innerR * Math.sin(startAngleRad);
    const x2 = centerX + outerR * Math.cos(startAngleRad);
    const y2 = centerY + outerR * Math.sin(startAngleRad);
    const x3 = centerX + outerR * Math.cos(endAngleRad);
    const y3 = centerY + outerR * Math.sin(endAngleRad);
    const x4 = centerX + innerR * Math.cos(endAngleRad);
    const y4 = centerY + innerR * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return [
      `M ${x1} ${y1}`,
      `L ${x2} ${y2}`,
      `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x3} ${y3}`,
      `L ${x4} ${y4}`,
      `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x1} ${y1}`,
      'Z'
    ].join(' ');
  };

  return (
    <View style={styles.chartVisual}>
      <Svg width={size} height={size}>
        {categories.map((category, index) => {
          const segmentFraction = Math.max(0, Math.min(1, category.percentage / 100));
          const startAngle = (cumulativeFraction * 360) - 90;
          const endAngle = ((cumulativeFraction + segmentFraction) * 360) - 90;
          
          const pathData = createArcPath(startAngle, endAngle, innerRadius, outerRadius);
          cumulativeFraction += segmentFraction;
          
          return (
            <Path
              key={index}
              d={pathData}
              fill={category.color}
            />
          );
        })}
      </Svg>
      <View style={styles.chartCenter}>
        <Text style={styles.chartCenterText}>100%</Text>
      </View>
    </View>
  );
};

// Metrics Cards Component
const MetricsCard = ({ label, value, icon, color, bgColor }: {
  label: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
}) => (
  <View style={styles.metricCard}>
    <View style={styles.metricHeader}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={[styles.metricIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={color} />
      </View>
    </View>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
  </View>
);

export default function DealsAnalytics() {
  const { state: storeState, action: storeActions } = useStore();
  const { state: catalogState, action: catalogActions } = useCatalog();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [promotionStatusLoading, setPromotionStatusLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Fetch promotions, products, and categories data
    storeActions.findPromotions();
    storeActions.findProducts();
    catalogActions.loadCategories();
    
    // Set loading to false after a short delay
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    const totalDeals = storeState.promotions.length;
    const activeDeals = storeState.promotions.filter(promotion => promotion.active).length;
    const inactiveDeals = totalDeals - activeDeals;
    
    // Calculate average discount
    const totalDiscount = storeState.promotions.reduce((sum, promotion) => {
      return sum + (promotion.discount || 0);
    }, 0);
    const averageDiscount = totalDeals > 0 ? (totalDiscount / totalDeals).toFixed(1) : "0.0";
    
    // Calculate discount types
    const percentageDeals = storeState.promotions.filter(p => p.type === "percentage").length;
    const fixedDeals = storeState.promotions.filter(p => p.type === "fixed").length;
    
    // Calculate deals by date (last 7 days, last 30 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Use startsAt as proxy for creation date (PromotionResponseDto doesn't have createdAt)
    const dealsLast7Days = storeState.promotions.filter(p => {
      const created = new Date(p.startsAt || 0);
      return created >= sevenDaysAgo;
    }).length;
    
    const dealsLast30Days = storeState.promotions.filter(p => {
      const created = new Date(p.startsAt || 0);
      return created >= thirtyDaysAgo;
    }).length;
    
    return {
      totalDeals,
      activeDeals,
      inactiveDeals,
      averageDiscount,
      percentageDeals,
      fixedDeals,
      dealsLast7Days,
      dealsLast30Days,
    };
  }, [storeState.promotions]);

  const handleTogglePromotionActive = async (promotionId: number, nextValue: boolean) => {
    setPromotionStatusLoading((prev) => ({ ...prev, [promotionId]: true }));
    try {
      await storeActions.updatePromotion({ id: promotionId, active: nextValue }).unwrap();
      Alert.alert("Success", `Promotion has been ${nextValue ? "enabled" : "disabled"}.`);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update promotion status.");
    } finally {
      setPromotionStatusLoading((prev) => ({ ...prev, [promotionId]: false }));
    }
  };

  // Calculate category distribution from real data
  const calculateCategoryDistribution = () => {
    if (!storeState.products.length || !catalogState.categories.length) {
      return [];
    }

    // Count products by category
    const categoryCounts = new Map<number, number>();
    storeState.products.forEach((product: Product) => {
      const rawCategoryId = product.categoryId;
      if (rawCategoryId === null || rawCategoryId === undefined) {
        return;
      }

      const categoryId = Number(rawCategoryId);
      categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + 1);
    });

    const totalProductsWithCategories = Array.from(categoryCounts.values()).reduce((sum, count) => sum + count, 0);

    if (totalProductsWithCategories === 0) {
      return [];
    }

    return Array.from(categoryCounts.entries())
      .map(([categoryId, count], index) => {
        const category = catalogState.categories.find((cat) => String(cat.id) === String(categoryId));
        const percentage = (count / totalProductsWithCategories) * 100;

        return {
          name: category?.name || `Category ${categoryId}`,
          percentage: Math.round(percentage * 10) / 10,
          color: categoryColors[index % categoryColors.length],
          count,
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  };

  const categoryDistribution = calculateCategoryDistribution();


  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#277874" />
        <Text style={styles.loadingText}>Loading deals analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Key Metrics Cards */}
        <View style={styles.metricsSection}>
          <View style={styles.metricsGrid}>
            <MetricsCard
              label="Total Deals"
              value={metrics.totalDeals.toLocaleString()}
              icon="flame"
              color="#277874"
              bgColor="#e0f2f1"
            />
            <MetricsCard
              label="Active Deals"
              value={metrics.activeDeals.toLocaleString()}
              icon="pricetag"
              color="#FFBE5D"
              bgColor="#fef3c7"
            />
            <MetricsCard
              label="Inactive Deals"
              value={metrics.inactiveDeals.toLocaleString()}
              icon="pause-circle"
              color="#6B7280"
              bgColor="#F3F4F6"
            />
            <MetricsCard
              label="Avg Discount"
              value={`${metrics.averageDiscount}%`}
              icon="trending-up"
              color="#10B981"
              bgColor="#D1FAE5"
            />
          </View>
        </View>

        {/* Additional Analytics */}
        <View style={styles.analyticsSection}>
          <Text style={styles.sectionTitle}>Deal Statistics</Text>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsCard}>
              <Ionicons name="stats-chart-outline" size={24} color="#3B82F6" />
              <Text style={styles.analyticsValue}>{metrics.percentageDeals}</Text>
              <Text style={styles.analyticsLabel}>Percentage Deals</Text>
            </View>
            <View style={styles.analyticsCard}>
              <Ionicons name="cash" size={24} color="#F59E0B" />
              <Text style={styles.analyticsValue}>{metrics.fixedDeals}</Text>
              <Text style={styles.analyticsLabel}>Fixed Amount Deals</Text>
            </View>
            <View style={styles.analyticsCard}>
              <Ionicons name="calendar" size={24} color="#10B981" />
              <Text style={styles.analyticsValue}>{metrics.dealsLast7Days}</Text>
              <Text style={styles.analyticsLabel}>Last 7 Days</Text>
            </View>
            <View style={styles.analyticsCard}>
              <Ionicons name="time" size={24} color="#8B5CF6" />
              <Text style={styles.analyticsValue}>{metrics.dealsLast30Days}</Text>
              <Text style={styles.analyticsLabel}>Last 30 Days</Text>
            </View>
          </View>
        </View>
        
        {/* Deal Categories Distribution Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deal Categories Distribution</Text>
          
          <View style={styles.chartContainer}>
            <View style={styles.chartLabels}>
              <Text style={styles.chartLabel}>Pie Graph</Text>
              <Text style={styles.chartLabel}>Categories</Text>
            </View>
            
            <View style={styles.chartContent}>
              <View style={styles.chartVisual}>
                <SimpleChart categories={categoryDistribution} />
              </View>
              
              <View style={styles.legendContainer}>
                {categoryDistribution.length > 0 ? (
                  categoryDistribution.map((category, index) => (
                    <View key={index} style={styles.legendItem}>
                      <View style={[styles.legendBullet, { backgroundColor: category.color }]} />
                      <Text style={styles.legendText}>
                        {category.name} ({category.percentage}%)
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No category data available</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Categories will appear here once products are assigned to categories
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push("/(admin)/categories")}>
        <Text style={styles.manageText}>Manage Categories</Text>
        </TouchableOpacity>
        </View>
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  // ===== METRICS SECTION =====
  metricsSection: {
    marginBottom: 24,
    marginTop: 20,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  fullWidthCard: {
    width: "100%",
    marginBottom: 0,
  },
  fullWidthMetricCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  metricCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  metricValue: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1F2937",
  },
  
  // ===== DEAL CATEGORIES SECTION =====
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#277874",
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  chartLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  chartContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chartVisual: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  chartCenterText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1F2937",
  },
  chartCenter: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendContainer: {
    flex: 1,
    marginLeft: 0,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendBullet: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    position: "relative",
    top: -15,
    right: -15,
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  manageText: {
    fontSize: 16,
    padding: 15,
    width: "100%",
    marginVertical: 10,
    color: "white",
    borderRadius: 15,
    textAlign: "center",
    backgroundColor: "rgb(2, 101, 75)",
  },

  // ===== LOADING STYLES =====
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#277874",
  },

  // ===== EMPTY STATE STYLES =====
  emptyState: {
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },

  // ===== ANALYTICS SECTION =====
  analyticsSection: {
    marginBottom: 20,
  },
  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  analyticsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
    alignItems: "center",
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#277874",
    marginTop: 8,
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  
});
