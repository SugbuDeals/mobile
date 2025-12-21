/**
 * Popup component that shows when a voucher is redeemed by retailer
 */

import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface VoucherRedeemedPopupProps {
  visible: boolean;
  onClose: () => void;
  storeId?: number;
  promotionId?: number;
}

export function VoucherRedeemedPopup({
  visible,
  onClose,
  storeId,
  promotionId,
}: VoucherRedeemedPopupProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up and fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      // Reset animations
      slideAnim.setValue(300);
      fadeAnim.setValue(0);
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleClose = () => {
    // Slide down and fade out
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <LinearGradient
            colors={["#10B981", "#059669"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.content}>
              {/* Success Icon */}
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Ionicons name="checkmark-circle" size={48} color="#ffffff" />
                </View>
              </View>

              {/* Title */}
              <Text style={styles.title}>Voucher Claimed!</Text>

              {/* Message */}
              <Text style={styles.message}>
                Your voucher has been successfully confirmed by the retailer. Enjoy your discount!
              </Text>

              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.8}>
                <Text style={styles.closeButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
  },
  container: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradient: {
    padding: 24,
  },
  content: {
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
    opacity: 0.95,
  },
  closeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});

