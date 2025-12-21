import { monitoringApi, type RouteStatDto, type RouteSummaryDto } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart } from "react-native-gifted-charts";

const { width } = Dimensions.get("window");

export default function RouteMonitoring() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [routes, setRoutes] = useState<RouteStatDto[]>([]);
  const [summary, setSummary] = useState<RouteSummaryDto | null>(null);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sortBy, setSortBy] = useState<"count" | "avgResponseTime" | "errorCount">("count");
  const [showCharts, setShowCharts] = useState(false);
  const [chartType, setChartType] = useState<"vertical" | "horizontal">("horizontal");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [routesData, summaryData] = await Promise.all([
        monitoringApi.getLiveRoutes(),
        monitoringApi.getRouteSummary(),
      ]);
      setRoutes(routesData);
      setSummary(summaryData);
    } catch (error) {
      console.error("Error loading route data:", error);
      Alert.alert("Error", "Failed to load route monitoring data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleClearStats = () => {
    Alert.alert(
      "Clear Route Statistics",
      "Are you sure you want to clear all route statistics? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await monitoringApi.clearRouteStats();
              Alert.alert("Success", "Route statistics cleared successfully");
              setTimeout(() => loadData(), 500);
            } catch (error) {
              console.error("Error clearing route statistics:", error);
              Alert.alert("Error", "Failed to clear route statistics");
            }
          },
        },
      ]
    );
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = (responseTime: number) => {
    if (responseTime < 500) return "#10B981"; // Green
    if (responseTime < 2000) return "#F59E0B"; // Yellow
    return "#EF4444"; // Red
  };

  const getMethodColor = (method: string) => {
    const upperMethod = method.toUpperCase();
    if (upperMethod === "GET") return "#10B981";
    if (upperMethod === "POST") return "#3B82F6";
    if (upperMethod === "PUT" || upperMethod === "PATCH") return "#F59E0B";
    if (upperMethod === "DELETE") return "#EF4444";
    return "#94A3B8";
  };

  const sortedRoutes = [...routes].sort((a, b) => {
    if (sortBy === "count") return b.count - a.count;
    if (sortBy === "avgResponseTime") return b.avgResponseTime - a.avgResponseTime;
    if (sortBy === "errorCount") return b.errorCount - a.errorCount;
    return 0;
  });

  // Prepare chart data - show top routes by usage count
  const chartData = sortedRoutes
    .slice(0, 15) // Show top 15 routes
    .map((route, index) => {
      const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];
      // Shorter labels for horizontal charts to fit portrait mode
      const maxLabelLength = chartType === "horizontal" ? 15 : 25;
      const routeLabel = route.endpoint.length > maxLabelLength 
        ? `${route.method} ${route.endpoint.substring(0, maxLabelLength)}...` 
        : `${route.method} ${route.endpoint}`;
      
      return {
        value: route.count,
        label: routeLabel,
        frontColor: colors[index % colors.length],
        spacing: chartType === "horizontal" ? 8: 2,
        labelWidth: chartType === "horizontal" ? 40 : 60,
        labelTextStyle: { 
          color: "#94A3B8", 
          fontSize: chartType === "horizontal" ? 9 : 9,
        },
        topLabelComponent: () => (
          <Text style={styles.chartBarValue}>{route.count}</Text>
        ),
      };
    });

  if (loading && !summary) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading route data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.controlButton, autoRefresh && styles.controlButtonActive]}
            onPress={() => setAutoRefresh(!autoRefresh)}
          >
            <Ionicons
              name={autoRefresh ? "pause-circle" : "play-circle"}
              size={18}
              color={autoRefresh ? "#10B981" : "#94A3B8"}
            />
            <Text style={[styles.controlButtonText, autoRefresh && styles.controlButtonTextActive]}>
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, { borderColor: "#EF4444" }]}
            onPress={handleClearStats}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={[styles.controlButtonText, { color: "#F87171" }]}>Clear Stats</Text>
          </TouchableOpacity>
        </View>

        {/* Charts Toggle Button */}
        <View style={styles.chartsToggleContainer}>
          <TouchableOpacity
            style={[styles.chartsToggleButton, showCharts && styles.chartsToggleButtonActive]}
            onPress={() => setShowCharts(!showCharts)}
          >
            <Ionicons
              name={showCharts ? "bar-chart" : "bar-chart-outline"}
              size={20}
              color={showCharts ? "#60A5FA" : "#94A3B8"}
            />
            <Text style={[styles.chartsToggleText, showCharts && styles.chartsToggleTextActive]}>
              {showCharts ? "Hide Charts" : "Show Charts"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Charts Section - Only show when charts are enabled */}
        {showCharts ? (
          sortedRoutes.length > 0 ? (
            <View style={styles.chartsSection}>
              <View style={styles.chartsHeader}>
                <Text style={styles.chartsSectionTitle}>Route Usage Statistics</Text>
                <View style={styles.chartTypeToggle}>
                  <TouchableOpacity
                    style={[styles.chartTypeButton, chartType === "horizontal" && styles.chartTypeButtonActive]}
                    onPress={() => setChartType("horizontal")}
                  >
                    <Ionicons 
                      name="resize-outline" 
                      size={16} 
                      color={chartType === "horizontal" ? "#60A5FA" : "#94A3B8"} 
                    />
                    <Text style={[styles.chartTypeText, chartType === "horizontal" && styles.chartTypeTextActive]}>
                      Horizontal
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chartTypeButton, chartType === "vertical" && styles.chartTypeButtonActive]}
                    onPress={() => setChartType("vertical")}
                  >
                    <Ionicons 
                      name="resize-outline" 
                      size={16} 
                      color={chartType === "vertical" ? "#60A5FA" : "#94A3B8"} 
                    />
                    <Text style={[styles.chartTypeText, chartType === "vertical" && styles.chartTypeTextActive]}>
                      Vertical
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.chartWrapper}>
                {chartData.length > 0 ? (
                  <View style={styles.chartInnerContainer}>
                    {chartType === "vertical" ? (
                      <ScrollView 
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chartScrollContent}
                      >
                        <BarChart
                          data={chartData}
                          width={Math.max(width - 80, chartData.length * 50)}
                          height={300}
                          barWidth={30}
                          spacing={8}
                          horizontal={false}
                          roundedTop
                          roundedBottom
                          hideRules={false}
                          rulesType="solid"
                          rulesColor="#334155"
                          xAxisThickness={1}
                          yAxisThickness={1}
                          yAxisColor="#334155"
                          xAxisColor="#334155"
                          maxValue={Math.max(...chartData.map(d => d.value), 1) * 1.2}
                          noOfSections={4}
                          yAxisTextStyle={{ color: "#94A3B8", fontSize: 10 }}
                          xAxisLabelTextStyle={{ color: "#94A3B8", fontSize: 9 }}
                          showVerticalLines
                          verticalLinesColor="#334155"
                          isAnimated
                          animationDuration={800}
                        />
                      </ScrollView>
                    ) : (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={[styles.chartScrollContentHorizontal, { minWidth: width - 60 }]}
                        style={styles.chartScrollView}
                      >
                        <BarChart
                          data={chartData}
                          width={Math.max(width - 80, (width - 80) * 1.5)}
                          height={Math.max(300, chartData.length * 35)}
                          barWidth={18}
                          spacing={6}
                          horizontal={true}
                          roundedTop
                          roundedBottom
                          hideRules={false}
                          rulesType="solid"
                          rulesColor="#334155"
                          xAxisThickness={1}
                          yAxisThickness={1}
                          yAxisColor="#334155"
                          xAxisColor="#334155"
                          maxValue={Math.max(...chartData.map(d => d.value), 1) * 1.2}
                          noOfSections={4}
                          yAxisTextStyle={{ color: "#94A3B8", fontSize: 9 }}
                          xAxisLabelTextStyle={{ color: "#94A3B8", fontSize: 8 }}
                          showVerticalLines={false}
                          verticalLinesColor="#334155"
                          isAnimated
                          animationDuration={800}
                          initialSpacing={45}
                        />
                      </ScrollView>
                    )}
                  </View>
                ) : (
                  <View style={styles.emptyChart}>
                    <Ionicons name="bar-chart-outline" size={48} color="#64748B" />
                    <Text style={styles.emptyChartText}>No route data available</Text>
                  </View>
                )}
              </View>
              <Text style={styles.chartNote}>
                Showing top {Math.min(sortedRoutes.length, 15)} routes by request count (Real-time updates every 5 seconds)
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="bar-chart-outline" size={64} color="#64748B" />
              <Text style={styles.emptyStateText}>No route data available</Text>
              <Text style={styles.emptyStateSubtext}>
                Routes will appear here as requests are made to the API
              </Text>
            </View>
          )
        ) : (
          <>
            {/* Sort Options */}
            <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { label: "Most Used", value: "count" as const },
              { label: "Slowest", value: "avgResponseTime" as const },
              { label: "Most Errors", value: "errorCount" as const },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortButton,
                  sortBy === option.value && styles.sortButtonActive,
                ]}
                onPress={() => setSortBy(option.value)}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === option.value && styles.sortButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Summary Stats */}
        {summary && (
          <>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="server" size={24} color="#3B82F6" />
                  <Text style={styles.metricLabel}>Total Requests</Text>
                </View>
                <Text style={styles.metricValue}>{summary.totalRequests.toLocaleString()}</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="alert-circle" size={24} color="#EF4444" />
                  <Text style={styles.metricLabel}>Total Errors</Text>
                </View>
                <Text style={[styles.metricValue, { color: "#EF4444" }]}>
                  {summary.totalErrors.toLocaleString()}
                </Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="link" size={24} color="#8B5CF6" />
                  <Text style={styles.metricLabel}>Unique Routes</Text>
                </View>
                <Text style={styles.metricValue}>{summary.uniqueRoutes.toLocaleString()}</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="speedometer" size={24} color="#10B981" />
                  <Text style={styles.metricLabel}>Avg Response</Text>
                </View>
                <Text style={[styles.metricValue, { color: "#10B981" }]}>
                  {formatTime(summary.avgResponseTime)}
                </Text>
              </View>
            </View>

            {/* Most Used Routes */}
            {summary.mostUsedRoutes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Most Used Routes</Text>
                <View style={styles.routesList}>
                  {summary.mostUsedRoutes.slice(0, 5).map((route: any, index) => (
                    <View key={index} style={styles.routeSummaryItem}>
                      <View style={styles.routeSummaryInfo}>
                        <View
                          style={[
                            styles.methodBadge,
                            { backgroundColor: getMethodColor(route.method || "GET") + "20" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.methodText,
                              { color: getMethodColor(route.method || "GET") },
                            ]}
                          >
                            {route.method || "GET"}
                          </Text>
                        </View>
                        <Text style={styles.routeSummaryText} numberOfLines={1}>
                          {route.endpoint || route.route || "Unknown"}
                        </Text>
                      </View>
                      <Text style={styles.routeSummaryCount}>{route.count || 0}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Slowest Routes */}
            {summary.slowestRoutes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Slowest Routes</Text>
                <View style={styles.routesList}>
                  {summary.slowestRoutes.slice(0, 5).map((route: any, index) => (
                    <View key={index} style={styles.routeSummaryItem}>
                      <View style={styles.routeSummaryInfo}>
                        <View
                          style={[
                            styles.methodBadge,
                            { backgroundColor: getMethodColor(route.method || "GET") + "20" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.methodText,
                              { color: getMethodColor(route.method || "GET") },
                            ]}
                          >
                            {route.method || "GET"}
                          </Text>
                        </View>
                        <Text style={styles.routeSummaryText} numberOfLines={1}>
                          {route.endpoint || route.route || "Unknown"}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.routeSummaryTime,
                          { color: getStatusColor(route.avgResponseTime || 0) },
                        ]}
                      >
                        {formatTime(route.avgResponseTime || 0)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Error Routes */}
            {summary.errorRoutes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Routes with Errors</Text>
                <View style={styles.routesList}>
                  {summary.errorRoutes.slice(0, 5).map((route: any, index) => (
                    <View key={index} style={styles.routeSummaryItem}>
                      <View style={styles.routeSummaryInfo}>
                        <View
                          style={[
                            styles.methodBadge,
                            { backgroundColor: getMethodColor(route.method || "GET") + "20" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.methodText,
                              { color: getMethodColor(route.method || "GET") },
                            ]}
                          >
                            {route.method || "GET"}
                          </Text>
                        </View>
                        <Text style={styles.routeSummaryText} numberOfLines={1}>
                          {route.endpoint || route.route || "Unknown"}
                        </Text>
                      </View>
                      <View style={[styles.errorBadge, { backgroundColor: "#FEE2E2" }]}>
                        <Text style={[styles.errorBadgeText, { color: "#DC2626" }]}>
                          {route.errorCount || 0} errors
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* Live Routes List */}
        {sortedRoutes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Active Routes ({sortedRoutes.length})
            </Text>
            <View style={styles.routesList}>
              {sortedRoutes.map((route, index) => {
                const routeKey = `${route.method}-${route.endpoint}`;
                const isExpanded = expandedRoute === routeKey;
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.routeItem}
                    onPress={() => setExpandedRoute(isExpanded ? null : routeKey)}
                  >
                    <View style={styles.routeHeader}>
                      <View style={styles.routeHeaderLeft}>
                        <View
                          style={[
                            styles.methodBadge,
                            { backgroundColor: getMethodColor(route.method) + "20" },
                          ]}
                        >
                          <Text
                            style={[styles.methodText, { color: getMethodColor(route.method) }]}
                          >
                            {route.method}
                          </Text>
                        </View>
                        <Text style={styles.routeEndpoint} numberOfLines={1}>
                          {route.endpoint}
                        </Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#94A3B8"
                      />
                    </View>

                    <View style={styles.routeStats}>
                      <View style={styles.routeStatItem}>
                        <Ionicons name="stats-chart" size={16} color="#94A3B8" />
                        <Text style={styles.routeStatText}>{route.count.toLocaleString()} requests</Text>
                      </View>
                      <View style={styles.routeStatItem}>
                        <Ionicons name="speedometer" size={16} color={getStatusColor(route.avgResponseTime)} />
                        <Text
                          style={[
                            styles.routeStatText,
                            { color: getStatusColor(route.avgResponseTime) },
                          ]}
                        >
                          {formatTime(route.avgResponseTime)} avg
                        </Text>
                      </View>
                      {route.errorCount > 0 && (
                        <View style={styles.routeStatItem}>
                          <Ionicons name="alert-circle" size={16} color="#EF4444" />
                          <Text style={[styles.routeStatText, { color: "#EF4444" }]}>
                            {route.errorCount} errors
                          </Text>
                        </View>
                      )}
                    </View>

                    {isExpanded && (
                      <View style={styles.routeDetails}>
                        <View style={styles.routeDetailRow}>
                          <Text style={styles.routeDetailLabel}>Min Response:</Text>
                          <Text style={styles.routeDetailValue}>
                            {formatTime(route.minResponseTime)}
                          </Text>
                        </View>
                        <View style={styles.routeDetailRow}>
                          <Text style={styles.routeDetailLabel}>Max Response:</Text>
                          <Text style={[styles.routeDetailValue, { color: "#EF4444" }]}>
                            {formatTime(route.maxResponseTime)}
                          </Text>
                        </View>
                        <View style={styles.routeDetailRow}>
                          <Text style={styles.routeDetailLabel}>First Seen:</Text>
                          <Text style={styles.routeDetailValue}>
                            {formatTimestamp(route.firstSeen)}
                          </Text>
                        </View>
                        <View style={styles.routeDetailRow}>
                          <Text style={styles.routeDetailLabel}>Last Used:</Text>
                          <Text style={styles.routeDetailValue}>
                            {formatTimestamp(route.lastUsed)}
                          </Text>
                        </View>

                        {Object.keys(route.statusCodes).length > 0 && (
                          <View style={styles.statusCodesContainer}>
                            <Text style={styles.statusCodesLabel}>Status Codes:</Text>
                            <View style={styles.statusCodesGrid}>
                              {Object.entries(route.statusCodes).map(([code, count]) => {
                                const isSuccess = code.startsWith("2");
                                const isError = code.startsWith("4") || code.startsWith("5");
                                return (
                                  <View key={code} style={styles.statusCodeItem}>
                                    <Text
                                      style={[
                                        styles.statusCodeText,
                                        {
                                          color: isSuccess
                                            ? "#10B981"
                                            : isError
                                            ? "#EF4444"
                                            : "#F59E0B",
                                        },
                                      ]}
                                    >
                                      {code}
                                    </Text>
                                    <Text style={styles.statusCodeCount}>{count as number}</Text>
                                  </View>
                                );
                              })}
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

            {sortedRoutes.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Ionicons name="link-outline" size={64} color="#64748B" />
                <Text style={styles.emptyStateText}>No active routes</Text>
                <Text style={styles.emptyStateSubtext}>
                  Routes will appear here as requests are made to the API
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#94A3B8",
  },
  controlsContainer: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 16,
    marginTop: 16,
  },
  controlButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 8,
  },
  controlButtonActive: {
    borderColor: "#10B981",
    backgroundColor: "#10B98120",
  },
  controlButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  controlButtonTextActive: {
    color: "#10B981",
  },
  sortContainer: {
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 8,
    fontWeight: "500",
  },
  sortButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1E293B",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  sortButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
  },
  sortButtonTextActive: {
    color: "#ffffff",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#334155",
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#60A5FA",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#60A5FA",
    marginBottom: 12,
  },
  routesList: {
    gap: 12,
  },
  routeSummaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  routeSummaryInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeSummaryText: {
    fontSize: 14,
    color: "#E2E8F0",
    flex: 1,
  },
  routeSummaryCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#60A5FA",
  },
  routeSummaryTime: {
    fontSize: 14,
    fontWeight: "600",
  },
  routeItem: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#334155",
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  routeHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  methodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  methodText: {
    fontSize: 10,
    fontWeight: "700",
  },
  routeEndpoint: {
    fontSize: 14,
    color: "#E2E8F0",
    flex: 1,
  },
  routeStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  routeStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  routeStatText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  routeDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  routeDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  routeDetailLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  routeDetailValue: {
    fontSize: 12,
    color: "#E2E8F0",
    fontWeight: "600",
  },
  statusCodesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  statusCodesLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
    marginBottom: 8,
  },
  statusCodesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusCodeItem: {
    backgroundColor: "#0F172A",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  statusCodeText: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  statusCodeCount: {
    fontSize: 10,
    color: "#94A3B8",
  },
  errorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  errorBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 48,
    alignItems: "center",
    marginVertical: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#E2E8F0",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 8,
    textAlign: "center",
  },
  chartsToggleContainer: {
    marginBottom: 16,
  },
  chartsToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 8,
  },
  chartsToggleButtonActive: {
    borderColor: "#3B82F6",
    backgroundColor: "#3B82F620",
  },
  chartsToggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
  },
  chartsToggleTextActive: {
    color: "#60A5FA",
  },
  chartsSection: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  chartsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartsSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#60A5FA",
    flex: 1,
  },
  chartTypeToggle: {
    flexDirection: "row",
    gap: 8,
  },
  chartTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
  },
  chartTypeButtonActive: {
    backgroundColor: "#3B82F620",
    borderColor: "#3B82F6",
  },
  chartTypeText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  chartTypeTextActive: {
    color: "#60A5FA",
  },
  chartWrapper: {
    width: "100%",
    backgroundColor: "#0F172A",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "visible",
  },
  chartInnerContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  chartScrollView: {
    width: "100%",
  },
  chartScrollContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 20,
  },
  chartScrollContentVertical: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: 20,
    width: "100%",
  },
  chartScrollContentHorizontal: {
    paddingBottom: 20,
  },
  chartBarValue: {
    color: "#60A5FA",
    fontSize: 10,
    fontWeight: "600",
  },
  chartNote: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    fontStyle: "italic",
  },
  emptyChart: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyChartText: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 12,
  },
});
