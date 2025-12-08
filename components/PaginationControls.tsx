import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, ScrollView, ViewStyle } from "react-native";
import { usePagination } from "@/hooks/usePagination";

/**
 * Pagination state information returned to children render function
 */
export interface PaginationState {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Number of items per page */
  itemsPerPage: number;
  /** Start index of current page items */
  startIndex: number;
  /** End index of current page items */
  endIndex: number;
}

/**
 * Props for the PaginationControls component
 * 
 * @interface PaginationControlsProps
 * @template T - Type of items being paginated
 */
export interface PaginationControlsProps<T = any> {
  /** Total number of items to paginate */
  totalItems: number;
  /** Array of items to paginate (required when using children render prop) */
  items?: T[];
  /** Initial page number (1-indexed) */
  initialPage?: number;
  /** Initial number of items per page */
  initialItemsPerPage?: number;
  /** Automatically calculate items per page based on screen size */
  autoCalculateItemsPerPage?: boolean;
  /** Reserved height for other UI elements when auto-calculating */
  reservedHeight?: number;
  /** Estimated height of each item when auto-calculating */
  itemHeight?: number;
  /** Callback fired when page changes */
  onPageChange?: (page: number) => void;
  /** Callback fired when items per page changes */
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  /** Show items per page selector */
  showItemsPerPageSelector?: boolean;
  /** Available items per page options */
  itemsPerPageOptions?: number[];
  /** Show jump to page functionality */
  showJumpToPage?: boolean;
  /** Custom style for container */
  style?: ViewStyle;
  /** Render prop function that receives paginated items and state */
  children?: (paginatedItems: T[], paginationState: PaginationState) => React.ReactNode;
}

/**
 * A comprehensive pagination component with full state management and advanced features.
 * 
 * Supports render prop pattern for automatic item slicing, items per page selector,
 * jump to page functionality, and auto-calculation of items per page based on screen size.
 * 
 * @component
 * @template T - Type of items being paginated
 * 
 * @example
 * ```tsx
 * // Basic usage with render prop
 * <PaginationControls
 *   totalItems={products.length}
 *   items={products}
 *   initialItemsPerPage={10}
 * >
 *   {(paginatedItems, state) => (
 *     <>
 *       {paginatedItems.map(item => <ItemCard key={item.id} item={item} />)}
 *       <Text>Page {state.currentPage} of {state.totalPages}</Text>
 *     </>
 *   )}
 * </PaginationControls>
 * 
 * // With items per page selector
 * <PaginationControls
 *   totalItems={items.length}
 *   showItemsPerPageSelector
 *   itemsPerPageOptions={[10, 25, 50, 100]}
 *   onPageChange={(page) => console.log('Page:', page)}
 * />
 * 
 * // With jump to page
 * <PaginationControls
 *   totalItems={items.length}
 *   showJumpToPage
 *   initialItemsPerPage={20}
 * />
 * ```
 * 
 * @param {PaginationControlsProps<T>} props - PaginationControls component props
 * @returns {JSX.Element | null} PaginationControls component or null if only one page
 */
