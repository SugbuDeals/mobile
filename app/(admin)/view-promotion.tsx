import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import { formatDealDetails } from "@/utils/dealTypes";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function AdminViewPromotions() {
  const { state: storeState, action: storeActions } = useStore();
  const { state: authState, action: authActions } = useLogin();
  const [query, setQuery] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [promotionStatusLoading, setPromotionStatusLoading] = useState<Record<number, boolean>>({});
  const [compactView, setCompactView] = useState(false);

  useEffect(() => {
    storeActions.findPromotions();
    storeActions.findProducts();
    storeActions.findStores();
    if (!authState.allUsers || authState.allUsers.length === 0) {
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

  const isOrphanPromotion = (productId: number | null | undefined) => {
    if (!productId) return true; // Null or undefined productId means orphan
    const product = storeState.products.find((p) => p.id === productId);
    if (!product) return true;
    const store = storeById.get(product.storeId);
    if (!store) return true;
    if (!authState.allUsers || authState.allUsers.length === 0) return false; // can't determine owner yet
    return !!(store.ownerId && !authState.allUsers.some((u) => u.id === store.ownerId));
  };

  const promotions = (storeState.promotions || [])
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

  if (storeState.loading && (!storeState.promotions || storeState.promotions.length === 0)) {
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
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.viewToggle}
              onPress={() => setCompactView(!compactView)}
            >
              <Ionicons 
                name={compactView ? "grid" : "list"} 
                size={18} 
                color="#277874" 
              />
            </TouchableOpacity>
            <View style={styles.countBadge}>
              <Ionicons name="pricetag" color="#277874" size={16} />
              <Text style={styles.countText}>{storeState.promotions?.length || 0}</Text>
            </View>
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
                <View key={promo.id} style={[styles.card, compactView && styles.cardCompact]}>
                  {compactView ? (
                    <>
                      <View style={styles.iconBadgeCompact}>
                        <Ionicons name="flame" size={14} color="#ffffff" />
                      </View>
                      <View style={styles.cardBodyCompact}>
                        <Text style={styles.cardTitleCompact} numberOfLines={1}>{promo.title}</Text>
                        <View style={styles.metaRowCompact}>
                          <View style={[styles.metaPillCompact, { backgroundColor: "#e0f2f1" }]}>
                            <Ionicons name="pricetag" size={10} color="#277874" />
                            <Text style={[styles.metaTextCompact, { color: "#277874" }]}>
                              {formatDealDetails(promo)}
                            </Text>
                          </View>
                          <View style={[styles.metaPillCompact, { backgroundColor: promo.active ? "#D1FAE5" : "#F3F4F6" }]}>
                            <Ionicons name={promo.active ? "checkmark-circle" : "pause-circle"} size={10} color={promo.active ? "#10B981" : "#6B7280"} />
                            <Text style={[styles.metaTextCompact, { color: promo.active ? "#065F46" : "#374151" }]}>
                              {promo.active ? "Active" : "Inactive"}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.actionsCompact}>
                        <Switch
                          value={!!promo.active}
                          onValueChange={(value) => handleTogglePromotionActive(promo.id, value)}
                          trackColor={{ false: "#FECACA", true: "#A7F3D0" }}
                          thumbColor="#FFFFFF"
                          disabled={!!promotionStatusLoading[promo.id]}
                        />
                        {promotionStatusLoading[promo.id] ? (
                          <ActivityIndicator size="small" color="#277874" />
                        ) : (
                          <TouchableOpacity
                            disabled={deletingId === promo.id}
                            onPress={() => confirmDelete(promo.id)}
                            style={[styles.deleteButtonCompact, deletingId === promo.id ? styles.deleteButtonDisabled : undefined]}
                          >
                            {deletingId === promo.id ? (
                              <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                              <Ionicons name="trash" size={14} color="#ffffff" />
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.iconBadge}>
                        <Ionicons name="flame" size={20} color="#ffffff" />
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={styles.cardTitle}>{promo.title}</Text>
                        <Text style={styles.cardSub} numberOfLines={2}>{promo.description}</Text>
                        <View style={styles.metaRow}>
                          <View style={[styles.metaPill, { backgroundColor: "#e0f2f1" }]}>
                            <Ionicons name="pricetag" size={12} color="#277874" />
                            <Text style={[styles.metaText, { color: "#277874" }]}>
                              {formatDealDetails(promo)}
                            </Text>
                          </View>
                          <View style={[styles.metaPill, { backgroundColor: promo.active ? "#D1FAE5" : "#F3F4F6" }]}>
                            <Ionicons name={promo.active ? "checkmark-circle" : "pause-circle"} size={12} color={promo.active ? "#10B981" : "#6B7280"} />
                            <Text style={[styles.metaText, { color: promo.active ? "#065F46" : "#374151" }]}>
                              {promo.active ? "Active" : "Inactive"}
                            </Text>
                          </View>
                          {isOrphanPromotion(promo.productId ?? null) && (
                            <View style={[styles.metaPill, styles.deletePill]}>
                              <Ionicons name="alert-circle" size={12} color="#991B1B" />
                              <Text style={[styles.metaText, { color: "#991B1B" }]}>Orphan</Text>
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
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          disabled={deletingId === promo.id}
                          onPress={() => confirmDelete(promo.id)}
                          style={[styles.deleteButton, deletingId === promo.id ? styles.deleteButtonDisabled : undefined]}
                        >
                          {deletingId === promo.id ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <>
                              <Ionicons name="trash" size={14} color="#ffffff" />
                              <Text style={styles.deleteButtonText}>Delete</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  viewToggle: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f0f9f8",
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
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#277874",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 10,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deletePill: {
    backgroundColor: "#FEE2E2",
  },
  metaText: {
    fontSize: 11,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DC2626",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 12,
  },
  cardActions: {
    marginLeft: 10,
    alignSelf: "flex-start",
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
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
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
  // Compact view styles - single line horizontal layout
  cardCompact: {
    padding: 8,
    marginBottom: 6,
    alignItems: "center",
    minHeight: 48,
    flexDirection: "row",
  },
  iconBadgeCompact: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#277874",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  cardBodyCompact: {
    flex: 1,
    justifyContent: "center",
  },
  cardTitleCompact: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  metaRowCompact: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
  },
  metaPillCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaTextCompact: {
    fontSize: 9,
    fontWeight: "600",
  },
  actionsCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deleteButtonCompact: {
    padding: 4,
    backgroundColor: "#DC2626",
    borderRadius: 6,
  },
});


