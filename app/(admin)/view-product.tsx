import { useStore } from "@/features/store";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function AdminViewProducts() {
  const { state: storeState, action: storeActions } = useStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    storeActions.findProducts();
    storeActions.findStores();
  }, []);

  const products = storeState.products.filter((p) =>
    (p.name || "").toLowerCase().includes(query.toLowerCase())
  );

  if (storeState.loading && storeState.products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#277874" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  const isOrphanProduct = (storeId: number) => !storeState.stores.some((s) => s.id === storeId);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Products</Text>
          <View style={styles.countBadge}>
            <Ionicons name="cube-outline" color="#277874" size={16} />
            <Text style={styles.countText}>{storeState.products.length}</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySub}>Try a different search term</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {products.map((product) => (
              <View key={product.id} style={styles.card}>
                <Image
                  source={{ uri: product.imageUrl || "https://via.placeholder.com/64x64.png?text=P" }}
                  style={styles.thumbnail}
                />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{product.name}</Text>
                  <Text style={styles.cardSub} numberOfLines={2}>
                    {product.description}
                  </Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.metaPill, { backgroundColor: "#e0f2f1" }]}>
                      <Ionicons name="pricetag" size={14} color="#277874" />
                      <Text style={[styles.metaText, { color: "#277874" }]}>₱{Number(product.price).toLocaleString()}</Text>
                    </View>
                    <View style={[styles.metaPill, { backgroundColor: "#fef3c7" }]}>
                      <Ionicons name="cube" size={14} color="#F59E0B" />
                      <Text style={[styles.metaText, { color: "#B45309" }]}>Stock: {product.stock}</Text>
                    </View>
                    <View style={[styles.metaPill, { backgroundColor: product.isActive ? "#D1FAE5" : "#F3F4F6" }]}>
                      <Ionicons name={product.isActive ? "checkmark-circle" : "pause-circle"} size={14} color={product.isActive ? "#10B981" : "#6B7280"} />
                      <Text style={[styles.metaText, { color: product.isActive ? "#065F46" : "#374151" }]}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Text>
                    </View>
                    {isOrphanProduct(product.storeId) && (
                      <View style={[styles.metaPill, styles.deletePill]}>
                        <Ionicons name="alert-circle" size={14} color="#991B1B" />
                        <Text style={[styles.metaText, { color: "#991B1B" }]}>Recommended to delete</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity style={styles.chevron}>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#277874",
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9f8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  countText: {
    color: "#277874",
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 44,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#1F2937",
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#F3F4F6",
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  deletePill: {
    backgroundColor: "#FEE2E2",
  },
  metaText: {
    fontSize: 12,
    fontWeight: "700",
  },
  chevron: {
    padding: 6,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#6B7280",
  },
  emptySub: {
    marginTop: 4,
    fontSize: 13,
    color: "#9CA3AF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#277874",
  },
});