export function PaginationControls<T = any>({
  totalItems,
  items,
  initialPage = 1,
  initialItemsPerPage = 10,
  autoCalculateItemsPerPage = false,
  reservedHeight = 0,
  itemHeight = 100,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPageSelector = false,
  itemsPerPageOptions = [5, 10, 20, 50],
  showJumpToPage = false,
  style,
  children,
}: PaginationControlsProps<T>) {
  const [jumpToPageModalVisible, setJumpToPageModalVisible] = useState(false);
  const [jumpToPageValue, setJumpToPageValue] = useState("");

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex,
    endIndex,
    nextPage,
    previousPage,
    goToPage,
    setItemsPerPage,
  } = usePagination(totalItems, {
    initialPage,
    initialItemsPerPage,
    autoCalculateItemsPerPage,
    reservedHeight,
    itemHeight,
  });

  // Auto-reset to page 1 when total items change significantly
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      goToPage(1);
    }
  }, [totalItems, currentPage, totalPages, goToPage]);

  useEffect(() => {
    onPageChange?.(currentPage);
  }, [currentPage, onPageChange]);

  useEffect(() => {
    onItemsPerPageChange?.(itemsPerPage);
  }, [itemsPerPage, onItemsPerPageChange]);

  const handleJumpToPage = () => {
    const page = parseInt(jumpToPageValue, 10);
    if (page >= 1 && page <= totalPages) {
      goToPage(page);
      setJumpToPageModalVisible(false);
      setJumpToPageValue("");
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    goToPage(1); // Reset to first page when changing items per page
  };

  // Calculate paginated items if items array is provided
  const paginatedItems = items
    ? items.slice(startIndex, endIndex)
    : [];

  // If children is provided, render with paginated items
  if (children) {
    return (
      <>
        {children(paginatedItems, {
          currentPage,
          totalPages,
          itemsPerPage,
          startIndex,
          endIndex,
        })}
        {totalPages > 1 && (
          <View style={[styles.container, style]}>
            <TouchableOpacity
              onPress={previousPage}
              disabled={currentPage === 1}
              style={[styles.button, currentPage === 1 && styles.buttonDisabled]}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={currentPage === 1 ? "#9ca3af" : "#277874"}
              />
            </TouchableOpacity>

            <View style={styles.pageInfo}>
              {showJumpToPage && totalPages > 5 ? (
                <TouchableOpacity
                  onPress={() => setJumpToPageModalVisible(true)}
                  style={styles.jumpToButton}
                >
                  <Text style={styles.pageText}>
                    {currentPage} / {totalPages}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.pageText}>
                  {currentPage} / {totalPages}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={nextPage}
              disabled={currentPage === totalPages}
              style={[
                styles.button,
                currentPage === totalPages && styles.buttonDisabled,
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={currentPage === totalPages ? "#9ca3af" : "#277874"}
              />
            </TouchableOpacity>

            {showItemsPerPageSelector && (
              <View style={styles.itemsPerPageContainer}>
                <Text style={styles.itemsPerPageLabel}>Per page:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsPerPageOptions}>
                  {itemsPerPageOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => handleItemsPerPageChange(option)}
                      style={[
                        styles.itemsPerPageOption,
                        itemsPerPage === option && styles.itemsPerPageOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.itemsPerPageOptionText,
                          itemsPerPage === option && styles.itemsPerPageOptionTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Jump to Page Modal */}
        <Modal
          visible={jumpToPageModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setJumpToPageModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Jump to Page</Text>
              <TextInput
                style={styles.jumpToInput}
                placeholder="Page number"
                keyboardType="number-pad"
                value={jumpToPageValue}
                onChangeText={setJumpToPageValue}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => {
                    setJumpToPageModalVisible(false);
                    setJumpToPageValue("");
                  }}
                  style={[styles.modalButton, styles.modalButtonCancel]}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleJumpToPage}
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>Go</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // Original behavior - just show controls
  if (totalPages <= 1) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        onPress={previousPage}
        disabled={currentPage === 1}
        style={[styles.button, currentPage === 1 && styles.buttonDisabled]}
      >
        <Ionicons
          name="chevron-back"
          size={20}
          color={currentPage === 1 ? "#9ca3af" : "#277874"}
        />
      </TouchableOpacity>

      <View style={styles.pageInfo}>
        {showJumpToPage && totalPages > 5 ? (
          <TouchableOpacity
            onPress={() => setJumpToPageModalVisible(true)}
            style={styles.jumpToButton}
          >
            <Text style={styles.pageText}>
              {currentPage} / {totalPages}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.pageText}>
            {currentPage} / {totalPages}
          </Text>
        )}
      </View>

      <TouchableOpacity
        onPress={nextPage}
        disabled={currentPage === totalPages}
        style={[
          styles.button,
          currentPage === totalPages && styles.buttonDisabled,
        ]}
      >
        <Ionicons
          name="chevron-forward"
          size={20}
          color={currentPage === totalPages ? "#9ca3af" : "#277874"}
        />
      </TouchableOpacity>

      {showItemsPerPageSelector && (
        <View style={styles.itemsPerPageContainer}>
          <Text style={styles.itemsPerPageLabel}>Per page:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsPerPageOptions}>
            {itemsPerPageOptions.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => handleItemsPerPageChange(option)}
                style={[
                  styles.itemsPerPageOption,
                  itemsPerPage === option && styles.itemsPerPageOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.itemsPerPageOptionText,
                    itemsPerPage === option && styles.itemsPerPageOptionTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Jump to Page Modal */}
      <Modal
        visible={jumpToPageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setJumpToPageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Jump to Page</Text>
            <TextInput
              style={styles.jumpToInput}
              placeholder="Page number"
              keyboardType="number-pad"
              value={jumpToPageValue}
              onChangeText={setJumpToPageValue}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setJumpToPageModalVisible(false);
                  setJumpToPageValue("");
                }}
                style={[styles.modalButton, styles.modalButtonCancel]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleJumpToPage}
                style={[styles.modalButton, styles.modalButtonConfirm]}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>Go</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 16,
    flexWrap: "wrap",
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pageInfo: {
    minWidth: 60,
    alignItems: "center",
  },
  pageText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  jumpToButton: {
    padding: 4,
  },
  itemsPerPageContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
    gap: 8,
  },
  itemsPerPageLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  itemsPerPageOptions: {
    flexDirection: "row",
  },
  itemsPerPageOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    marginRight: 6,
  },
  itemsPerPageOptionActive: {
    backgroundColor: "#277874",
  },
  itemsPerPageOptionText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  itemsPerPageOptionTextActive: {
    color: "#ffffff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  jumpToInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalButtonCancel: {
    backgroundColor: "#f3f4f6",
  },
  modalButtonConfirm: {
    backgroundColor: "#277874",
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  modalButtonTextConfirm: {
    color: "#ffffff",
  },
});

