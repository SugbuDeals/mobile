import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState, useCallback } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View, ScrollView, Text } from "react-native";
import { useSearch } from "@/hooks/useSearch";

/**
 * Filter preset configuration for SearchBar
 * 
 * @interface FilterPreset
 * @template T - Type of items being filtered
 */
export interface FilterPreset<T = any> {
  /** Display label for the preset */
  label: string;
  /** Filter function to apply when preset is selected */
  filterFn: (item: T) => boolean;
  /** Optional icon name for the preset */
  icon?: string;
}

/**
 * Props for the SearchBar component
 * 
 * @interface SearchBarProps
 * @template T - Type of items being searched/filtered
 */
export interface SearchBarProps<T = any> {
  /** Array of items to search/filter */
  items: T[];
  /** Callback fired when search query or filtered results change */
  onSearchChange?: (query: string, filteredItems: T[]) => void;
  /** Placeholder text for input */
  placeholder?: string;
  /** Custom filter function - receives item and query, returns boolean */
  filterFn?: (item: T, query: string) => boolean;
  /** Custom style for container */
  style?: any;
  /** Custom style for input */
  inputStyle?: any;
  /** Show filter preset chips */
  showFilterPresets?: boolean;
  /** Array of filter preset configurations */
  filterPresets?: FilterPreset<T>[];
  /** Callback when filter preset is selected */
  onPresetSelect?: (preset: FilterPreset<T>, filteredItems: T[]) => void;
  /** Enable search history feature */
  enableSearchHistory?: boolean;
  /** Key for storing search history (for persistence) */
  searchHistoryKey?: string;
  /** Maximum number of history items to store */
  maxHistoryItems?: number;
  /** Callback when history item is selected */
  onHistoryItemSelect?: (query: string) => void;
}

/**
 * A powerful search bar component with built-in filtering, presets, and search history.
 * 
 * Automatically filters items based on query and optional custom filter function.
 * Supports filter presets, search history, and integrates with pagination.
 * 
 * @component
 * @template T - Type of items being searched
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <SearchBar
 *   items={products}
 *   placeholder="Search products..."
 *   onSearchChange={(query, filtered) => setFiltered(filtered)}
 * />
 * 
 * // With custom filter
 * <SearchBar
 *   items={users}
 *   filterFn={(user, query) => 
 *     user.name.toLowerCase().includes(query.toLowerCase())
 *   }
 *   onSearchChange={(query, filtered) => setResults(filtered)}
 * />
 * 
 * // With filter presets
 * <SearchBar
 *   items={products}
 *   showFilterPresets
 *   filterPresets={[
 *     { label: "On Sale", filterFn: (p) => p.onSale },
 *     { label: "In Stock", filterFn: (p) => p.inStock },
 *   ]}
 * />
 * 
 * // With search history
 * <SearchBar
 *   items={items}
 *   enableSearchHistory
 *   searchHistoryKey="productSearchHistory"
 *   onHistoryItemSelect={(query) => setQuery(query)}
 * />
 * ```
 * 
 * @param {SearchBarProps<T>} props - SearchBar component props
 * @returns {JSX.Element} SearchBar component
 */
