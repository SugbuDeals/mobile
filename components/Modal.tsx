import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  Modal as RNModal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  transparent?: boolean;
  animationType?: "none" | "slide" | "fade";
  style?: any;
  contentStyle?: any;
  headerStyle?: any;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  transparent = true,
  animationType = "slide",
  style,
  contentStyle,
  headerStyle,
}: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <RNModal
      visible={isOpen}
      transparent={transparent}
      animationType={animationType}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, style]}>
        <View style={[styles.content, contentStyle]}>
          {(title || showCloseButton) && (
            <View style={[styles.header, headerStyle]}>
              {title && <Text style={styles.title}>{title}</Text>}
              {showCloseButton && (
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#277874" />
                </TouchableOpacity>
              )}
            </View>
          )}
          {children}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
});

