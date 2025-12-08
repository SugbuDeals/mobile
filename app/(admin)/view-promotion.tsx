import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function AdminViewPromotions() {
  const { state: storeState, action: storeActions } = useStore();
  const { state: authState, action: authActions } = useLogin();
  const [query, setQuery] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [promotionStatusLoading, setPromotionStatusLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    storeActions.findPromotions();
    storeActions.findProducts();
    storeActions.findStores();
    if (authState.allUsers.length === 0) {
      authActions.fetchAllUsers();
    }
  }, []);

  const productById = useMemo(() => {
    const map = new Map<number, string>();
    storeState.products.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [storeState.products]);

  const storeById = useMemo(() => {
    const map = new Map<number, { ownerId?: number }>();
    storeState.stores.forEach((s) => map.set(s.id, { ownerId: s.ownerId }));
    return map;
  }, [storeState.stores]);

  const isOrphanPromotion = (productId: number | null) => {
    if (!productId) return true; // Null productId means orphan
    const product = storeState.products.find((p) => p.id === productId);
    if (!product) return true;
    const store = storeById.get(product.storeId);
    if (!store) return true;
    if (authState.allUsers.length === 0) return false; // can't determine owner yet
    return !!(store.ownerId && !authState.allUsers.some((u) => u.id === store.ownerId));
  };

  const promotions = storeState.promotions
    .filter((p) => (showOnlyActive ? p.active : true))
    .filter((p) => {
      const title = (p.title || "").toLowerCase();
      const productName = (p.productId ? (productById.get(p.productId) || "") : "").toLowerCase();
      const q = query.toLowerCase();
      return title.includes(q) || productName.includes(q);
    });

  const handleTogglePromotionActive = async (promotionId: number, nextValue: boolean) => {
    setPromotionStatusLoading((prev) => ({ ...prev, [promotionId]: true }));
    try {
      await storeActions.updatePromotion({ id: promotionId, active: nextValue }).unwrap();
      Alert.alert("Success", `Promotion has been ${nextValue ? "enabled" : "disabled"}.`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update promotion status.";
      Alert.alert("Error", errorMessage);
    } finally {
      setPromotionStatusLoading((prev) => ({ ...prev, [promotionId]: false }));
    }
  };

  const confirmDelete = (id: number) => {
    Alert.alert(
      "Delete Promotion",
      "Are you sure you want to delete this promotion? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(id);
            try {
              await storeActions.deletePromotion(id);
              await storeActions.findPromotions();
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

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
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
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
              const productName = promo.productId ? (productById.get(promo.productId) || `Product #${promo.productId}`) : "No product";
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
                      {isOrphanPromotion(promo.productId) && (
                        <View style={[styles.metaPill, styles.deletePill]}>
                          <Ionicons name="alert-circle" size={14} color="#991B1B" />
                          <Text style={[styles.metaText, { color: "#991B1B" }]}>Recommended to delete</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.promotionActions}>
                      <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>{promo.active ? "Active" : "Disabled"}</Text>
                        <Switch
                          value={!!promo.active}
                          onValueChange={(value) => handleTogglePromotionActive(promo.id, value)}
                          trackColor={{ false: "#FECACA", true: "#A7F3D0" }}
                          thumbColor="#FFFFFF"
                          disabled={!!promotionStatusLoading[promo.id]}
                        />
                      </View>
                      {promotionStatusLoading[promo.id] && (
                        <ActivityIndicator size="small" color="#277874" />
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    disabled={deletingId === promo.id}
                    onPress={() => confirmDelete(promo.id)}
                    style={[styles.deleteButton, deletingId === promo.id ? styles.deleteButtonDisabled : undefined]}
                  >
                    {deletingId === promo.id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="trash" size={16} color="#ffffff" />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </>
                    )}
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
  deletePill: {
    backgroundColor: "#FEE2E2",
  },
  metaText: {
    fontSize: 12,
    fontWeight: "700",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DC2626",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
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
  promotionActions: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchLabel: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
});


