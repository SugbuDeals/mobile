import { useState, useCallback, useMemo } from "react";

export interface UseSearchOptions<T> {
  initialQuery?: string;
  filterFn?: (item: T, query: string) => boolean;
  debounceMs?: number;
}

export interface UseSearchReturn<T> {
  query: string;
  setQuery: (query: string) => void;
  clear: () => void;
  filteredItems: T[];
  isSearching: boolean;
}

/**
 * Hook for managing search query and filtering items
 * @param items - Array of items to filter
 * @param options - Configuration options
 * @returns Search state and filtered results
 */
export function useSearch<T>(
  items: T[],
  options: UseSearchOptions<T> = {}
): UseSearchReturn<T> {
  const { initialQuery = "", filterFn, debounceMs } = options;
  const [query, setQuery] = useState(initialQuery);

  const defaultFilterFn = useCallback((item: T, searchQuery: string): boolean => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const itemStr = JSON.stringify(item).toLowerCase();
    return itemStr.includes(query);
  }, []);

  const filterFunction = filterFn || defaultFilterFn;

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    return items.filter((item) => filterFunction(item, query));
  }, [items, query, filterFunction]);

  const clear = useCallback(() => {
    setQuery("");
  }, []);

  const isSearching = query.trim().length > 0;

  return {
    query,
    setQuery,
    clear,
    filteredItems,
    isSearching,
  };
}

