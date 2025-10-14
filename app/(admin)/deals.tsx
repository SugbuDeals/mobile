import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const { width } = Dimensions.get("window");

// Categories data for pie chart
const categories = [
  { name: "Electronics", percentage: 28.5, color: "#8B5CF6" },
  { name: "Fashion", percentage: 22.3, color: "#F87171" },
  { name: "Home & Garden", percentage: 18.7, color: "#60A5FA" },
  { name: "Books", percentage: 8.9, color: "#F59E0B" },
  { name: "Sports", percentage: 15.2, color: "#1E40AF" },
  { name: "Others", percentage: 6.4, color: "#10B981" },
];

// SVG Pie Chart Component
const SimpleChart = () => {
  const size = 120;
  const radius = size / 2;
  const centerX = radius;
  const centerY = radius;
  const innerRadius = 30;
  const outerRadius = 60;
  
  let cumulativePercentage = 0;
  
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
          const startAngle = (cumulativePercentage * 360) - 90;
          const endAngle = ((cumulativePercentage + category.percentage) * 360) - 90;
          
          const pathData = createArcPath(startAngle, endAngle, innerRadius, outerRadius);
          cumulativePercentage += category.percentage;
          
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
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
    </View>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
  </View>
);

export default function DealsAnalytics() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Key Metrics Cards */}
        <View style={styles.metricsSection}>
          <View style={styles.metricsGrid}>
            <MetricsCard
              label="Total Deals"
              value="1,247"
              icon="flame"
              color="#1B6F5D"
              bgColor="#D1FAE5"
            />
            <MetricsCard
              label="Active Deals"
              value="892"
              icon="pricetag"
              color="#F59E0B"
              bgColor="#FEF3C7"
            />
          </View>
          <View style={styles.fullWidthCard}>
            <View style={styles.fullWidthMetricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Avg Discount</Text>
                <View style={[styles.metricIcon, { backgroundColor: "#D1FAE5" }]}>
                  <Ionicons name="trending-up" size={20} color="#1F2937" />
                </View>
              </View>
              <Text style={[styles.metricValue, { color: "#1F2937" }]}>15,432</Text>
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
                <SimpleChart />
              </View>
              
              <View style={styles.legendContainer}>
                {categories.map((category, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendBullet, { backgroundColor: category.color }]} />
                    <Text style={styles.legendText}>
                      {category.name} ({category.percentage}%)
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
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
    marginLeft: 20,
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
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
});
