import ReportDetailsModal from "@/components/admin/ReportDetailsModal";
import { reportsApi } from "@/services/api/endpoints/reports";
import type { ReportResponseDto, ReportStatus } from "@/services/api/types/swagger";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const { width } = Dimensions.get("window");

const ITEMS_PER_PAGE = 20;

// Report Card Component
const ReportCard = ({
  report,
  onStatusUpdate,
  onViewDetails,
}: {
  report: ReportResponseDto;
  onStatusUpdate: () => void;
  onViewDetails: () => void;
}) => {
  const getStatusColor = (status: ReportStatus) => {
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
          <Text style={styles.reportLabel}>Reporter:</Text>
          <Text style={styles.reportValue}>{report.reporterName}</Text>
        </View>
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
      </View>

      <View style={styles.reportActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.detailsButton]}
          onPress={onViewDetails}
        >
          <Ionicons name="information-circle-outline" size={16} color="#277874" />
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        {report.status === "PENDING" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.reviewButton]}
            onPress={() => onStatusUpdate()}
          >
            <Ionicons name="eye" size={16} color="#1E40AF" />
            <Text style={styles.actionButtonText}>Review</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Filter Button Component
const FilterButton = ({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.filterButton} onPress={onPress}>
    {isSelected ? (
      <LinearGradient
        colors={["#277874", "#1B6F5D"]}
        style={styles.filterButtonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.filterButtonTextSelected}>{label}</Text>
      </LinearGradient>
    ) : (
      <View style={styles.filterButtonInactive}>
        <Text style={styles.filterButtonText}>{label}</Text>
      </View>
    )}
  </TouchableOpacity>
);

