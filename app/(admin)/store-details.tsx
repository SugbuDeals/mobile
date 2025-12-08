import env from "@/config/env";
import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import type { Promotion } from "@/features/store/promotions/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdminStoreDetails() {
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const router = useRouter();
  const { state: authState, action: authActions } = useLogin();
  const {
    state: storeState,
    action: storeActions,
  } = useStore();
  const [storeActionLoading, setStoreActionLoading] = useState(false);
  const [productStatusLoading, setProductStatusLoading] = useState<
    Record<number, boolean>
  >({});
  const [promotionStatusLoading, setPromotionStatusLoading] = useState<Record<number, boolean>>(
    {}
  );

  const storeId = useMemo(() => {
    const raw = Array.isArray(params.storeId) ? params.storeId[0] : params.storeId;
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : undefined;
  }, [params.storeId]);

  const storeNameFromParams = useMemo(() => {
    const raw = Array.isArray(params.storeName) ? params.storeName[0] : params.storeName;
    return raw || undefined;
  }, [params.storeName]);

  useEffect(() => {
    if (!storeState.stores.length) {
      storeActions.findStores();
    }
    if (!storeState.products.length) {
      storeActions.findProducts();
    }
    if (!storeState.promotions.length) {
      storeActions.findPromotions();
    }
    if (!authState.allUsers.length) {
      authActions.fetchAllUsers();
    }
  }, []);

  const store = useMemo(
    () =>
      storeId != null
        ? storeState.stores.find((s) => s.id === storeId)
        : undefined,
    [storeId, storeState.stores]
  );

  const storeOwner = useMemo(() => {
    if (!store?.ownerId || !authState.allUsers.length) return undefined;
    return authState.allUsers.find((u) => u.id === store.ownerId);
  }, [store, authState.allUsers]);

  const productsForStore = useMemo(
    () =>
      storeId != null
        ? storeState.products.filter((p) => p.storeId === storeId)
        : [],
    [storeId, storeState.products]
  );

  const promotionsForStore = useMemo(() => {
    if (!storeId || !storeState.promotions.length || !storeState.products.length) return [];
    const productById = new Map<number, { name: string }>();
    storeState.products.forEach((p) => {
      if (p && typeof p.id === "number") {
        productById.set(p.id, { name: p.name });
      }
    });

    return storeState.promotions
      .map((promo) => {
        const product = storeState.products.find((p) => p.id === promo.productId);
        if (!product || product.storeId !== storeId) return null;
        return { promo, productName: product.name };
      })
      .filter((item): item is { promo: Promotion; productName: string } => item !== null);
  }, [storeId, storeState.promotions, storeState.products]);

  const toggleStoreLoading = (loading: boolean) => {
    setStoreActionLoading(loading);
  };

  const handleToggleStoreActive = async (nextValue: boolean) => {
    if (!storeId) return;
    toggleStoreLoading(true);
    try {
      await storeActions.updateStoreAdminStatus({ id: storeId, isActive: nextValue }).unwrap();
      Alert.alert("Success", `Store has been ${nextValue ? "enabled" : "disabled"}.`);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update store status.");
    } finally {
      toggleStoreLoading(false);
    }
  };

  const handleToggleVerification = async (
    currentStatus: "UNVERIFIED" | "VERIFIED" | undefined
  ) => {
    if (!storeId || !currentStatus) return;
    const nextStatus = currentStatus === "VERIFIED" ? "UNVERIFIED" : "VERIFIED";
    toggleStoreLoading(true);
    try {
      await storeActions
        .updateStoreAdminStatus({ id: storeId, verificationStatus: nextStatus })
        .unwrap();
      Alert.alert(
        "Success",
        `Store has been marked as ${nextStatus === "VERIFIED" ? "verified" : "unverified"}.`
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Failed to update verification status."
      );
    } finally {
      toggleStoreLoading(false);
    }
  };

  const handleTogglePromotionActive = async (
    promotionId: number,
    nextValue: boolean
  ) => {
    setPromotionStatusLoading((prev) => ({ ...prev, [promotionId]: true }));
    try {
      await storeActions.updatePromotion({ id: promotionId, active: nextValue }).unwrap();
      Alert.alert("Success", `Promotion has been ${nextValue ? "enabled" : "disabled"}.`);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update promotion status.");
    } finally {
      setPromotionStatusLoading((prev) => ({ ...prev, [promotionId]: false }));
    }
  };

  const handleToggleProductActive = async (
    productId: number,
    nextValue: boolean
  ) => {
    setProductStatusLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      await storeActions
        .updateProductAdminStatus({ id: productId, isActive: nextValue })
        .unwrap();
      Alert.alert(
        "Success",
        `Product has been ${nextValue ? "enabled" : "disabled"}.`
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Failed to update product visibility."
      );
    } finally {
      setProductStatusLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleDeleteStore = () => {
    if (!storeId) return;

    Alert.alert(
      "Delete Store",
      `Are you sure you want to delete "${displayName}"? This action cannot be undone and may remove related data (products, promotions, etc.).`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            toggleStoreLoading(true);
            try {
              await storeActions.deleteStore(storeId).unwrap();
              await storeActions.findStores();
              Alert.alert("Success", "Store deleted successfully.");
              router.back();
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : "Failed to delete store.";
              Alert.alert("Error", errorMessage);
            } finally {
              toggleStoreLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLocateStore = () => {
    if (!store) return;
    const hasCoords =
      typeof store.latitude === "number" &&
      typeof store.longitude === "number";

    const url = hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`
      : `https://maps.google.com/maps?q=${encodeURIComponent(
          store.address || store.name || ""
        )}`;

    Linking.openURL(url);
  };

  if (!storeId) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Missing store information.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (storeState.loading && !store) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#277874" />
        <Text style={styles.loadingText}>Loading store details...</Text>
      </View>
    );
  }

  const displayName = store?.name || storeNameFromParams || "Store";

  const rawLogo = store?.imageUrl as string | undefined;
  const rawBanner = store?.bannerUrl as string | undefined;

  const logoUrl = (() => {
    if (!rawLogo) return undefined;
    if (/^https?:\/\//i.test(rawLogo)) return rawLogo;
    if (rawLogo.startsWith("/")) return `${env.API_BASE_URL}${rawLogo}`;
    return `${env.API_BASE_URL}/files/${rawLogo}`;
  })();

  const bannerUrl = (() => {
    if (!rawBanner) return undefined;
    if (/^https?:\/\//i.test(rawBanner)) return rawBanner;
    if (rawBanner.startsWith("/")) return `${env.API_BASE_URL}${rawBanner}`;
    return `${env.API_BASE_URL}/files/${rawBanner}`;
  })();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        

        {/* Store Banner / Hero */}
        <View style={styles.bannerWrapper}>
          {bannerUrl ? (
            <Image
              source={{ uri: bannerUrl }}
              resizeMode="cover"
              style={styles.banner}
            />
          ) : (
            <View style={[styles.banner, styles.bannerPlaceholder]} />
          )}
          <View style={styles.bannerOverlayRow}>
            <TouchableOpacity
              style={styles.locateButton}
              onPress={handleLocateStore}
            >
              <Ionicons name="navigate" size={16} color="#FFFFFF" />
              <Text style={styles.locateButtonText}>Locate Store</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.storeCard}>
          <View style={styles.storeHeaderRow}>
            <Image
              source={{
                uri:
                  store?.imageUrl ||
                  "https://via.placeholder.com/64x64.png?text=S",
              }}
              style={styles.storeThumbnail}
            />
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{displayName}</Text>
              {store?.description ? (
                <Text style={styles.storeDescription} numberOfLines={2}>
                  {store.description}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.storeMetaRow}>
            <View
              style={[
                styles.metaPill,
                {
                  backgroundColor:
                    store?.verificationStatus === "VERIFIED" ? "#D1FAE5" : "#F3F4F6",
                },
              ]}
            >
              <Ionicons
                name={
                  store?.verificationStatus === "VERIFIED"
                    ? "shield-checkmark"
                    : "shield-outline"
                }
                size={14}
                color={
                  store?.verificationStatus === "VERIFIED" ? "#10B981" : "#6B7280"
                }
              />
              <Text
                style={[
                  styles.metaText,
                  {
                    color:
                      store?.verificationStatus === "VERIFIED"
                        ? "#065F46"
                        : "#374151",
                  },
                ]}
              >
                {store?.verificationStatus === "VERIFIED"
                  ? "Verified"
                  : "Unverified"}
              </Text>
            </View>

            <View
              style={[
                styles.metaPill,
                {
                  backgroundColor:
                    store?.isActive === false ? "#FEE2E2" : "#E0F2F1",
                },
              ]}
            >
              <Ionicons
                name={store?.isActive === false ? "power" : "flash"}
                size={14}
                color={store?.isActive === false ? "#B91C1C" : "#047857"}
              />
              <Text
                style={[
                  styles.metaText,
                  {
                    color:
                      store?.isActive === false ? "#991B1B" : "#065F46",
                  },
                ]}
              >
                {store?.isActive === false ? "Disabled" : "Active"}
              </Text>
            </View>

            {storeOwner && (
              <View style={[styles.metaPill, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="person" size={14} color="#1D4ED8" />
                <Text style={[styles.metaText, { color: "#1D4ED8" }]}>
                  {storeOwner.name || storeOwner.email}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.statusControls}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                store?.verificationStatus === "VERIFIED"
                  ? styles.unverifyButton
                  : styles.verifyButton,
                storeActionLoading && styles.actionButtonDisabled,
              ]}
              disabled={storeActionLoading || !store?.verificationStatus}
              onPress={() =>
                handleToggleVerification(
                  (store?.verificationStatus as "UNVERIFIED" | "VERIFIED") || "UNVERIFIED"
                )
              }
            >
              {storeActionLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={
                      store?.verificationStatus === "VERIFIED"
                        ? "shield-outline"
                        : "shield-checkmark"
                    }
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.actionButtonText}>
                    {store?.verificationStatus === "VERIFIED" ? "Unverify" : "Verify"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                {store?.isActive === false ? "Disabled" : "Active"}
              </Text>
              <Switch
                value={store?.isActive !== false}
                onValueChange={handleToggleStoreActive}
                thumbColor="#ffffff"
                trackColor={{ false: "#FECACA", true: "#A7F3D0" }}
                disabled={storeActionLoading}
              />
            </View>
          </View>
          <View style={styles.deleteRow}>
            <TouchableOpacity
              style={[styles.deleteButton, storeActionLoading && styles.actionButtonDisabled]}
              disabled={storeActionLoading}
              onPress={handleDeleteStore}
            >
              <Ionicons name="trash-outline" size={16} color="#DC2626" />
              <Text style={styles.deleteButtonText}>Delete Store</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Products</Text>
            <View style={styles.sectionCountBadge}>
              <Ionicons name="cube-outline" size={14} color="#277874" />
              <Text style={styles.sectionCountText}>
                {productsForStore.length}
              </Text>
            </View>
          </View>

          {productsForStore.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No products for this store</Text>
              <Text style={styles.emptySub}>
                Products created under this store will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {productsForStore.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <Image
                    source={{
                      uri:
                        product.imageUrl ||
                        "https://via.placeholder.com/64x64.png?text=P",
                    }}
                    style={styles.productThumbnail}
                  />
                  <View style={styles.productBody}>
                    <Text style={styles.productTitle}>{product.name}</Text>
                    {product.description ? (
                      <Text style={styles.productSub} numberOfLines={2}>
                        {product.description}
                      </Text>
                    ) : null}
                    <View style={styles.productMetaRow}>
                      <View
                        style={[
                          styles.metaPill,
                          { backgroundColor: "#E0F2F1" },
                        ]}
                      >
                        <Ionicons
                          name="pricetag"
                          size={14}
                          color="#277874"
                        />
                        <Text
                          style={[
                            styles.metaText,
                            { color: "#277874" },
                          ]}
                        >
                          ₱{Number(product.price).toLocaleString()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metaPill,
                          { backgroundColor: "#FEF3C7" },
                        ]}
                      >
                        <Ionicons
                          name="cube"
                          size={14}
                          color="#B45309"
                        />
                        <Text
                          style={[
                            styles.metaText,
                            { color: "#92400E" },
                          ]}
                        >
                          Stock: {product.stock}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metaPill,
                          {
                            backgroundColor: product.isActive
                              ? "#D1FAE5"
                              : "#F3F4F6",
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            product.isActive
                              ? "checkmark-circle"
                              : "pause-circle"
                          }
                          size={14}
                          color={
                            product.isActive ? "#10B981" : "#6B7280"
                          }
                        />
                        <Text
                          style={[
                            styles.metaText,
                            {
                              color: product.isActive
                                ? "#065F46"
                                : "#374151",
                            },
                          ]}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.promotionActions}>
                      <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>
                          {product.isActive ? "Active" : "Disabled"}
                        </Text>
                        <Switch
                          value={!!product.isActive}
                          onValueChange={(value) =>
                            handleToggleProductActive(product.id, value)
                          }
                          trackColor={{
                            false: "#FECACA",
                            true: "#A7F3D0",
                          }}
                          thumbColor="#FFFFFF"
                          disabled={!!productStatusLoading[product.id]}
                        />
                      </View>
                      {productStatusLoading[product.id] && (
                        <ActivityIndicator size="small" color="#277874" />
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Promotions</Text>
            <View style={styles.sectionCountBadge}>
              <Ionicons name="pricetag" size={14} color="#277874" />
              <Text style={styles.sectionCountText}>
                {promotionsForStore.length}
              </Text>
            </View>
          </View>

          {promotionsForStore.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="pricetag-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>
                No promotions for this store
              </Text>
              <Text style={styles.emptySub}>
                Promotions tied to this store&apos;s products will appear
                here.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {promotionsForStore.map(({ promo, productName }) => (
                <View key={promo.id} style={styles.promoCard}>
                  <View style={styles.promoIconBadge}>
                    <Ionicons name="flame" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.promoBody}>
                    <Text style={styles.promoTitle}>{promo.title}</Text>
                    {promo.description ? (
                      <Text
                        style={styles.promoSub}
                        numberOfLines={2}
                      >
                        {promo.description}
                      </Text>
                    ) : null}
                    <View style={styles.productMetaRow}>
                      <View
                        style={[
                          styles.metaPill,
                          { backgroundColor: "#E0F2F1" },
                        ]}
                      >
                        <Ionicons
                          name="pricetag"
                          size={14}
                          color="#277874"
                        />
                        <Text
                          style={[
                            styles.metaText,
                            { color: "#277874" },
                          ]}
                        >
                          {promo.type === "percentage"
                            ? `${promo.discount}%`
                            : `₱${promo.discount}`}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metaPill,
                          { backgroundColor: "#F3F4F6" },
                        ]}
                      >
                        <Ionicons
                          name="cube"
                          size={14}
                          color="#6B7280"
                        />
                        <Text
                          style={[
                            styles.metaText,
                            { color: "#374151" },
                          ]}
                          numberOfLines={1}
                        >
                          {productName}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metaPill,
                          {
                            backgroundColor: promo.active
                              ? "#D1FAE5"
                              : "#F3F4F6",
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            promo.active
                              ? "checkmark-circle"
                              : "pause-circle"
                          }
                          size={14}
                          color={
                            promo.active ? "#10B981" : "#6B7280"
                          }
                        />
                        <Text
                          style={[
                            styles.metaText,
                            {
                              color: promo.active
                                ? "#065F46"
                                : "#374151",
                            },
                          ]}
                        >
                          {promo.active ? "Active" : "Inactive"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.promotionActions}>
                      <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>
                          {promo.active ? "Active" : "Disabled"}
                        </Text>
                        <Switch
                          value={!!promo.active}
                          onValueChange={(value) =>
                            handleTogglePromotionActive(promo.id, value)
                          }
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
                </View>
              ))}
            </View>
          )}
        </View>
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
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  bannerWrapper: {
    marginLeft: -20,
    marginRight: -20,
    backgroundColor: "#E5E7EB",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  banner: {
    width: "100%",
    height: 180,
  },
  bannerPlaceholder: {
    backgroundColor: "#CBD5F5",
  },
  bannerOverlayRow: {
    position: "absolute",
    right: 16,
    bottom: 16,
    flexDirection: "row",
    gap: 8,
  },
  locateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(39, 120, 116, 0.95)",
  },
  locateButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  backIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  storeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },
  storeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  storeThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginRight: 12,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  storeDescription: {
    fontSize: 13,
    color: "#6B7280",
  },
  storeMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
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
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#277874",
  },
  sectionCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0f9f8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  sectionCountText: {
    color: "#277874",
    fontWeight: "700",
    fontSize: 12,
  },
  list: {
    gap: 10,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  productThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginRight: 12,
  },
  productBody: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  productSub: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
  },
  productMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  promoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  promoIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#277874",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  promoBody: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  promoSub: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#6B7280",
  },
  emptySub: {
    marginTop: 4,
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#277874",
    textAlign: "center",
  },
  backButton: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#277874",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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
  deleteRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#DC2626",
  },
  deleteButtonText: {
    color: "#DC2626",
    fontSize: 14,
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
  promotionActions: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});


