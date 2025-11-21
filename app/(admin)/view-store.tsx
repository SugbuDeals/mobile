import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

export default function AdminViewStores() {
  const { state: storeState, action: storeActions } = useStore();
  const { state: authState, action: authActions } = useLogin();
  const [storeActionLoading, setStoreActionLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    storeActions.findStores();
    if (authState.allUsers.length === 0) {
      authActions.fetchAllUsers();
    }
  }, []);

  const toggleStoreLoading = (id: number, loading: boolean) => {
    setStoreActionLoading((prev) => ({ ...prev, [id]: loading }));
  };

  const handleToggleStoreActive = async (storeId: number, nextValue: boolean) => {
    toggleStoreLoading(storeId, true);
    try {
      await storeActions.updateStoreAdminStatus({ id: storeId, isActive: nextValue }).unwrap();
      Alert.alert("Success", `Store has been ${nextValue ? "enabled" : "disabled"}.`);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update store status.");
    } finally {
      toggleStoreLoading(storeId, false);
    }
  };

  const handleToggleVerification = async (storeId: number, currentStatus: "UNVERIFIED" | "VERIFIED") => {
    const nextStatus = currentStatus === "VERIFIED" ? "UNVERIFIED" : "VERIFIED";
    toggleStoreLoading(storeId, true);
    try {
      await storeActions.updateStoreAdminStatus({ id: storeId, verificationStatus: nextStatus }).unwrap();
      Alert.alert("Success", `Store has been marked as ${nextStatus === "VERIFIED" ? "verified" : "unverified"}.`);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update verification status.");
    } finally {
      toggleStoreLoading(storeId, false);
    }
  };

  if (storeState.loading && storeState.stores.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#277874" />
        <Text style={styles.loadingText}>Loading stores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Stores</Text>
          <View style={styles.countBadge}>
            <Ionicons name="storefront" color="#277874" size={16} />
            <Text style={styles.countText}>{storeState.stores.length}</Text>
          </View>
        </View>

        {storeState.stores.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No stores available</Text>
            <Text style={styles.emptySub}>Stores will appear once created</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {storeState.stores.map((store) => (
              <View key={store.id} style={styles.card}>
                <Image
                  source={{ uri: store.imageUrl || "https://via.placeholder.com/64x64.png?text=S" }}
                  style={styles.thumbnail}
                />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{store.name}</Text>
                  <Text style={styles.cardSub} numberOfLines={2}>{store.description}</Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.metaPill, { backgroundColor: store.verificationStatus === "VERIFIED" ? "#D1FAE5" : "#F3F4F6" }]}>
                      <Ionicons name={store.verificationStatus === "VERIFIED" ? "shield-checkmark" : "shield-outline"} size={14} color={store.verificationStatus === "VERIFIED" ? "#10B981" : "#6B7280"} />
                      <Text style={[styles.metaText, { color: store.verificationStatus === "VERIFIED" ? "#065F46" : "#374151" }]}>
                        {store.verificationStatus === "VERIFIED" ? "Verified" : "Unverified"}
                      </Text>
                    </View>
                    <View style={[styles.metaPill, { backgroundColor: store.isActive === false ? "#FEE2E2" : "#E0F2F1" }]}>
                      <Ionicons name={store.isActive === false ? "power" : "flash"} size={14} color={store.isActive === false ? "#B91C1C" : "#047857"} />
                      <Text style={[styles.metaText, { color: store.isActive === false ? "#991B1B" : "#065F46" }]}>
                        {store.isActive === false ? "Disabled" : "Active"}
                      </Text>
                    </View>
                    {store.ownerId && authState.allUsers.length > 0 && !authState.allUsers.some((u) => u.id === store.ownerId) && (
                      <View style={[styles.metaPill, styles.deletePill]}>
                        <Ionicons name="alert-circle" size={14} color="#991B1B" />
                        <Text style={[styles.metaText, { color: "#991B1B" }]}>Recommended to delete</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.statusControls}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        store.verificationStatus === "VERIFIED" ? styles.unverifyButton : styles.verifyButton,
                        storeActionLoading[store.id] && styles.actionButtonDisabled,
                      ]}
                      onPress={() => handleToggleVerification(store.id, store.verificationStatus)}
                      disabled={!!storeActionLoading[store.id]}
                    >
                      {storeActionLoading[store.id] ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons
                            name={store.verificationStatus === "VERIFIED" ? "shield-outline" : "shield-checkmark"}
                            size={16}
                            color="#FFFFFF"
                          />
                          <Text style={styles.actionButtonText}>
                            {store.verificationStatus === "VERIFIED" ? "Unverify" : "Verify"}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>{store.isActive === false ? "Disabled" : "Active"}</Text>
                      <Switch
                        value={store.isActive !== false}
                        onValueChange={(value) => handleToggleStoreActive(store.id, value)}
                        thumbColor="#ffffff"
                        trackColor={{ false: "#FECACA", true: "#A7F3D0" }}
                        disabled={!!storeActionLoading[store.id]}
                      />
                    </View>
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
  statusControls: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#065F46",
  },
  verifyButton: {
    backgroundColor: "#059669",
  },
  unverifyButton: {
    backgroundColor: "#DC2626",
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
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