// Metrics Card Component
const MetricsCard = ({
  label,
  value,
  icon,
  color,
  bgColor,
}: {
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

export default function AdminReports() {
  const [reports, setReports] = useState<ReportResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "ALL">("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportResponseDto | null>(null);
  const [newStatus, setNewStatus] = useState<ReportStatus>("REVIEWED");
  const [updating, setUpdating] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsReport, setDetailsReport] = useState<ReportResponseDto | null>(null);

  const statusFilters: { label: string; value: ReportStatus | "ALL" }[] = [
    { label: "All", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Reviewed", value: "REVIEWED" },
    { label: "Resolved", value: "RESOLVED" },
    { label: "Dismissed", value: "DISMISSED" },
  ];

  useEffect(() => {
    loadReports();
  }, [selectedStatus, currentPage]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const params: any = {
        skip: currentPage * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
      };

      if (selectedStatus !== "ALL") {
        params.status = selectedStatus;
      }

      const data = await reportsApi.getAllReports(params);
      setReports(data);
      setHasMore(data.length === ITEMS_PER_PAGE);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (report: ReportResponseDto) => {
    setSelectedReport(report);
    setNewStatus(report.status === "PENDING" ? "REVIEWED" : report.status);
    setShowStatusModal(true);
  };

  const handleViewDetails = (report: ReportResponseDto) => {
    setDetailsReport(report);
    setShowDetailsModal(true);
  };

  const updateReportStatus = async () => {
    if (!selectedReport) return;

    try {
      setUpdating(true);
      await reportsApi.updateReportStatus(selectedReport.id, { status: newStatus });
      Alert.alert("Success", "Report status updated successfully");
      setShowStatusModal(false);
      setSelectedReport(null);
      loadReports();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update report status");
    } finally {
      setUpdating(false);
    }
  };

  const metrics = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "PENDING").length,
    reviewed: reports.filter((r) => r.status === "REVIEWED").length,
    resolved: reports.filter((r) => r.status === "RESOLVED").length,
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Metrics Section */}
        <View style={styles.metricsSection}>
          <MetricsCard
            label="Total Reports"
            value={metrics.total.toString()}
            icon="document-text-outline"
            color="#277874"
            bgColor="#D1FAE5"
          />
          <MetricsCard
            label="Pending"
            value={metrics.pending.toString()}
            icon="time-outline"
            color="#F59E0B"
            bgColor="#FEF3C7"
          />
          <MetricsCard
            label="Reviewed"
            value={metrics.reviewed.toString()}
            icon="eye-outline"
            color="#3B82F6"
            bgColor="#DBEAFE"
          />
          <MetricsCard
            label="Resolved"
            value={metrics.resolved.toString()}
            icon="checkmark-circle-outline"
            color="#10B981"
            bgColor="#D1FAE5"
          />
        </View>

        {/* Filters Section */}
        <View style={styles.filtersSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {statusFilters.map((filter) => (
              <FilterButton
                key={filter.value}
                label={filter.label}
                isSelected={selectedStatus === filter.value}
                onPress={() => {
                  setSelectedStatus(filter.value);
                  setCurrentPage(0);
                }}
              />
            ))}
          </ScrollView>
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
              <Text style={styles.emptyText}>No reports found</Text>
              <Text style={styles.emptySubtext}>
                {selectedStatus !== "ALL"
                  ? `No ${selectedStatus.toLowerCase()} reports`
                  : "No reports have been submitted yet"}
              </Text>
            </View>
          ) : (
            <>
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onStatusUpdate={() => handleStatusUpdate(report)}
                  onViewDetails={() => handleViewDetails(report)}
                />
              ))}

              {/* Pagination */}
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    currentPage === 0 && styles.paginationButtonDisabled,
                  ]}
                  onPress={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  <Ionicons name="chevron-back" size={20} color={currentPage === 0 ? "#9CA3AF" : "#277874"} />
                  <Text
                    style={[
                      styles.paginationButtonText,
                      currentPage === 0 && styles.paginationButtonTextDisabled,
                    ]}
                  >
                    Previous
                  </Text>
                </TouchableOpacity>

                <Text style={styles.paginationInfo}>
                  Page {currentPage + 1}
                </Text>

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
                  <Ionicons name="chevron-forward" size={20} color={!hasMore ? "#9CA3AF" : "#277874"} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Report Status</Text>
              <TouchableOpacity
                onPress={() => setShowStatusModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Select Status:</Text>
              <View style={styles.statusOptions}>
                {(["REVIEWED", "RESOLVED", "DISMISSED"] as ReportStatus[]).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      newStatus === status && styles.statusOptionSelected,
                    ]}
                    onPress={() => setNewStatus(status)}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        newStatus === status && styles.statusOptionTextSelected,
                      ]}
                    >
                      {status}
                    </Text>
                    {newStatus === status && (
                      <Ionicons name="checkmark-circle" size={20} color="#277874" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowStatusModal(false)}
                disabled={updating}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={updateReportStatus}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalButtonConfirmText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Details Modal */}
      <ReportDetailsModal
        visible={showDetailsModal}
        report={detailsReport}
        onClose={() => {
          setShowDetailsModal(false);
          setDetailsReport(null);
        }}
        onStatusUpdate={loadReports}
      />
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
  metricsSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - 48) / 2,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  filtersSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  filtersContainer: {
    gap: 8,
  },
  filterButton: {
    marginRight: 8,
  },
  filterButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonInactive: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  filterButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "500",
  },
  filterButtonTextSelected: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
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
  reportActions: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    flexWrap: "wrap",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  detailsButton: {
    backgroundColor: "#D1FAE5",
  },
  reviewButton: {
    backgroundColor: "#DBEAFE",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E40AF",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  statusOptions: {
    gap: 8,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFF",
  },
  statusOptionSelected: {
    borderColor: "#277874",
    backgroundColor: "#D1FAE5",
  },
  statusOptionText: {
    fontSize: 16,
    color: "#111827",
  },
  statusOptionTextSelected: {
    color: "#277874",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#F3F4F6",
  },
  modalButtonCancelText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonConfirm: {
    backgroundColor: "#277874",
  },
  modalButtonConfirmText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
