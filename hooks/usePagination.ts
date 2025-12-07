import { useState, useCallback, useMemo, useEffect } from "react";
import { Dimensions } from "react-native";

export interface UsePaginationOptions {
  initialPage?: number;
  initialItemsPerPage?: number;
  autoCalculateItemsPerPage?: boolean;
  reservedHeight?: number;
  itemHeight?: number;
}

export interface UsePaginationReturn {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  reset: () => void;
}

/**
 * Hook for managing pagination state
 * @param totalItems - Total number of items to paginate
 * @param options - Configuration options
 * @returns Pagination state and control functions
 */
export function usePagination(
  totalItems: number,
  options: UsePaginationOptions = {}
): UsePaginationReturn {
  const {
    initialPage = 1,
    initialItemsPerPage = 10,
    autoCalculateItemsPerPage = false,
    reservedHeight = 0,
    itemHeight = 100,
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Auto-calculate items per page based on screen height
  useEffect(() => {
    if (autoCalculateItemsPerPage) {
      const calculateItemsPerPage = () => {
        const { height: windowHeight } = Dimensions.get("window");
        const availableHeight = windowHeight - reservedHeight;
        const maxItems = Math.floor(availableHeight / itemHeight);
        const optimalItems = Math.max(1, Math.min(maxItems, totalItems));
        setItemsPerPage(optimalItems);
      };

      calculateItemsPerPage();

      // Listen for orientation changes
      const subscription = Dimensions.addEventListener("change", calculateItemsPerPage);
      return () => subscription?.remove();
    }
  }, [autoCalculateItemsPerPage, reservedHeight, itemHeight, totalItems]);

  const totalPages = useMemo(
    () => Math.ceil(totalItems / itemsPerPage),
    [totalItems, itemsPerPage]
  );

  const startIndex = useMemo(
    () => (currentPage - 1) * itemsPerPage,
    [currentPage, itemsPerPage]
  );

  const endIndex = useMemo(
    () => Math.min(startIndex + itemsPerPage, totalItems),
    [startIndex, itemsPerPage, totalItems]
  );

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    setCurrentPage,
    setItemsPerPage,
    nextPage,
    previousPage,
    goToPage,
    reset,
  };
}

