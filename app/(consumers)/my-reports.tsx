import { useLogin } from "@/features/auth";
import { reportsApi } from "@/services/api/endpoints/reports";
import type { ReportResponseDto } from "@/services/api/types/swagger";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ITEMS_PER_PAGE = 20;

// Report Card Component
const ReportCard = ({ report }: { report: ReportResponseDto }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return { bg: "#FEF3C7", text: "#92400E", icon: "time-outline" };
      case "REVIEWED":
        return { bg: "#DBEAFE", text: "#1E40AF", icon: "eye-outline" };
      case "RESOLVED":
        return { bg: "#D1FAE5", text: "#065F46", icon: "checkmark-circle-outline" };
      case "DISMISSED":
        return { bg: "#F3F4F6", text: "#374151", icon: "close-circle-outline" };
      default:
        return { bg: "#F3F4F6", text: "#374151", icon: "help-circle-outline" };
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      SPAM: "Spam",
      HARASSMENT: "Harassment",
      INAPPROPRIATE_CONTENT: "Inappropriate Content",
      FAKE_REVIEW: "Fake Review",
      SCAM: "Scam",
      OTHER: "Other",
    };
    return labels[reason] || reason;
  };

  const statusColors = getStatusColor(report.status);
  const reportedEntity = report.reportedStoreName || report.reportedUserName || "Unknown";
  const reportedType = report.reportedStoreId ? "Store" : "User";

  return (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportInfo}>
          <Text style={styles.reportId}>Report #{report.id}</Text>
          <Text style={styles.reportDate}>
            {new Date(report.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Ionicons name={statusColors.icon as any} size={14} color={statusColors.text} />
          <Text style={[styles.statusText, { color: statusColors.text }]}>
            {report.status}
          </Text>
        </View>
      </View>

      <View style={styles.reportBody}>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Reported {reportedType}:</Text>
          <Text style={styles.reportValue}>{reportedEntity}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Reason:</Text>
          <Text style={styles.reportValue}>{getReasonLabel(report.reason)}</Text>
        </View>
        {report.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.reportLabel}>Description:</Text>
            <Text style={styles.descriptionText}>{report.description}</Text>
          </View>
        )}
        {report.reviewedByName && (
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Reviewed by:</Text>
            <Text style={styles.reportValue}>{report.reviewedByName}</Text>
          </View>
        )}
        {report.reviewedAt && (
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Reviewed on:</Text>
            <Text style={styles.reportValue}>
              {new Date(report.reviewedAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default function MyReports() {
  const { state: authState } = useLogin();
  const [reports, setReports] = useState<ReportResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const userId = authState.user?.id ? Number(authState.user.id) : undefined;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const loadReports = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Use the new 'type' parameter to fetch reports submitted BY the user
      const skip = currentPage * ITEMS_PER_PAGE;
      const data = await reportsApi.getReportsByUser(userId, {
        type: "submitted",
        skip,
        take: ITEMS_PER_PAGE,
      });
      
      setReports(data);
      setHasMore(data.length === ITEMS_PER_PAGE);
    } catch (error: any) {
      console.error("[MyReports] Failed to load reports:", error);
      Alert.alert("Error", error?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [userId, currentPage]);

  useEffect(() => {
    if (userId) {
      loadReports();
    }
  }, [userId, currentPage, loadReports]);

  const statusCounts = {
    pending: reports.filter((r) => r.status === "PENDING").length,
    reviewed: reports.filter((r) => r.status === "REVIEWED").length,
    resolved: reports.filter((r) => r.status === "RESOLVED").length,
    dismissed: reports.filter((r) => r.status === "DISMISSED").length,
  };

  return (
    <View style={styles.container}>
      {/* Header with Linear Gradient */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={["#FFBE5D", "#277874"]}
          style={styles.headerContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <StatusBar
            barStyle="light-content"
            translucent
            backgroundColor="transparent"
          />
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>My Reports</Text>
              <Text style={styles.headerSubtitle}>
                Track your submitted reports and their status
              </Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="flag" size={28} color="#ffffff" />
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Status Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={[styles.summaryValue, { color: "#F59E0B" }]}>
              {statusCounts.pending}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Reviewed</Text>
            <Text style={[styles.summaryValue, { color: "#3B82F6" }]}>
              {statusCounts.reviewed}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Resolved</Text>
            <Text style={[styles.summaryValue, { color: "#10B981" }]}>
              {statusCounts.resolved}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Dismissed</Text>
            <Text style={[styles.summaryValue, { color: "#6B7280" }]}>
              {statusCounts.dismissed}
            </Text>
          </View>
        </View>

        {/* Reports List */}
        <View style={styles.reportsSection}>
          {loading && reports.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#277874" />
              <Text style={styles.loadingText}>Loading reports...</Text>
            </View>
          ) : reports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No reports yet</Text>
              <Text style={styles.emptySubtext}>
                You haven&apos;t submitted any reports. Use the report button on stores or reviews to report inappropriate content.
              </Text>
            </View>
          ) : (
            <>
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}

              {/* Pagination */}
              {hasMore && (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      currentPage === 0 && styles.paginationButtonDisabled,
                    ]}
                    onPress={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={20}
                      color={currentPage === 0 ? "#9CA3AF" : "#277874"}
                    />
                    <Text
                      style={[
                        styles.paginationButtonText,
                        currentPage === 0 && styles.paginationButtonTextDisabled,
                      ]}
                    >
                      Previous
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.paginationInfo}>Page {currentPage + 1}</Text>

                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      !hasMore && styles.paginationButtonDisabled,
                    ]}
                    onPress={() => setCurrentPage((p) => p + 1)}
                    disabled={!hasMore}
                  >
                    <Text
                      style={[
                        styles.paginationButtonText,
                        !hasMore && styles.paginationButtonTextDisabled,
                      ]}
                    >
                      Next
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={!hasMore ? "#9CA3AF" : "#277874"}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  headerWrapper: {
    backgroundColor: "transparent",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContainer: {
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight || 0,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  summarySection: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  reportsSection: {
    padding: 16,
    paddingBottom: 32,
  },
  reportCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reportBody: {
    marginBottom: 12,
  },
  reportRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  reportLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    width: 120,
  },
  reportValue: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  descriptionSection: {
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: "#111827",
    marginTop: 4,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    gap: 4,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#277874",
  },
  paginationButtonTextDisabled: {
    color: "#9CA3AF",
  },
  paginationInfo: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
});
