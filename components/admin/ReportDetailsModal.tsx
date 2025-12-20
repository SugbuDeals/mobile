import { useNotifications } from "@/features/notifications";
import { reportsApi } from "@/services/api/endpoints/reports";
import { reviewsApi } from "@/services/api/endpoints/reviews";
import { storesApi } from "@/services/api/endpoints/stores";
import type { ReportResponseDto, ReviewResponseDto } from "@/services/api/types/swagger";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ReportDetailsModalProps {
  visible: boolean;
  report: ReportResponseDto | null;
  onClose: () => void;
  onStatusUpdate: () => void;
}

interface ReportStats {
  totalReports: number;
  reportsByReason: Record<string, number>;
  reportsByStatus: Record<string, number>;
}

export default function ReportDetailsModal({
  visible,
  report,
  onClose,
  onStatusUpdate,
}: ReportDetailsModalProps) {
  const { action: notificationActions } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [reporterReviews, setReporterReviews] = useState<ReviewResponseDto[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<"REVIEWED" | "RESOLVED" | "DISMISSED">("REVIEWED");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [warningTarget, setWarningTarget] = useState<"reported" | "reporter" | null>(null);

  const getDefaultWarningMessage = () => {
    if (!report) return "";
    const reportedEntity = report.reportedStoreName || report.reportedUserName || "your account";
    const reason = report.reason === "SPAM" ? "spam behavior" :
                   report.reason === "HARASSMENT" ? "harassment" :
                   report.reason === "INAPPROPRIATE_CONTENT" ? "inappropriate content" :
                   report.reason === "FAKE_REVIEW" ? "fake reviews" :
                   report.reason === "SCAM" ? "scam activities" :
                   "inappropriate behavior";
    return `You have been reported for ${reason} related to ${reportedEntity}. Please review our community guidelines and ensure your actions comply with our terms of service. Continued violations may result in account suspension.`;
  };

  const loadDetails = useCallback(async () => {
    if (!report) return;

    setLoading(true);
    try {
      // Load store info if reporting a store
      if (report.reportedStoreId) {
        try {
          const store = await storesApi.findStoreById(report.reportedStoreId);
          setStoreInfo(store);
        } catch (error) {
          console.error("Failed to load store:", error);
        }
      }

      // Load report statistics
      if (report.reportedStoreId) {
        const allStoreReports = await reportsApi.getReportsByStore(report.reportedStoreId);
        const stats: ReportStats = {
          totalReports: allStoreReports.length,
          reportsByReason: {},
          reportsByStatus: {},
        };
        allStoreReports.forEach((r) => {
          stats.reportsByReason[r.reason] = (stats.reportsByReason[r.reason] || 0) + 1;
          stats.reportsByStatus[r.status] = (stats.reportsByStatus[r.status] || 0) + 1;
        });
        setReportStats(stats);
      } else if (report.reportedUserId) {
        // Fetch reports ABOUT the user (received reports)
        const allUserReports = await reportsApi.getReportsByUser(report.reportedUserId, {
          type: "received",
        });
        const stats: ReportStats = {
          totalReports: allUserReports.length,
          reportsByReason: {},
          reportsByStatus: {},
        };
        allUserReports.forEach((r) => {
          stats.reportsByReason[r.reason] = (stats.reportsByReason[r.reason] || 0) + 1;
          stats.reportsByStatus[r.status] = (stats.reportsByStatus[r.status] || 0) + 1;
        });
        setReportStats(stats);
      }

      // Load reporter's review history
      if (report.reporterId) {
        setLoadingReviews(true);
        try {
          // Get all stores and fetch reviews from each to find reporter's reviews
          // This is a simplified approach - in production, you might want a dedicated endpoint
          const stores = await storesApi.findStores({ take: 100 });
          const allReviews: ReviewResponseDto[] = [];
          
          for (const store of stores.slice(0, 20)) { // Limit to first 20 stores for performance
            try {
              const reviews = await reviewsApi.getStoreReviews(store.id, { take: 50 });
              const userReviews = reviews.filter((r) => r.userId === report.reporterId);
              allReviews.push(...userReviews);
            } catch {
              // Silently continue if store has no reviews
            }
          }
          
          // Sort by date and show most recent
          allReviews.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setReporterReviews(allReviews.slice(0, 10)); // Show last 10 reviews
        } catch (error) {
          console.error("Failed to load reviews:", error);
        } finally {
          setLoadingReviews(false);
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load report details");
    } finally {
      setLoading(false);
    }
  }, [report]);

  useEffect(() => {
    if (visible && report) {
      loadDetails();
    }
  }, [visible, report, loadDetails]);

  const handleUpdateStatus = async () => {
    if (!report) return;

    try {
      setUpdating(true);
      await reportsApi.updateReportStatus(report.id, { status: newStatus });
      Alert.alert("Success", "Report status updated successfully");
      onStatusUpdate();
      onClose();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update report status");
    } finally {
      setUpdating(false);
    }
  };

  const handleSendWarning = async () => {
    if (!report) {
      Alert.alert("Error", "Report not found");
      return;
    }
    
    if (!warningTarget) {
      Alert.alert("Error", "Please select who to warn");
      return;
    }
    
    const finalMessage = warningMessage.trim() || getDefaultWarningMessage();
    if (!finalMessage) {
      Alert.alert("Error", "Please enter a warning message");
      return;
    }

    try {
      setUpdating(true);
      
      // Determine target user based on selection
      let targetUserId: number | undefined;
      if (warningTarget === "reported") {
        // Warn the reported user/store owner
        targetUserId = report.reportedUserId || (storeInfo?.ownerId);
      } else if (warningTarget === "reporter") {
        // Warn the reporter
        targetUserId = report.reporterId;
      }
      
      if (!targetUserId) {
        Alert.alert("Error", "Cannot determine target user");
        return;
      }

      // Create warning notification
      await notificationActions.createNotification({
        userId: targetUserId,
        type: "STORE_UNDER_REVIEW", // Using existing type for warnings
        title: "⚠️ Account Warning",
        message: finalMessage,
      });

      // Update report status to REVIEWED
      await reportsApi.updateReportStatus(report.id, { status: "REVIEWED" });

      Alert.alert("Success", "Warning sent successfully");
      setShowWarningModal(false);
      setWarningMessage("");
      setWarningTarget(null);
      onStatusUpdate();
      onClose();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to send warning");
    } finally {
      setUpdating(false);
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

  if (!report) return null;

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Report Details #{report.id}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.scrollContent} 
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#277874" />
                  <Text style={styles.loadingText}>Loading details...</Text>
                </View>
              ) : (
                <>
                  {/* Report Information */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Report Information</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Reporter:</Text>
                      <Text style={styles.value}>{report.reporterName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Reported:</Text>
                      <Text style={styles.value}>
                        {report.reportedStoreName || report.reportedUserName || "Unknown"}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Reason:</Text>
                      <Text style={styles.value}>{getReasonLabel(report.reason)}</Text>
                    </View>
                    {report.description && (
                      <View style={styles.descriptionBox}>
                        <Text style={styles.label}>Description:</Text>
                        <Text style={styles.descriptionText}>{report.description}</Text>
                      </View>
                    )}
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Status:</Text>
                      <Text style={styles.value}>{report.status}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Created:</Text>
                      <Text style={styles.value}>
                        {new Date(report.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* Store Information (if reporting a store) */}
                  {storeInfo && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Store Information</Text>
                      <View style={styles.infoRow}>
                        <Text style={styles.label}>Store Name:</Text>
                        <Text style={styles.value}>{storeInfo.name}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.label}>Status:</Text>
                        <Text style={styles.value}>{storeInfo.verificationStatus}</Text>
                      </View>
                      {storeInfo.address && (
                        <View style={styles.infoRow}>
                          <Text style={styles.label}>Address:</Text>
                          <Text style={styles.value}>{storeInfo.address}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Report Statistics */}
                  {reportStats && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Report Statistics</Text>
                      <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Reports</Text>
                        <Text style={styles.statValue}>{reportStats.totalReports}</Text>
                      </View>
                      
                      <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                          <Text style={styles.statItemLabel}>By Reason:</Text>
                          {Object.entries(reportStats.reportsByReason).map(([reason, count]) => (
                            <View key={reason} style={styles.statRow}>
                              <Text style={styles.statItemValue}>
                                {getReasonLabel(reason)}: {count}
                              </Text>
                            </View>
                          ))}
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statItemLabel}>By Status:</Text>
                          {Object.entries(reportStats.reportsByStatus).map(([status, count]) => (
                            <View key={status} style={styles.statRow}>
                              <Text style={styles.statItemValue}>
                                {status}: {count}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Reporter's Review History */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reporter&apos;s Review History</Text>
                    {loadingReviews ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#277874" />
                        <Text style={styles.loadingText}>Loading reviews...</Text>
                      </View>
                    ) : reporterReviews.length > 0 ? (
                      <View style={styles.reviewsList}>
                        {reporterReviews.map((review) => (
                          <View key={review.id} style={styles.reviewItem}>
                            <View style={styles.reviewHeader}>
                              <Text style={styles.reviewStore}>
                                Store: {review.storeId || "Unknown"}
                              </Text>
                              {review.rating && (
                                <View style={styles.ratingStars}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Ionicons
                                      key={star}
                                      name={star <= review.rating! ? "star" : "star-outline"}
                                      size={12}
                                      color="#FFD700"
                                    />
                                  ))}
                                </View>
                              )}
                            </View>
                            <Text style={styles.reviewComment} numberOfLines={3}>
                              {review.comment}
                            </Text>
                            <Text style={styles.reviewDate}>
                              {new Date(review.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.noDataText}>No reviews found</Text>
                    )}
                  </View>

                  {/* Actions */}
                  {report.status === "PENDING" && (
                    <View style={styles.actionsSection}>
                      <Text style={styles.sectionTitle}>Actions</Text>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.warningButton]}
                          onPress={() => {
                            setWarningMessage(getDefaultWarningMessage());
                            setWarningTarget(null);
                            setShowWarningModal(true);
                          }}
                          disabled={updating}
                        >
                          <Ionicons name="warning-outline" size={18} color="#F59E0B" />
                          <Text style={styles.actionButtonText}>Warn User</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.resolveButton]}
                          onPress={() => {
                            setNewStatus("RESOLVED");
                            handleUpdateStatus();
                          }}
                          disabled={updating}
                        >
                          <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                          <Text style={styles.actionButtonText}>Resolve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.dismissButton]}
                          onPress={() => {
                            setNewStatus("DISMISSED");
                            handleUpdateStatus();
                          }}
                          disabled={updating}
                        >
                          <Ionicons name="close-circle-outline" size={18} color="#6B7280" />
                          <Text style={styles.actionButtonText}>Dismiss</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Warning Modal */}
      <Modal
        visible={showWarningModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowWarningModal(false);
          setWarningMessage("");
          setWarningTarget(null);
        }}
      >
        <View style={styles.warningOverlay}>
          <View style={styles.warningModal}>
            <Text style={styles.warningTitle}>Send Warning</Text>
            <Text style={styles.warningSubtitle}>
              Select who to warn and enter a warning message
            </Text>
            
            {/* Target Selection */}
            <View style={styles.warningTargetContainer}>
              <Text style={styles.warningLabel}>Warn:</Text>
              <View style={styles.warningTargetButtons}>
                <TouchableOpacity
                  style={[
                    styles.warningTargetButton,
                    warningTarget === "reported" && styles.warningTargetButtonActive,
                  ]}
                  onPress={() => setWarningTarget("reported")}
                >
                  <Text
                    style={[
                      styles.warningTargetButtonText,
                      warningTarget === "reported" && styles.warningTargetButtonTextActive,
                    ]}
                  >
                    {report.reportedStoreName || report.reportedUserName || "Reported User/Store"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.warningTargetButton,
                    warningTarget === "reporter" && styles.warningTargetButtonActive,
                  ]}
                  onPress={() => setWarningTarget("reporter")}
                >
                  <Text
                    style={[
                      styles.warningTargetButtonText,
                      warningTarget === "reporter" && styles.warningTargetButtonTextActive,
                    ]}
                  >
                    Reporter ({report.reporterName})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.warningInputContainer}>
              <Text style={styles.warningLabel}>Warning Message:</Text>
              <TextInput
                style={styles.warningInput}
                placeholder="Enter warning message..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                value={warningMessage}
                onChangeText={setWarningMessage}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.warningActions}>
              <TouchableOpacity
                style={[styles.warningButton, styles.warningCancelButton]}
                onPress={() => {
                  setShowWarningModal(false);
                  setWarningMessage("");
                  setWarningTarget(null);
                }}
              >
                <Text style={styles.warningCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.warningButton,
                  styles.warningSendButton,
                  !warningTarget && styles.warningSendButtonDisabled,
                ]}
                onPress={handleSendWarning}
                disabled={updating || !warningTarget}
              >
                {updating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.warningSendText}>Send Warning</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    maxHeight: "90%",
    width: "100%",
    overflow: "hidden",
    flexShrink: 1,
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  label: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    width: 100,
    flexShrink: 0,
  },
  value: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  descriptionBox: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  descriptionText: {
    fontSize: 14,
    color: "#111827",
    marginTop: 4,
    lineHeight: 20,
  },
  statCard: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#277874",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
  },
  statItemLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  statRow: {
    marginBottom: 4,
  },
  statItemValue: {
    fontSize: 12,
    color: "#111827",
  },
  reviewsList: {
    gap: 8,
  },
  reviewItem: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewStore: {
    fontSize: 12,
    fontWeight: "600",
    color: "#277874",
  },
  ratingStars: {
    flexDirection: "row",
    gap: 2,
  },
  reviewComment: {
    fontSize: 13,
    color: "#111827",
    lineHeight: 18,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  noDataText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
  actionsSection: {
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    minWidth: 100,
    justifyContent: "center",
  },
  warningButton: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  resolveButton: {
    backgroundColor: "#D1FAE5",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  dismissButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#6B7280",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
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
  warningOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  warningModal: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  warningSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  warningInputContainer: {
    marginBottom: 20,
  },
  warningLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  warningInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    backgroundColor: "#FFF",
    fontSize: 14,
    color: "#111827",
    textAlignVertical: "top",
  },
  warningActions: {
    flexDirection: "row",
    gap: 12,
  },
  warningCancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  warningCancelText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  warningSendButton: {
    flex: 1,
    backgroundColor: "#F59E0B",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  warningSendText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  warningSendButtonDisabled: {
    opacity: 0.5,
  },
  warningTargetContainer: {
    marginBottom: 16,
  },
  warningTargetButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  warningTargetButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
  },
  warningTargetButtonActive: {
    borderColor: "#F59E0B",
    backgroundColor: "#FEF3C7",
  },
  warningTargetButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
  },
  warningTargetButtonTextActive: {
    color: "#92400E",
    fontWeight: "600",
  },
});
