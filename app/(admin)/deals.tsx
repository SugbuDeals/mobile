import { useCatalog } from "@/features/catalog";
import { useStore } from "@/features/store";
import type { Product } from "@/features/store/products/types";
import type { DealType } from "@/services/api/types/swagger";
import { DEAL_TYPES, getDealTypeLabel } from "@/utils/dealTypes";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
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
const SimpleChart = ({ 
  categories, 
  onPress 
}: { 
  categories: { name: string; percentage: number; color: string; count?: number }[];
  onPress?: () => void;
}) => {
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
    <TouchableOpacity 
      style={styles.chartVisual} 
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
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
        <Text style={styles.chartCenterText}>
          {categories.length > 0 
            ? `${categories.reduce((sum, cat) => sum + cat.percentage, 0).toFixed(0)}%`
            : "0%"}
        </Text>
      </View>
    </TouchableOpacity>
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
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={color} />
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
  const [showDealTypeModal, setShowDealTypeModal] = useState(false);

  useEffect(() => {
    // Fetch promotions, products, and categories data
    storeActions.findPromotions();
    storeActions.findProducts();
    catalogActions.loadCategories();
    
    // Set loading to false after a short delay
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    const totalDeals = storeState.promotions.length;
    const activeDeals = storeState.promotions.filter(promotion => promotion.active).length;
    const inactiveDeals = totalDeals - activeDeals;
    
    // Calculate average discount (for backward compatibility, use discount or calculate from dealType)
    const totalDiscount = storeState.promotions.reduce((sum, promotion: any) => {
      // Try to get discount from dealType-specific fields
      if (promotion.dealType === "PERCENTAGE_DISCOUNT" && promotion.percentageOff) {
        return sum + promotion.percentageOff;
      } else if (promotion.dealType === "FIXED_DISCOUNT" && promotion.fixedAmountOff) {
        // For fixed discount, convert to percentage approximation (not perfect, but works)
        return sum + 10; // Approximate
      } else if (promotion.discount) {
        return sum + promotion.discount;
      }
      return sum;
    }, 0);
    const averageDiscount = totalDeals > 0 ? (totalDiscount / totalDeals).toFixed(1) : "0.0";
    
    // Calculate deals by type - handle both new dealType and legacy type field
    const dealsByType: Record<DealType, number> = {} as Record<DealType, number>;
    DEAL_TYPES.forEach((deal) => {
      dealsByType[deal.value] = 0;
    });
    
    storeState.promotions.forEach((promotion: any) => {
      // Check new dealType field first
      let dealType = promotion.dealType as DealType;
      
      // Fallback for legacy promotions
      if (!dealType && promotion.type) {
        dealType = promotion.type === "percentage" || promotion.type === "PERCENTAGE"
          ? "PERCENTAGE_DISCOUNT"
          : "FIXED_DISCOUNT";
      }
      
      if (dealType && dealsByType[dealType] !== undefined) {
        dealsByType[dealType] = (dealsByType[dealType] || 0) + 1;
      }
    });
    
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
      dealsByType,
      dealsLast7Days,
      dealsLast30Days,
    };
  }, [storeState.promotions]);


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

  // Calculate deal type distribution for pie chart
  const calculateDealTypeDistribution = () => {
    const totalDealsWithTypes = Object.values(metrics.dealsByType).reduce((sum, count) => sum + count, 0);
    
    if (totalDealsWithTypes === 0) {
      return [];
    }

    // Deal type colors matching the analytics page
    const dealTypeColors: Record<DealType, string> = {
      PERCENTAGE_DISCOUNT: "#FF6B6B", // Red
      FIXED_DISCOUNT: "#4ECDC4", // Teal
      BOGO: "#FFBE5D", // Orange
      BUNDLE: "#95E1D3", // Mint
      QUANTITY_DISCOUNT: "#F38181", // Pink
      VOUCHER: "#AA96DA", // Purple
    };

    return DEAL_TYPES
      .map((deal) => {
        const count = metrics.dealsByType[deal.value] || 0;
        if (count === 0) return null;
        
        const percentage = (count / totalDealsWithTypes) * 100;
        return {
          name: getDealTypeLabel(deal.value),
          percentage: Math.round(percentage * 10) / 10,
          color: dealTypeColors[deal.value] || categoryColors[0],
          count,
        };
      })
      .filter((item): item is { name: string; percentage: number; color: string; count: number } => item !== null)
      .sort((a, b) => b.percentage - a.percentage);
  };

  const dealTypeDistribution = calculateDealTypeDistribution();


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

        {/* Deal Type Distribution Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deal Type Distribution</Text>
          
          <View style={styles.chartContainer}>
            <View style={styles.chartLabels}>
              <Text style={styles.chartLabel}>Pie Graph</Text>
              <Text style={styles.chartLabel}>Deal Types</Text>
            </View>
            
            <View style={styles.chartContent}>
              <View style={styles.chartVisual}>
                <SimpleChart 
                  categories={dealTypeDistribution} 
                  onPress={() => setShowDealTypeModal(true)}
                />
              </View>
              
              <View style={styles.legendContainer}>
                {dealTypeDistribution.length > 0 ? (
                  dealTypeDistribution.map((dealType, index) => (
                    <View key={index} style={styles.legendItem}>
                      <View style={[styles.legendBullet, { backgroundColor: dealType.color }]} />
                      <Text 
                        style={styles.legendText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {dealType.name} ({dealType.percentage}% - {dealType.count})
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No deal type data available</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Deal types will appear here once you create promotions
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Time-based Statistics */}
        <View style={styles.analyticsSection}>
          <Text style={styles.sectionTitle}>Time Statistics</Text>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsCard}>
              <View style={[styles.analyticsIconContainer, { backgroundColor: "#D1FAE5" }]}>
                <Ionicons name="calendar" size={20} color="#10B981" />
              </View>
              <Text style={styles.analyticsValue}>{metrics.dealsLast7Days}</Text>
              <Text style={styles.analyticsLabel}>Last 7 Days</Text>
            </View>
            <View style={styles.analyticsCard}>
              <View style={[styles.analyticsIconContainer, { backgroundColor: "#EDE9FE" }]}>
                <Ionicons name="time" size={20} color="#8B5CF6" />
              </View>
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
                      <Text 
                        style={styles.legendText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
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

      {/* Deal Type Distribution Modal */}
      <Modal
        visible={showDealTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDealTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deal Type Distribution Details</Text>
              <TouchableOpacity
                onPress={() => setShowDealTypeModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalChartContainer}>
                <SimpleChart categories={dealTypeDistribution} />
              </View>
              
              <View style={styles.modalDetailsContainer}>
                {dealTypeDistribution.length > 0 ? (
                  <>
                    <Text style={styles.modalSubtitle}>Distribution Breakdown</Text>
                    {dealTypeDistribution.map((dealType, index) => (
                      <View key={index} style={styles.modalDetailRow}>
                        <View style={styles.modalDetailLeft}>
                          <View style={[styles.modalDetailBullet, { backgroundColor: dealType.color }]} />
                          <Text style={styles.modalDetailName}>{dealType.name}</Text>
                        </View>
                        <View style={styles.modalDetailRight}>
                          <Text style={styles.modalDetailPercentage}>{dealType.percentage}%</Text>
                          <Text style={styles.modalDetailCount}>({dealType.count} {dealType.count === 1 ? 'deal' : 'deals'})</Text>
                        </View>
                      </View>
                    ))}
                    <View style={styles.modalTotalRow}>
                      <Text style={styles.modalTotalLabel}>Total Deals:</Text>
                      <Text style={styles.modalTotalValue}>
                        {dealTypeDistribution.reduce((sum, dt) => sum + (dt.count || 0), 0)}
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.modalEmptyState}>
                    <Ionicons name="pricetag-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.modalEmptyText}>No deal type data available</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1F2937",
  },
  
  // ===== DEAL CATEGORIES SECTION =====
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#277874",
    marginBottom: 12,
  },
  chartContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
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
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  chartContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  chartVisual: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  chartCenterText: {
    fontSize: 10,
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
    marginLeft: 8,
    maxWidth: width * 0.55,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    minWidth: 0,
  },
  legendBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
    flexShrink: 0,
  },
  legendText: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  manageText: {
    fontSize: 14,
    padding: 12,
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
    fontSize: 14,
    color: "#277874",
  },

  // ===== EMPTY STATE STYLES =====
  emptyState: {
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
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
  analyticsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#277874",
    marginTop: 6,
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  
  // ===== MODAL STYLES =====
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalScroll: {
    maxHeight: 600,
  },
  modalChartContainer: {
    alignItems: "center",
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalDetailsContainer: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  modalDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalDetailLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  modalDetailBullet: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    flexShrink: 0,
  },
  modalDetailName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  modalDetailRight: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  modalDetailPercentage: {
    fontSize: 16,
    fontWeight: "700",
    color: "#277874",
  },
  modalDetailCount: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  modalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: "#E5E7EB",
  },
  modalTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  modalTotalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#277874",
  },
  modalEmptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  modalEmptyText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
  },
  
});