export function SearchBar<T = any>({
  items,
  onSearchChange,
  placeholder = "Search...",
  filterFn,
  style,
  inputStyle,
  showFilterPresets = false,
  filterPresets = [],
  onPresetSelect,
  enableSearchHistory = false,
  searchHistoryKey = "searchHistory",
  maxHistoryItems = 5,
  onHistoryItemSelect,
}: SearchBarProps<T>) {
  const [selectedPreset, setSelectedPreset] = useState<FilterPreset<T> | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const { query, setQuery, filteredItems, isSearching } = useSearch(items, {
    filterFn: selectedPreset
      ? (item: T, q: string) => {
          // Apply preset filter first, then search query
          if (!selectedPreset.filterFn(item)) return false;
          if (!q.trim()) return true;
          return filterFn ? filterFn(item, q) : true;
        }
      : filterFn,
  });

  React.useEffect(() => {
    onSearchChange?.(query, filteredItems);
  }, [query, filteredItems, onSearchChange]);

  // Load search history from storage (simplified - in real app, use AsyncStorage)
  React.useEffect(() => {
    if (enableSearchHistory) {
      // In a real implementation, load from AsyncStorage
      // For now, we'll use an empty array
      setSearchHistory([]);
    }
  }, [enableSearchHistory, searchHistoryKey]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setSelectedPreset(null);
  }, [setQuery]);

  const handlePresetSelect = useCallback((preset: FilterPreset<T>) => {
    setSelectedPreset(preset);
    setQuery(""); // Clear search query when selecting preset
    const presetFiltered = items.filter(preset.filterFn);
    onPresetSelect?.(preset, presetFiltered);
  }, [items, onPresetSelect, setQuery]);

  const handleHistoryItemSelect = useCallback((historyQuery: string) => {
    setQuery(historyQuery);
    setShowHistory(false);
    onHistoryItemSelect?.(historyQuery);
  }, [setQuery, onHistoryItemSelect]);

  const addToHistory = useCallback((query: string) => {
    if (!enableSearchHistory || !query.trim()) return;
    
    setSearchHistory((prev) => {
      const filtered = prev.filter((q) => q !== query);
      const updated = [query, ...filtered].slice(0, maxHistoryItems);
      // In a real implementation, save to AsyncStorage
      return updated;
    });
  }, [enableSearchHistory, maxHistoryItems]);

  const handleSearchSubmit = useCallback(() => {
    if (query.trim()) {
      addToHistory(query);
      setShowHistory(false);
    }
  }, [query, addToHistory]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <Ionicons name="search-outline" size={20} color="#6b7280" style={styles.icon} />
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder={placeholder}
          value={query}
          onChangeText={setQuery}
          placeholderTextColor="#9ca3af"
          onFocus={() => enableSearchHistory && searchHistory.length > 0 && setShowHistory(true)}
          onSubmitEditing={handleSearchSubmit}
        />
        {isSearching && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
        {enableSearchHistory && searchHistory.length > 0 && (
          <TouchableOpacity
            onPress={() => setShowHistory(!showHistory)}
            style={styles.historyButton}
          >
            <Ionicons name="time-outline" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Presets */}
      {showFilterPresets && filterPresets.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.presetsContainer}
          contentContainerStyle={styles.presetsContent}
        >
          {filterPresets.map((preset, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handlePresetSelect(preset)}
              style={[
                styles.presetChip,
                selectedPreset === preset && styles.presetChipActive,
              ]}
            >
              {preset.icon && (
                <Ionicons
                  name={preset.icon as any}
                  size={16}
                  color={selectedPreset === preset ? "#ffffff" : "#6b7280"}
                  style={styles.presetIcon}
                />
              )}
              <Text
                style={[
                  styles.presetText,
                  selectedPreset === preset && styles.presetTextActive,
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Search History Dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <ScrollView style={styles.historyList}>
            {searchHistory.map((historyQuery, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleHistoryItemSelect(historyQuery)}
                style={styles.historyItem}
              >
                <Ionicons name="time-outline" size={16} color="#6b7280" />
                <Text style={styles.historyText}>{historyQuery}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  historyButton: {
    marginLeft: 4,
    padding: 4,
  },
  presetsContainer: {
    marginTop: 8,
  },
  presetsContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  presetChipActive: {
    backgroundColor: "#277874",
    borderColor: "#277874",
  },
  presetIcon: {
    marginRight: 4,
  },
  presetText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },
  presetTextActive: {
    color: "#ffffff",
  },
  historyContainer: {
    marginTop: 8,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyList: {
    maxHeight: 200,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 8,
  },
  historyText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
});

