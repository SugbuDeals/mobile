import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  Modal as RNModal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  type ViewStyle,
} from "react-native";
import Button from "./Button";

/**
 * Modal size options
 */
export type ModalSize = "small" | "medium" | "large" | "sm" | "md" | "lg";

/**
 * Modal visual variant
 */
export type ModalVariant = "default" | "confirmation" | "alert";

/**
 * Action button configuration for Modal
 */
export interface ModalAction {
  /** Button label text */
  label: string;
  /** Callback when button is pressed */
  onPress: () => void;
  /** Button variant style */
  variant?: "primary" | "outline" | "secondary" | "danger" | "success";
  /** Show loading state on button */
  loading?: boolean;
}

/**
 * Props for the Modal component
 */
export interface ModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal message (used in confirmation variant) */
  message?: string;
  /** Modal content */
  children?: React.ReactNode;
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Use transparent background */
  transparent?: boolean;
  /** Animation type */
  animationType?: "none" | "slide" | "fade";
  /** Custom style for overlay */
  style?: Record<string, unknown>;
  /** Custom style for content container */
  contentStyle?: Record<string, unknown>;
  /** Custom style for header */
  headerStyle?: Record<string, unknown>;
  /** Visual variant */
  variant?: ModalVariant;
  /** Size of modal */
  size?: ModalSize;
  /** Action buttons configuration */
  actions?: ModalAction[];
  /** Show loading state */
  loading?: boolean;
  /** Loading text */
  loadingText?: string;
  /** Icon name (for confirmation variant) */
  icon?: string;
  /** Icon color */
  iconColor?: string;
}

/**
 * A versatile modal component with multiple variants, sizes, and built-in action buttons.
 * 
 * Supports confirmation dialogs, alert modals, loading states, and custom content.
 * Can be used as a simple overlay or a full-featured dialog with actions.
 * 
 * @component
 * @example
 * ```tsx
 * // Basic modal
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Settings"
 * >
 *   <Text>Modal content here</Text>
 * </Modal>
 * 
 * // Confirmation dialog
 * <Modal
 *   isOpen={showConfirm}
 *   onClose={handleClose}
 *   variant="confirmation"
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item?"
 *   icon="trash-outline"
 *   iconColor="#EF4444"
 *   actions={[
 *     { label: "Cancel", onPress: handleClose, variant: "outline" },
 *     { label: "Delete", onPress: handleDelete, variant: "danger" },
 *   ]}
 * />
 * 
 * // With loading state
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   loading={isSubmitting}
 *   loadingText="Submitting..."
 * >
 *   <Form />
 * </Modal>
 * ```
 * 
 * @param {ModalProps} props - Modal component props
 * @returns {JSX.Element | null} Modal component or null if not open
 */
export function Modal({
  isOpen,
  onClose,
  title,
  message,
  children,
  showCloseButton = true,
  transparent = true,
  animationType = "slide",
  style,
  contentStyle,
  headerStyle,
  variant = "default",
  size = "medium",
  actions,
  loading = false,
  loadingText = "Loading...",
  icon,
  iconColor = "#277874",
}: ModalProps) {
  if (!isOpen) {
    return null;
  }

  const isConfirmation = variant === "confirmation" || variant === "alert";
  const showActions = actions && actions.length > 0;

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case "small":
      case "sm":
        return { width: "75%", maxWidth: 300 };
      case "large":
      case "lg":
        return { width: "95%", maxWidth: 600 };
      case "medium":
      case "md":
      default:
        return { width: "85%", maxWidth: 400 };
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#277874" />
          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
      );
    }

    if (isConfirmation) {
      return (
        <View style={styles.confirmationContent}>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
              <Ionicons name={icon as any} size={48} color={iconColor} />
            </View>
          )}
          {title && <Text style={styles.confirmationTitle}>{title}</Text>}
          {message && (
            <Text style={styles.confirmationMessage} numberOfLines={0}>
              {message}
            </Text>
          )}
          {children}
        </View>
      );
    }

    return children;
  };

  return (
    <RNModal
      visible={isOpen}
      transparent={transparent}
      animationType={animationType}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, style]}>
        <View style={[
          styles.content,
          contentStyle,
          isConfirmation && styles.confirmationModal,
          getSizeStyles(),
        ]}>
          {!isConfirmation && (title || showCloseButton) && (
            <View style={[styles.header, headerStyle]}>
              {title && <Text style={styles.title}>{title}</Text>}
              {showCloseButton && (
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#277874" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {isConfirmation ? (
            <View style={styles.confirmationScrollWrapper}>
              {renderContent()}
            </View>
          ) : (
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {renderContent()}
            </ScrollView>
          )}

          {showActions && (
            <View style={styles.actionsContainer}>
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "primary"}
                  onPress={action.onPress}
                  disabled={action.loading || loading}
                  style={styles.actionButton}
                >
                  {action.loading ? (
                    <ActivityIndicator 
                      size="small" 
                      color={action.variant === "outline" ? "#277874" : "#ffffff"} 
                    />
                  ) : (
                    action.label
                  )}
                </Button>
              ))}
            </View>
          )}

          {isConfirmation && !showActions && (
            <View style={styles.actionsContainer}>
              <Button
                variant="outline"
                onPress={onClose}
                style={styles.actionButton}
              >
                Cancel
              </Button>
            </View>
          )}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  confirmationModal: {
    padding: 0,
    alignItems: "center",
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
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
  },
  confirmationScrollWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  confirmationContent: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    width: "100%",
    justifyContent: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 12,
  },
  confirmationMessage: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 8,
    fontWeight: "400",
    width: "100%",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  actionButton: {
    minWidth: 100,
  },
});

