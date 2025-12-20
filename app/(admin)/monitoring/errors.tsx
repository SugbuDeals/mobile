import { monitoringApi, type ErrorLogResponseDto, type ErrorStatsDto, type TimeRange } from "@/services/api";
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

export default function ErrorMonitoring() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ErrorStatsDto | null>(null);
  const [errors, setErrors] = useState<ErrorLogResponseDto[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("day");
  const [expandedError, setExpandedError] = useState<number | null>(null);
  const [levelFilter, setLevelFilter] = useState<"error" | "warn" | "debug" | undefined>(undefined);

  const timeRanges: { label: string; value: TimeRange }[] = [
    { label: "Last Hour", value: "hour" },
    { label: "Last 24 Hours", value: "day" },
    { label: "Last Week", value: "week" },
    { label: "Last Month", value: "month" },
  ];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, errorsData] = await Promise.all([
        monitoringApi.getErrorStats({ timeRange }),
        monitoringApi.getErrorLogs({ timeRange, page: 1, limit: 50, level: levelFilter }),
      ]);
      setStats(statsData);
      setErrors(errorsData);
    } catch (error) {
      console.error("Error loading error data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange, levelFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleTestError = async (errorType: "error" | "warn", statusCode?: number) => {
    try {
      await monitoringApi.testError(statusCode, errorType);
      Alert.alert("Success", `Test ${errorType} generated successfully!`);
      setTimeout(() => loadData(), 1000);
    } catch (error: any) {
      // Note: testError endpoint will return an error response (by design)
      // This is expected behavior for testing error tracking
      if (error?.status === statusCode || statusCode === 500) {
        Alert.alert("Test Error Generated", "The error was successfully logged to the monitoring system.");
        setTimeout(() => loadData(), 1000);
      } else {
        Alert.alert("Error", "Failed to generate test error");
      }
    }
  };

  const handleTestUnauthorized = async () => {
    try {
      await monitoringApi.testUnauthorized();
      Alert.alert("Success", "Test 401 error generated!");
      setTimeout(() => loadData(), 1000);
    } catch (error: any) {
      // 401 errors are expected from this endpoint
      if (error?.status === 401) {
        Alert.alert("Test Error Generated", "The 401 Unauthorized error was successfully logged.");
        setTimeout(() => loadData(), 1000);
      } else {
        Alert.alert("Error", "Failed to generate test error");
      }
    }
  };

  const getSeverityColor = (level: string) => {
    const lowerLevel = level.toLowerCase();
    if (lowerLevel.includes("error")) return "#EF4444";
    if (lowerLevel.includes("warn")) return "#F59E0B";
    return "#6B7280";
  };

  const getStatusCodeColor = (statusCode?: number) => {
    if (!statusCode) return "#6B7280";
    if (statusCode >= 500) return "#EF4444";
    if (statusCode >= 400) return "#F59E0B";
    return "#10B981";
  };

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading error data...</Text>
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
        {/* Test Buttons */}
        <View style={styles.testButtonsContainer}>
          <View style={styles.testButtonRow}>
            <TouchableOpacity
              style={[styles.testButton, { borderColor: "#EF4444" }]}
              onPress={() => handleTestError("error", 500)}
            >
              <Ionicons name="bug" size={18} color="#EF4444" />
              <Text style={[styles.testButtonText, { color: "#F87171" }]}>Test Error (500)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, { borderColor: "#F59E0B" }]}
              onPress={() => handleTestError("warn", 400)}
            >
              <Ionicons name="warning" size={18} color="#F59E0B" />
              <Text style={[styles.testButtonText, { color: "#FBBF24" }]}>Test Warning</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.testButton, styles.testButtonFull, { borderColor: "#EF4444" }]}
            onPress={handleTestUnauthorized}
          >
            <Ionicons name="shield-outline" size={18} color="#EF4444" />
            <Text style={[styles.testButtonText, { color: "#F87171" }]}>Test 401 Unauthorized</Text>
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

        {/* Level Filter */}
        <View style={styles.levelFilterContainer}>
          <Text style={styles.filterLabel}>Filter by Level:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.levelFilterButton,
                levelFilter === undefined && styles.levelFilterButtonActive,
              ]}
              onPress={() => setLevelFilter(undefined)}
            >
              <Text
                style={[
                  styles.levelFilterText,
                  levelFilter === undefined && styles.levelFilterTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.levelFilterButton,
                levelFilter === "error" && styles.levelFilterButtonActive,
              ]}
              onPress={() => setLevelFilter("error")}
            >
              <Text
                style={[
                  styles.levelFilterText,
                  levelFilter === "error" && styles.levelFilterTextActive,
                ]}
              >
                Errors
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.levelFilterButton,
                levelFilter === "warn" && styles.levelFilterButtonActive,
              ]}
              onPress={() => setLevelFilter("warn")}
            >
              <Text
                style={[
                  styles.levelFilterText,
                  levelFilter === "warn" && styles.levelFilterTextActive,
                ]}
              >
                Warnings
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.levelFilterButton,
                levelFilter === "debug" && styles.levelFilterButtonActive,
              ]}
              onPress={() => setLevelFilter("debug")}
            >
              <Text
                style={[
                  styles.levelFilterText,
                  levelFilter === "debug" && styles.levelFilterTextActive,
                ]}
              >
                Debug
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {stats && (
          <>
            {/* Error Summary */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="alert-circle" size={24} color="#EF4444" />
                  <Text style={styles.metricLabel}>Total Errors</Text>
                </View>
                <Text style={[styles.metricValue, { color: "#EF4444" }]}>
                  {stats.totalErrors.toLocaleString()}
                </Text>
                <Text style={styles.metricChange}>
                  {stats.errorsLast24h} in last 24h
                </Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="warning" size={24} color="#F59E0B" />
                  <Text style={styles.metricLabel}>Total Warnings</Text>
                </View>
                <Text style={[styles.metricValue, { color: "#F59E0B" }]}>
                  {stats.totalWarnings.toLocaleString()}
                </Text>
                <Text style={styles.metricChange}>
                  {stats.warningsLast24h} in last 24h
                </Text>
              </View>
            </View>

            {/* Top Error Endpoints */}
            {stats.topErrorEndpoints.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top Error Endpoints</Text>
                <View style={styles.endpointsList}>
                  {stats.topErrorEndpoints.slice(0, 10).map((endpoint, index) => (
                    <View key={index} style={styles.endpointItem}>
                      <View style={styles.endpointInfo}>
                        <Ionicons name="link" size={20} color="#F87171" />
                        <Text style={styles.endpointText}>{endpoint}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: "#FEE2E2" }]}>
                        <Text style={[styles.statusText, { color: "#DC2626" }]}>Error</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Error Distribution by Status Code */}
            {Object.keys(stats.errorsByStatusCode).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Errors by Status Code</Text>
                <View style={styles.statusCodeGrid}>
                  {Object.entries(stats.errorsByStatusCode).map(([code, count]) => (
                    <View key={code} style={styles.statusCodeCard}>
                      <Text style={[styles.statusCode, { color: getStatusCodeColor(parseInt(code)) }]}>
                        {code}
                      </Text>
                      <Text style={styles.statusCodeCount}>{count.toLocaleString()}</Text>
                      <View
                        style={[
                          styles.statusIndicator,
                          { backgroundColor: getStatusCodeColor(parseInt(code)) },
                        ]}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* Error Logs */}
        {errors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Error Logs</Text>
            <View style={styles.errorsList}>
              {errors.slice(0, 30).map((error) => (
                <TouchableOpacity
                  key={error.id}
                  style={styles.errorItem}
                  onPress={() =>
                    setExpandedError(expandedError === error.id ? null : error.id)
                  }
                >
                  <View style={styles.errorHeader}>
                    <View style={styles.errorHeaderLeft}>
                      <View
                        style={[
                          styles.errorLevelBadge,
                          { backgroundColor: getSeverityColor(error.level) + "20" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.errorLevelText,
                            { color: getSeverityColor(error.level) },
                          ]}
                        >
                          {error.level.toUpperCase()}
                        </Text>
                      </View>
                      {error.statusCode && (
                        <View
                          style={[
                            styles.statusCodeBadge,
                            { backgroundColor: getStatusCodeColor(error.statusCode) + "20" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusCodeText,
                              { color: getStatusCodeColor(error.statusCode) },
                            ]}
                          >
                            {error.statusCode}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Ionicons
                      name={expandedError === error.id ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#94A3B8"
                    />
                  </View>

                  <Text style={styles.errorMessage} numberOfLines={expandedError === error.id ? undefined : 2}>
                    {error.message}
                  </Text>

                  {error.endpoint && (
                    <View style={styles.errorMeta}>
                      <Ionicons name="link" size={14} color="#94A3B8" />
                      <Text style={styles.errorMetaText}>
                        {error.method} {error.endpoint}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.errorDate}>
                    {new Date(error.createdAt).toLocaleString()}
                  </Text>

                  {expandedError === error.id && (
                    <>
                      {error.metadata && Object.keys(error.metadata).length > 0 && (
                        <View style={styles.errorMetadataContainer}>
                          <Text style={styles.errorMetadataLabel}>Metadata:</Text>
                          <ScrollView style={styles.errorMetadata}>
                            <Text style={styles.errorMetadataText}>
                              {JSON.stringify(error.metadata, null, 2)}
                            </Text>
                          </ScrollView>
                        </View>
                      )}
                      {error.stack && (
                        <View style={styles.errorStackContainer}>
                          <Text style={styles.errorStackLabel}>Stack Trace:</Text>
                          <ScrollView style={styles.errorStack}>
                            <Text style={styles.errorStackText}>{error.stack}</Text>
                          </ScrollView>
                        </View>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {errors.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            <Text style={styles.emptyStateText}>No errors found</Text>
            <Text style={styles.emptyStateSubtext}>
              System is running smoothly!
            </Text>
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
  levelFilterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 8,
    fontWeight: "500",
  },
  levelFilterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1E293B",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  levelFilterButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  levelFilterText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
  },
  levelFilterTextActive: {
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 11,
    color: "#64748B",
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
  errorsList: {
    gap: 12,
  },
  errorItem: {
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
  errorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  errorHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  errorLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  errorLevelText: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusCodeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusCodeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  errorMessage: {
    fontSize: 14,
    color: "#E2E8F0",
    marginBottom: 8,
    lineHeight: 20,
  },
  errorMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  errorMetaText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  errorDate: {
    fontSize: 11,
    color: "#64748B",
  },
  errorMetadataContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  errorMetadataLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 8,
  },
  errorMetadata: {
    maxHeight: 150,
    backgroundColor: "#0F172A",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  errorMetadataText: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#60A5FA",
  },
  errorStackContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  errorStackLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 8,
  },
  errorStack: {
    maxHeight: 200,
    backgroundColor: "#0F172A",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  errorStackText: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#CBD5E1",
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
  testButtonsContainer: {
    marginBottom: 16,
    marginTop: 16,
    gap: 12,
  },
  testButtonRow: {
    flexDirection: "row",
    gap: 12,
  },
  testButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    gap: 8,
  },
  testButtonFull: {
    flex: 1,
  },
  testButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
