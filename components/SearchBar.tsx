import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useSearch } from "@/hooks/useSearch";

export interface SearchBarProps<T = any> {
  items: T[];
  onSearchChange?: (query: string, filteredItems: T[]) => void;
  placeholder?: string;
  filterFn?: (item: T, query: string) => boolean;
  style?: any;
  inputStyle?: any;
}

export function SearchBar<T = any>({
  items,
  onSearchChange,
  placeholder = "Search...",
  filterFn,
  style,
  inputStyle,
}: SearchBarProps<T>) {
  const { query, setQuery, filteredItems, isSearching } = useSearch(items, {
    filterFn,
  });

  React.useEffect(() => {
    onSearchChange?.(query, filteredItems);
  }, [query, filteredItems, onSearchChange]);

  const clearSearch = () => {
    setQuery("");
  };

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
        />
        {isSearching && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>
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
});

