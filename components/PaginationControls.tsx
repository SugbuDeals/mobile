import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { usePagination } from "@/hooks/usePagination";

export interface PaginationControlsProps {
  totalItems: number;
  initialPage?: number;
  initialItemsPerPage?: number;
  autoCalculateItemsPerPage?: boolean;
  reservedHeight?: number;
  itemHeight?: number;
  onPageChange?: (page: number) => void;
  style?: any;
}

export function PaginationControls({
  totalItems,
  initialPage = 1,
  initialItemsPerPage = 10,
  autoCalculateItemsPerPage = false,
  reservedHeight = 0,
  itemHeight = 100,
  onPageChange,
  style,
}: PaginationControlsProps) {
  const {
    currentPage,
    totalPages,
    nextPage,
    previousPage,
    goToPage,
  } = usePagination(totalItems, {
    initialPage,
    initialItemsPerPage,
    autoCalculateItemsPerPage,
    reservedHeight,
    itemHeight,
  });

  React.useEffect(() => {
    onPageChange?.(currentPage);
  }, [currentPage, onPageChange]);

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
        <Text style={styles.pageText}>
          {currentPage} / {totalPages}
        </Text>
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
});

