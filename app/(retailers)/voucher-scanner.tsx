/**
 * Voucher Scanner Screen for Retailers
 * Scan and verify consumer voucher QR codes
 */

import { useLogin } from "@/features/auth";
import { promotionsApi } from "@/services/api/endpoints/promotions";
import type { VoucherVerificationResponseDto } from "@/services/api/types/swagger";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function VoucherScannerScreen() {
  const { state: { user } } = useLogin();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedToken, setScannedToken] = useState("");
  const [verificationResult, setVerificationResult] = useState<VoucherVerificationResponseDto | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualToken, setManualToken] = useState("");

  // Request camera permission
  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (result.granted) {
      setIsScanning(true);
    }
  };

  // Handle QR code scan
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (isProcessing || !data) return;

    setScannedToken(data);
    setIsScanning(false);
    await verifyVoucher(data);
  };

  // Verify voucher with backend
  const verifyVoucher = async (token: string) => {
    setIsProcessing(true);
    try {
      const result = await promotionsApi.verifyVoucherToken({ token });
      setVerificationResult(result);
      setShowResultModal(true);
    } catch (error: any) {
      console.error("Error verifying voucher:", error);
      Alert.alert(
        "Verification Failed",
        error?.response?.data?.message || error?.message || "Invalid or expired voucher"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm voucher redemption with updated promotion (ensures voucherQuantity is decremented)
  const handleConfirmRedemption = async () => {
    if (!scannedToken || !verificationResult) return;

    Alert.alert(
      "Confirm Redemption",
      "Are you sure you want to redeem this voucher? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "default",
          onPress: async () => {
            setIsProcessing(true);
            try {
              // Use the enhanced method that ensures voucher quantity is decremented
              // Pass the promotionId from verification result to fetch updated promotion if needed
              // Note: If promotionId is not in verification result, backend should return updated promotion in confirmation response
              const result = await promotionsApi.confirmVoucherRedemptionWithUpdate(
                {
                  token: scannedToken,
                },
                verificationResult.promotionId // Pass promotionId if available to fetch updated promotion after redemption
              );

              // Log the updated promotion if available (for debugging)
              if (result.promotion) {
                console.log("Updated promotion after redemption:", result.promotion);
                console.log("Remaining vouchers:", result.promotion.voucherQuantity ?? "Unlimited");
              }

              Alert.alert("Success", "Voucher redeemed successfully!");
              setShowResultModal(false);
              setVerificationResult(null);
              setScannedToken("");
            } catch (error: any) {
              Alert.alert(
                "Redemption Failed",
                error?.response?.data?.message || error?.message || "Failed to redeem voucher"
              );
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  // Handle manual token input
  const handleManualVerify = () => {
    if (!manualToken.trim()) {
      Alert.alert("Error", "Please enter a voucher token");
      return;
    }
    setScannedToken(manualToken);
    setShowManualInput(false);
    verifyVoucher(manualToken);
  };

  // Reset scanner
  const handleReset = () => {
    setScannedToken("");
    setVerificationResult(null);
    setShowResultModal(false);
    setIsScanning(false);
  };

  // Render camera permission request
  if (!permission) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#277874" />
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerShadowContainer}>
          <LinearGradient
            colors={["#FFBE5D", "#277874"]}
            style={styles.headerContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <Ionicons name="qr-code-outline" size={24} color="#ffffff" />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle}>Voucher Scanner</Text>
                  <Text style={styles.headerSubtitle}>Scan & Verify Vouchers</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.permissionContainer}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera-outline" size={64} color="#277874" />
          </View>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to scan voucher QR codes
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handleRequestPermission}
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerShadowContainer}>
        <LinearGradient
          colors={["#FFBE5D", "#277874"]}
          style={styles.headerContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="qr-code-outline" size={24} color="#ffffff" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Voucher Scanner</Text>
                <Text style={styles.headerSubtitle}>Scan & Verify Vouchers</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {!isScanning && !isProcessing && (
          <View style={styles.actionContainer}>
            <Text style={styles.instructionTitle}>How to Scan</Text>
            <View style={styles.instructionCard}>
              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>Ask customer to show their voucher QR code</Text>
              </View>
              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>Tap &quot;Start Scanning&quot; button below.</Text>
              </View>
              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>Point camera at QR code</Text>
              </View>
              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={styles.stepText}>Verify customer details and confirm redemption</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => setIsScanning(true)}
            >
              <Ionicons name="qr-code-outline" size={24} color="#fff" />
              <Text style={styles.scanButtonText}>Start Scanning</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => setShowManualInput(true)}
            >
              <Ionicons name="create-outline" size={20} color="#277874" />
              <Text style={styles.manualButtonText}>Enter Token Manually</Text>
            </TouchableOpacity>
          </View>
        )}

        {isScanning && (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
            >
              <View style={styles.cameraOverlay}>
                <View style={styles.scanArea}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <Text style={styles.scanText}>Position QR code within frame</Text>
              </View>
            </CameraView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsScanning(false)}
            >
              <Ionicons name="close-circle" size={24} color="#fff" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#277874" />
            <Text style={styles.processingText}>Verifying voucher...</Text>
          </View>
        )}
      </ScrollView>

      {/* Verification Result Modal */}
      {showResultModal && verificationResult && (
        <Modal
          visible={showResultModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowResultModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {verificationResult.valid ? "Voucher Verified" : "Invalid Voucher"}
                </Text>
                <TouchableOpacity
                  onPress={handleReset}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                {verificationResult.valid ? (
                  <>
                    {/* Status Badge */}
                    <View style={[
                      styles.statusBadge,
                      verificationResult.status === 'VERIFIED' && styles.statusVerified,
                      verificationResult.status === 'REDEEMED' && styles.statusRedeemed,
                    ]}>
                      <Ionicons 
                        name={
                          verificationResult.status === 'VERIFIED' ? "checkmark-circle" :
                          verificationResult.status === 'REDEEMED' ? "checkmark-done-circle" :
                          "time"
                        }
                        size={20}
                        color={
                          verificationResult.status === 'VERIFIED' ? "#059669" :
                          verificationResult.status === 'REDEEMED' ? "#DC2626" :
                          "#3B82F6"
                        }
                      />
                      <Text style={styles.statusText}>
                        {verificationResult.status === 'VERIFIED' && 'Verified - Ready to Redeem'}
                        {verificationResult.status === 'REDEEMED' && 'Already Redeemed'}
                        {verificationResult.status === 'PENDING' && 'Pending Verification'}
                      </Text>
                    </View>

                    {/* Consumer Details */}
                    <View style={styles.detailsCard}>
                      <Text style={styles.detailsTitle}>Consumer Information</Text>
                      
                      <View style={styles.detailRow}>
                        <Ionicons name="person" size={18} color="#6B7280" />
                        <Text style={styles.detailLabel}>Name:</Text>
                        <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                          {verificationResult.userName}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons name="card" size={18} color="#6B7280" />
                        <Text style={styles.detailLabel}>Tier:</Text>
                        <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                          {verificationResult.subscriptionTier}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons name="cash" size={18} color="#6B7280" />
                        <Text style={styles.detailLabel}>Value:</Text>
                        <Text style={styles.detailValue}>
                          ₱{verificationResult.voucherValue.toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons name="ticket" size={18} color="#6B7280" />
                        <Text style={styles.detailLabel}>Promotion:</Text>
                        <Text style={styles.detailValue} numberOfLines={2} ellipsizeMode="tail">
                          {verificationResult.promotionTitle}
                        </Text>
                      </View>

                      {verificationResult.productId !== undefined && (
                        <View style={styles.detailRow}>
                          <Ionicons name="cube" size={18} color="#6B7280" />
                          <Text style={styles.detailLabel}>Product ID:</Text>
                          <Text style={styles.detailValue}>
                            {verificationResult.productId}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Action Buttons */}
                    {verificationResult.status === 'VERIFIED' && (
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleConfirmRedemption}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.confirmButtonText}>Confirm Redemption</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {verificationResult.status === 'REDEEMED' && (
                      <View style={styles.redeemedBanner}>
                        <Ionicons name="information-circle" size={20} color="#DC2626" />
                        <Text style={styles.redeemedText}>
                          This voucher has already been redeemed and cannot be used again
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.errorCard}>
                    <Ionicons name="close-circle" size={48} color="#EF4444" />
                    <Text style={styles.errorTitle}>Invalid Voucher</Text>
                    <Text style={styles.errorMessage}>
                      {verificationResult.message || "This voucher is invalid or has expired"}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.scanAnotherButton}
                  onPress={handleReset}
                >
                  <Ionicons name="scan" size={20} color="#277874" />
                  <Text style={styles.scanAnotherButtonText}>Scan Another Voucher</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Manual Input Modal */}
      {showManualInput && (
        <Modal
          visible={showManualInput}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowManualInput(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Enter Voucher Token</Text>
                <TouchableOpacity
                  onPress={() => setShowManualInput(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.manualInputContainer}>
                <Text style={styles.manualInputLabel}>Voucher Token</Text>
                <TextInput
                  style={styles.manualTokenInput}
                  placeholder="Paste voucher token here"
                  value={manualToken}
                  onChangeText={setManualToken}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={handleManualVerify}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.verifyButtonText}>Verify Token</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  headerShadowContainer: {
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  headerContainer: {
    paddingTop: Platform.OS === "ios" ? 40 : (StatusBar.currentHeight || 0) + 4,
    paddingBottom: 10,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
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
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  permissionIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E0F2F1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  permissionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#277874",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  actionContainer: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  instructionCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    gap: 16,
  },
  instructionStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#277874",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#277874",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 12,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  manualButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0F2F1",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#277874",
  },
  manualButtonText: {
    color: "#277874",
    fontSize: 16,
    fontWeight: "600",
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 500,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#277874",
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanText: {
    marginTop: 280,
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
  cancelButton: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    marginHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  processingText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
  },
  statusVerified: {
    backgroundColor: "#D1FAE5",
  },
  statusRedeemed: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  detailsCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    minWidth: 70,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  redeemedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 10,
    marginBottom: 12,
  },
  redeemedText: {
    flex: 1,
    fontSize: 14,
    color: "#DC2626",
    fontWeight: "500",
  },
  errorCard: {
    alignItems: "center",
    padding: 32,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#EF4444",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  scanAnotherButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0F2F1",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#277874",
  },
  scanAnotherButtonText: {
    color: "#277874",
    fontSize: 16,
    fontWeight: "600",
  },
  // Manual input styles
  manualInputContainer: {
    padding: 20,
  },
  manualInputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  manualTokenInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#374151",
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#277874",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});



