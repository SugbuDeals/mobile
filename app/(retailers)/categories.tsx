import { useCatalog } from "@/features/catalog";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

export default function CategoriesScreen() {
  const { action: { loadCategories }, state: { categories, loading } } = useCatalog();

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="list" size={20} color="#277874" />
        <Text style={styles.title}>Categories</Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadCategories} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Ionicons name="pricetags" size={18} color="#6B7280" />
            <Text style={styles.itemText}>{item.name}</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="folder-open" size={36} color="#9CA3AF" />
            <Text style={styles.emptyText}>No categories found</Text>
          </View>
        )}
        contentContainerStyle={categories.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  itemText: {
    fontSize: 16,
    color: "#374151",
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
  },
});


