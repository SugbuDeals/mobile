import React, { ReactNode } from "react";
import {
  Modal as RNModal,
  ModalProps as RNModalProps,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  DimensionValue,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, borderRadius, shadows } from "@/styles/theme";

interface ModalProps extends Omit<RNModalProps, "children"> {
  children: ReactNode;
  title?: string;
  onClose: () => void;
  showCloseButton?: boolean;
  size?: "sm" | "md" | "lg" | "full";
  variant?: "default" | "bottomSheet";
}

export default function Modal({
  children,
  visible,
  title,
  onClose,
  showCloseButton = true,
  size = "md",
  variant = "default",
  ...rest
}: ModalProps) {
  const sizeStyles: Record<"sm" | "md" | "lg" | "full", { width: DimensionValue; maxWidth?: number; height?: DimensionValue }> = {
    sm: { width: "80%", maxWidth: 400 },
    md: { width: "90%", maxWidth: 500 },
    lg: { width: "95%", maxWidth: 700 },
    full: { width: "100%", height: "100%" },
  };

  if (variant === "bottomSheet") {
    return (
      <RNModal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        {...rest}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.bottomSheetContainer}
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={[styles.bottomSheetContent, sizeStyles[size]]}>
            <View style={styles.bottomSheetHandle} />
            {title && (
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>{title}</Text>
                {showCloseButton && (
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={colors.gray600} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            {children}
          </View>
        </KeyboardAvoidingView>
      </RNModal>
    );
  }

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      {...rest}
    >
      <View style={styles.centeredContainer}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalContent, sizeStyles[size]]}
        >
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {showCloseButton && (
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.gray600} />
                </TouchableOpacity>
              )}
            </View>
          )}
          {children}
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.xl,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.gray900,
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  bottomSheetContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bottomSheetContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingTop: spacing.md,
    maxHeight: "90%",
    ...shadows.xl,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: borderRadius.full,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.gray900,
    flex: 1,
  },
});

