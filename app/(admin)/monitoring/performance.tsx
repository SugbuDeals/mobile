import { monitoringApi, type PerformanceMetricResponseDto, type PerformanceStatsDto, type TimeRange } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width } = Dimensions.get("window");

export default function PerformanceMonitoring() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<PerformanceStatsDto | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetricResponseDto[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("day");

  const timeRanges: { label: string; value: TimeRange }[] = [
    { label: "Last Hour", value: "hour" },
    { label: "Last 24 Hours", value: "day" },
    { label: "Last Week", value: "week" },
    { label: "Last Month", value: "month" },
  ];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, metricsData] = await Promise.all([
        monitoringApi.getPerformanceStats({ timeRange }),
        monitoringApi.getPerformanceMetrics({ timeRange, page: 1, limit: 50 }),
      ]);
      setStats(statsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error("Error loading performance data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleTestPerformance = async () => {
    try {
      Alert.alert(
        "Test Performance",
        "Generate a test performance metric?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Test (200ms)",
            onPress: async () => {
              try {
                await monitoringApi.testPerformance(200);
                Alert.alert("Success", "Test performance metric generated!");
                setTimeout(() => loadData(), 1000);
              } catch {
                Alert.alert("Error", "Failed to generate test metric");
              }
            },
          },
          {
            text: "Test (500ms)",
            onPress: async () => {
              try {
                await monitoringApi.testPerformance(500);
                Alert.alert("Success", "Test performance metric generated!");
                setTimeout(() => loadData(), 1000);
              } catch {
                Alert.alert("Error", "Failed to generate test metric");
              }
            },
          },
          {
            text: "Test (2000ms)",
            onPress: async () => {
              try {
                await monitoringApi.testPerformance(2000);
                Alert.alert("Success", "Test performance metric generated!");
                setTimeout(() => loadData(), 1000);
              } catch {
                Alert.alert("Error", "Failed to generate test metric");
              }
            },
          },
        ]
      );
    } catch {
      Alert.alert("Error", "Failed to test performance monitoring");
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusColor = (responseTime: number) => {
    if (responseTime < 500) return "#10B981"; // Green
    if (responseTime < 2000) return "#F59E0B"; // Yellow
    return "#EF4444"; // Red
  };

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading performance data...</Text>
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
        {/* Test Button */}
        <View style={styles.testButtonContainer}>
          <TouchableOpacity style={styles.testButton} onPress={handleTestPerformance}>
            <Ionicons name="flash" size={20} color="#60A5FA" />
            <Text style={styles.testButtonText}>Test Performance</Text>
          </TouchableOpacity>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {timeRanges.map((range) => (
              <TouchableOpacity
                key={range.value}
                style={[
                  styles.timeRangeButton,
                  timeRange === range.value && styles.timeRangeButtonActive,
                ]}
                onPress={() => setTimeRange(range.value)}
              >
                <Text
                  style={[
                    styles.timeRangeText,
                    timeRange === range.value && styles.timeRangeTextActive,
                  ]}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {stats && (
          <>
            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="speedometer" size={24} color="#3B82F6" />
                  <Text style={styles.metricLabel}>Avg Response</Text>
                </View>
                <Text style={styles.metricValue}>{formatTime(stats.avgResponseTime)}</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="flash" size={24} color="#10B981" />
                  <Text style={styles.metricLabel}>Min Response</Text>
                </View>
                <Text style={styles.metricValue}>{formatTime(stats.minResponseTime)}</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="alert-circle" size={24} color="#EF4444" />
                  <Text style={styles.metricLabel}>Max Response</Text>
                </View>
                <Text style={styles.metricValue}>{formatTime(stats.maxResponseTime)}</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="server" size={24} color="#8B5CF6" />
                  <Text style={styles.metricLabel}>Total Requests</Text>
                </View>
                <Text style={styles.metricValue}>{stats.totalRequests.toLocaleString()}</Text>
              </View>
            </View>

            {/* Slowest Endpoints */}
            {stats.slowestEndpoints.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Slowest Endpoints</Text>
                <View style={styles.endpointsList}>
                  {stats.slowestEndpoints.slice(0, 10).map((endpoint, index) => (
                    <View key={index} style={styles.endpointItem}>
                      <View style={styles.endpointInfo}>
                        <Ionicons name="link" size={20} color="#94A3B8" />
                        <Text style={styles.endpointText}>{endpoint}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: "#FEE2E2" }]}>
                        <Text style={[styles.statusText, { color: "#DC2626" }]}>Slow</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Status Code Distribution */}
            {Object.keys(stats.requestsByStatusCode).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status Code Distribution</Text>
                <View style={styles.statusCodeGrid}>
                  {Object.entries(stats.requestsByStatusCode).map(([code, count]) => {
                    const isSuccess = code.startsWith("2");
                    const isError = code.startsWith("4") || code.startsWith("5");
                    return (
                      <View key={code} style={styles.statusCodeCard}>
                        <Text style={styles.statusCode}>{code}</Text>
                        <Text style={styles.statusCodeCount}>{count.toLocaleString()}</Text>
                        <View
                          style={[
                            styles.statusIndicator,
                            {
                              backgroundColor: isSuccess
                                ? "#10B981"
                                : isError
                                ? "#EF4444"
                                : "#F59E0B",
                            },
                          ]}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        {/* Recent Metrics */}
        {metrics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Performance Metrics</Text>
            <View style={styles.metricsList}>
              {metrics.slice(0, 20).map((metric) => (
                <View key={metric.id} style={styles.metricItem}>
                  <View style={styles.metricItemHeader}>
                    <View style={styles.metricItemInfo}>
                      <Text style={styles.metricMethod}>{metric.method}</Text>
                      <Text style={styles.metricEndpoint} numberOfLines={1}>
                        {metric.endpoint}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.metricTimeBadge,
                        { backgroundColor: getStatusColor(metric.responseTime) + "20" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.metricTimeText,
                          { color: getStatusColor(metric.responseTime) },
                        ]}
                      >
                        {formatTime(metric.responseTime)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.metricItemFooter}>
                    <Text style={styles.metricStatusCode}>Status: {metric.statusCode}</Text>
                    <Text style={styles.metricDate}>
                      {new Date(metric.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
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
  timeRangeContainer: {
    marginVertical: 16,
    paddingVertical: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#1E293B",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  timeRangeButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94A3B8",
  },
  timeRangeTextActive: {
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
  endpointsList: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  endpointItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  endpointInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  endpointText: {
    fontSize: 14,
    color: "#E2E8F0",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusCodeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statusCodeCard: {
    backgroundColor: "#1E293B",
    borderRadius: 10,
    padding: 12,
    width: (width - 60) / 3,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#334155",
  },
  statusCode: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#60A5FA",
    marginBottom: 4,
  },
  statusCodeCount: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricsList: {
    gap: 12,
  },
  metricItem: {
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
  metricItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  metricItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  metricMethod: {
    fontSize: 12,
    fontWeight: "600",
    color: "#60A5FA",
    marginBottom: 4,
  },
  metricEndpoint: {
    fontSize: 14,
    color: "#E2E8F0",
  },
  metricTimeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metricTimeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  metricItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  metricStatusCode: {
    fontSize: 12,
    color: "#94A3B8",
  },
  metricDate: {
    fontSize: 12,
    color: "#64748B",
  },
  testButtonContainer: {
    marginBottom: 16,
    marginTop: 16,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#3B82F6",
    gap: 8,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#60A5FA",
  },
});
