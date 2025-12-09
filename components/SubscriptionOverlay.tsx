import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

interface SubscriptionOverlayProps {
  visible: boolean;
  currentCount: number;
  maxCount: number;
  onDismiss: () => void;
  onUpgrade: () => void | Promise<void>;
  upgradePrice?: string;
  validityDays?: number;
  isLoading?: boolean;
}

export default function SubscriptionOverlay({
  visible,
  currentCount,
  maxCount,
  onDismiss,
  onUpgrade,
  upgradePrice = "$100",
  validityDays = 7,
  isLoading = false,
}: SubscriptionOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header with Gradient */}
          <LinearGradient
            colors={["#FFBE5D", "#277874"]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.headerIconContainer}>
              <Ionicons name="storefront" size={40} color="#ffffff" />
            </View>
            <Text style={styles.headerTitle}>Product Limit Reached</Text>
            <Text style={styles.headerSubtitle}>
              You've reached your maximum of {maxCount} products
            </Text>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            {/* Product Limit Alert */}
            <View style={styles.alertBox}>
              <Ionicons name="warning" size={24} color="#DC2626" />
              <View style={styles.alertTextContainer}>
                <Text style={styles.alertTitle}>
                  Maximum Products: {currentCount}/{maxCount}
                </Text>
                <Text style={styles.alertSubtitle}>
                  Upgrade to add more products
                </Text>
              </View>
            </View>

            {/* Validity Notice */}
            <View style={styles.validityBox}>
              <Ionicons name="time-outline" size={24} color="#F59E0B" />
              <Text style={styles.validityText}>
                Valid for {validityDays} days only
              </Text>
            </View>

            {/* Upgrade Button */}
            <TouchableOpacity
              style={[styles.upgradeButton, isLoading && styles.upgradeButtonDisabled]}
              onPress={onUpgrade}
              disabled={isLoading}
            >
              <Ionicons name="card" size={20} color="#ffffff" />
              <Text style={styles.upgradeButtonText}>
                {isLoading ? "Processing..." : "Please go to subscription page to apply for plans"}
              </Text>
            </TouchableOpacity>

            {/* Dismiss Button */}
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={onDismiss}
            >
              <Text style={styles.dismissButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
    textAlign: "center",
  },
  content: {
    padding: 24,
  },
  alertBox: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  alertTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#DC2626",
    marginBottom: 4,
  },
  alertSubtitle: {
    fontSize: 14,
    color: "#DC2626",
  },
  validityBox: {
    flexDirection: "row",
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  validityText: {
    fontSize: 14,
    color: "#F59E0B",
    marginLeft: 12,
    fontWeight: "500",
  },
  upgradeButton: {
    flexDirection: "row",
    backgroundColor: "#277874",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 8,
  },
  dismissButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
  },
  upgradeButtonDisabled: {
    opacity: 0.6,
  },
});

