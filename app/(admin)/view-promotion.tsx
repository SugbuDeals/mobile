import { useStore } from "@/features/store";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function AdminViewPromotions() {
  const { state: storeState, action: storeActions } = useStore();
  const [query, setQuery] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  useEffect(() => {
    storeActions.findPromotions();
    storeActions.findProducts();
  }, []);

  const productById = useMemo(() => {
    const map = new Map<number, string>();
    storeState.products.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [storeState.products]);

  const promotions = storeState.promotions
    .filter((p) => (showOnlyActive ? p.active : true))
    .filter((p) => {
      const title = (p.title || "").toLowerCase();
      const productName = (productById.get(p.productId) || "").toLowerCase();
      const q = query.toLowerCase();
      return title.includes(q) || productName.includes(q);
    });

  if (storeState.loading && storeState.promotions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#277874" />
        <Text style={styles.loadingText}>Loading promotions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Promotions</Text>
          <View style={styles.countBadge}>
            <Ionicons name="pricetag" color="#277874" size={16} />
            <Text style={styles.countText}>{storeState.promotions.length}</Text>
          </View>
        </View>

        <View style={styles.filtersRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by title or product..."
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <TouchableOpacity
            style={[styles.toggleFilter, showOnlyActive ? styles.toggleFilterActive : undefined]}
            onPress={() => setShowOnlyActive((s) => !s)}
          >
            <Ionicons name={showOnlyActive ? "checkmark-circle" : "ellipse-outline"} size={16} color={showOnlyActive ? "#065F46" : "#6B7280"} />
            <Text style={[styles.toggleFilterText, { color: showOnlyActive ? "#065F46" : "#374151" }]}>Active only</Text>
          </TouchableOpacity>
        </View>

        {promotions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="pricetag-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No promotions found</Text>
            <Text style={styles.emptySub}>Adjust filters or try a different search</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {promotions.map((promo) => {
              const productName = productById.get(promo.productId) || `Product #${promo.productId}`;
              return (
                <View key={promo.id} style={styles.card}>
                  <View style={styles.iconBadge}>
                    <Ionicons name="flame" size={18} color="#ffffff" />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{promo.title}</Text>
                    <Text style={styles.cardSub} numberOfLines={2}>{promo.description}</Text>
                    <View style={styles.metaRow}>
                      <View style={[styles.metaPill, { backgroundColor: "#e0f2f1" }]}>
                        <Ionicons name="pricetag" size={14} color="#277874" />
                        <Text style={[styles.metaText, { color: "#277874" }]}>
                          {promo.type === "percentage" ? `${promo.discount}%` : `₱${promo.discount}`}
                        </Text>
                      </View>
                      <View style={[styles.metaPill, { backgroundColor: "#f3f4f6" }]}>
                        <Ionicons name="cube" size={14} color="#6B7280" />
                        <Text style={[styles.metaText, { color: "#374151" }]}>{productName}</Text>
                      </View>
                      <View style={[styles.metaPill, { backgroundColor: promo.active ? "#D1FAE5" : "#F3F4F6" }]}>
                        <Ionicons name={promo.active ? "checkmark-circle" : "pause-circle"} size={14} color={promo.active ? "#10B981" : "#6B7280"} />
                        <Text style={[styles.metaText, { color: promo.active ? "#065F46" : "#374151" }]}>
                          {promo.active ? "Active" : "Inactive"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.chevron}>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              );
            })}
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
  filtersRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 14,
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
    flex: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#1F2937",
  },
  toggleFilter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  toggleFilterActive: {
    backgroundColor: "#D1FAE5",
  },
  toggleFilterText: {
    fontWeight: "700",
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
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#277874",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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


