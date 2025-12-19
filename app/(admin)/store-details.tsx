import env from "@/config/env";
import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import type { Promotion } from "@/features/store/promotions/types";
import { getDealTypeLabel } from "@/utils/dealTypes";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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
  const [compactView, setCompactView] = useState(false);
  
  // Search and filter states
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [promotionSearchQuery, setPromotionSearchQuery] = useState("");
  const [productFilterActive, setProductFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [promotionFilterActive, setPromotionFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [productSortBy, setProductSortBy] = useState<"name" | "price" | "date">("name");
  const [promotionSortBy, setPromotionSortBy] = useState<"title" | "date">("title");
  const [showProductFilters, setShowProductFilters] = useState(false);
  const [showPromotionFilters, setShowPromotionFilters] = useState(false);
  const [displayMode, setDisplayMode] = useState<"both" | "products" | "promotions">("both");
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<{ promo: Promotion; productName: string } | null>(null);
  
  // Edit states
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editProductName, setEditProductName] = useState("");
  const [editProductDescription, setEditProductDescription] = useState("");
  const [editProductPrice, setEditProductPrice] = useState("");
  const [editProductStock, setEditProductStock] = useState("");
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [isDeletingPromotion, setIsDeletingPromotion] = useState(false);

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
    if (!storeState.stores || !storeState.stores.length) {
      storeActions.findStores();
    }
    if (!storeState.products || !storeState.products.length) {
      storeActions.findProducts();
    }
    if (!storeState.promotions || !storeState.promotions.length) {
      storeActions.findPromotions();
    }
    if (!authState.allUsers || !authState.allUsers.length) {
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
    if (!store?.ownerId || !authState.allUsers || !authState.allUsers.length) return undefined;
    return authState.allUsers.find((u) => u.id === store.ownerId);
  }, [store, authState.allUsers]);

  const productsForStore = useMemo(
    () =>
      storeId != null
        ? storeState.products.filter((p) => p.storeId === storeId)
        : [],
    [storeId, storeState.products]
  );

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = [...productsForStore];

    // Search filter
    if (productSearchQuery.trim()) {
      const query = productSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Active/Inactive filter
    if (productFilterActive === "active") {
      filtered = filtered.filter((p) => p.isActive !== false);
    } else if (productFilterActive === "inactive") {
      filtered = filtered.filter((p) => p.isActive === false);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (productSortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "price":
          return Number(a.price || 0) - Number(b.price || 0);
        case "date":
          const dateA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
          const dateB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
          return dateB - dateA; // Newest first
        default:
          return 0;
      }
    });

    return filtered;
  }, [productsForStore, productSearchQuery, productFilterActive, productSortBy]);

  const promotionsForStore = useMemo(() => {
    if (!storeId || !storeState.promotions || !storeState.promotions.length || !storeState.products || !storeState.products.length) return [];
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

  // Filtered and sorted promotions
  const filteredPromotions = useMemo(() => {
    let filtered = [...promotionsForStore];

    // Search filter
    if (promotionSearchQuery.trim()) {
      const query = promotionSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.promo.title?.toLowerCase().includes(query) ||
          item.productName?.toLowerCase().includes(query) ||
          item.promo.description?.toLowerCase().includes(query)
      );
    }

    // Active/Inactive filter
    if (promotionFilterActive === "active") {
      filtered = filtered.filter((item) => item.promo.active === true);
    } else if (promotionFilterActive === "inactive") {
      filtered = filtered.filter((item) => item.promo.active === false);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (promotionSortBy) {
        case "title":
          return (a.promo.title || "").localeCompare(b.promo.title || "");
        case "date":
          const dateA = (a.promo as any).createdAt ? new Date((a.promo as any).createdAt).getTime() : 0;
          const dateB = (b.promo as any).createdAt ? new Date((b.promo as any).createdAt).getTime() : 0;
          return dateB - dateA; // Newest first
        default:
          return 0;
      }
    });

    return filtered;
  }, [promotionsForStore, promotionSearchQuery, promotionFilterActive, promotionSortBy]);

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

  // Product modal handlers
  const handleProductPress = (product: any) => {
    setSelectedProduct(product);
    setEditProductName(product.name || "");
    setEditProductDescription(product.description || "");
    setEditProductPrice(String(product.price || ""));
    setEditProductStock(String(product.stock || ""));
    setIsEditingProduct(false);
    setShowProductModal(true);
  };

  const handleEditProduct = () => {
    setIsEditingProduct(true);
  };

  const handleSaveProduct = async () => {
    if (!selectedProduct) return;
    
    if (!editProductName.trim()) {
      Alert.alert("Error", "Product name is required");
      return;
    }
    
    const price = parseFloat(editProductPrice);
    const stock = parseInt(editProductStock, 10);
    
    if (isNaN(price) || price <= 0) {
      Alert.alert("Error", "Price must be a positive number");
      return;
    }
    
    if (isNaN(stock) || stock < 0) {
      Alert.alert("Error", "Stock must be a non-negative number");
      return;
    }

    setIsSavingProduct(true);
    
    try {
      await storeActions.updateProduct({
        id: selectedProduct.id,
        name: editProductName.trim(),
        description: editProductDescription.trim() || undefined,
        price: price,
        stock: stock,
      }).unwrap();
      
      await storeActions.findProducts();
      setIsEditingProduct(false);
      Alert.alert("Success", "Product updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update product");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = () => {
    if (!selectedProduct) return;
    
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${selectedProduct.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeletingProduct(true);
            try {
              await storeActions.deleteProduct(selectedProduct.id).unwrap();
              await storeActions.findProducts();
              setShowProductModal(false);
              setSelectedProduct(null);
              Alert.alert("Success", "Product deleted successfully");
            } catch (error: any) {
              Alert.alert("Error", error?.message || "Failed to delete product");
            } finally {
              setIsDeletingProduct(false);
            }
          },
        },
      ]
    );
  };

  // Promotion modal handlers
  const handlePromotionPress = (item: { promo: Promotion; productName: string }) => {
    setSelectedPromotion(item);
    setShowPromotionModal(true);
  };

  // Get all products for a promotion
  const getPromotionProducts = useMemo(() => {
    if (!selectedPromotion || !storeState.products) return [];
    
    const promo = selectedPromotion.promo as any;
    
    // Check if promotion has promotionProducts array
    if (promo.promotionProducts && Array.isArray(promo.promotionProducts) && promo.promotionProducts.length > 0) {
      const productIds = promo.promotionProducts
        .map((pp: any) => pp.productId)
        .filter((id: number) => id != null);
      
      return storeState.products.filter((p) => 
        productIds.includes(p.id) && p.storeId === storeId
      );
    }
    
    // Check if promotion has productIds array
    if (promo.productIds && Array.isArray(promo.productIds) && promo.productIds.length > 0) {
      return storeState.products.filter((p) => 
        promo.productIds.includes(p.id) && p.storeId === storeId
      );
    }
    
    // Fallback to single productId
    if (promo.productId) {
      const product = storeState.products.find((p) => p.id === promo.productId && p.storeId === storeId);
      return product ? [product] : [];
    }
    
    return [];
  }, [selectedPromotion, storeState.products, storeId]);

  const handleDeletePromotion = () => {
    if (!selectedPromotion) return;
    
    Alert.alert(
      "Delete Promotion",
      `Are you sure you want to delete "${selectedPromotion.promo.title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeletingPromotion(true);
            try {
              await storeActions.deletePromotion(selectedPromotion.promo.id).unwrap();
              await storeActions.findPromotions();
              setShowPromotionModal(false);
              setSelectedPromotion(null);
              Alert.alert("Success", "Promotion deleted successfully");
            } catch (error: any) {
              Alert.alert("Error", error?.message || "Failed to delete promotion");
            } finally {
              setIsDeletingPromotion(false);
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
        {/* Welcome Section */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingContent}>
            <View style={styles.greetingTextContainer}>
              <Text style={styles.greetingTitle}>Store Details</Text>
              <Text style={styles.greetingSubtitle}>
                Manage products and promotions for {displayName}
              </Text>
            </View>
            <View style={styles.greetingDecoration}>
              <LinearGradient
                colors={["#FFBE5D", "#277874"]}
                style={styles.aiIconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="storefront" size={28} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Store Banner / Hero */}
        <View style={styles.bannerWrapper}>
          {bannerUrl ? (
            <Image
              source={{ uri: bannerUrl }}
              resizeMode="cover"
              style={styles.banner}
            />
          ) : (
            <LinearGradient
              colors={["#CBD5F5", "#E0E7FF"]}
              style={styles.banner}
            />
          )}
          <View style={styles.bannerOverlayRow}>
            <TouchableOpacity
              style={styles.locateButton}
              onPress={handleLocateStore}
            >
              <LinearGradient
                colors={["#277874", "#1B6F5D"]}
                style={styles.locateButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="navigate" size={16} color="#FFFFFF" />
                <Text style={styles.locateButtonText}>Locate Store</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.storeCard}>
          {/* Delete Button - Floating Icon */}
          <TouchableOpacity
            style={[styles.deleteIconButton, storeActionLoading && styles.actionButtonDisabled]}
            disabled={storeActionLoading}
            onPress={handleDeleteStore}
          >
            <Ionicons name="trash-outline" size={20} color="#DC2626" />
          </TouchableOpacity>

          {/* Store Header */}
          <View style={styles.storeHeaderRow}>
            <View style={styles.storeThumbnailWrapper}>
              <Image
                source={{
                  uri:
                    store?.imageUrl ||
                    "https://via.placeholder.com/64x64.png?text=S",
                }}
                style={styles.storeThumbnail}
              />
              <View style={styles.storeThumbnailShadow} />
            </View>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{displayName}</Text>
              {store?.description ? (
                <Text style={styles.storeDescription} numberOfLines={2}>
                  {store.description}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Status Pills */}
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

          {/* Divider */}
          <View style={styles.divider} />

          {/* Action Controls */}
          <View style={styles.actionControls}>
            <View style={styles.actionGroup}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
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
                  <LinearGradient
                    colors={
                      store?.verificationStatus === "VERIFIED"
                        ? ["#DC2626", "#B91C1C"]
                        : ["#10B981", "#059669"]
                    }
                    style={styles.actionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
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
                  </LinearGradient>
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
          </View>
        </View>

        {/* Display Mode Tabs */}
        <View style={styles.displayModeContainer}>
          <TouchableOpacity
            style={[
              styles.displayModeTab,
              displayMode === "both" && styles.displayModeTabActive,
            ]}
            onPress={() => setDisplayMode("both")}
          >
            {displayMode === "both" ? (
              <LinearGradient
                colors={["#FFBE5D", "#F59E0B"]}
                style={styles.displayModeTabGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons
                  name="grid"
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.displayModeTextActive}>Both</Text>
              </LinearGradient>
            ) : (
              <View style={styles.displayModeTabInactive}>
                <Ionicons
                  name="grid-outline"
                  size={16}
                  color="#277874"
                />
                <Text style={styles.displayModeText}>Both</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.displayModeTab,
              displayMode === "products" && styles.displayModeTabActive,
            ]}
            onPress={() => setDisplayMode("products")}
          >
            {displayMode === "products" ? (
              <LinearGradient
                colors={["#277874", "#1B6F5D"]}
                style={styles.displayModeTabGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons
                  name="cube"
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.displayModeTextActive}>Products</Text>
              </LinearGradient>
            ) : (
              <View style={styles.displayModeTabInactive}>
                <Ionicons
                  name="cube-outline"
                  size={16}
                  color="#277874"
                />
                <Text style={styles.displayModeText}>Products</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.displayModeTab,
              displayMode === "promotions" && styles.displayModeTabActive,
            ]}
            onPress={() => setDisplayMode("promotions")}
          >
            {displayMode === "promotions" ? (
              <LinearGradient
                colors={["#F59E0B", "#D97706"]}
                style={styles.displayModeTabGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons
                  name="pricetag"
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.displayModeTextActive}>Promotions</Text>
              </LinearGradient>
            ) : (
              <View style={styles.displayModeTabInactive}>
                <Ionicons
                  name="pricetag-outline"
                  size={16}
                  color="#277874"
                />
                <Text style={styles.displayModeText}>Promotions</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {(displayMode === "both" || displayMode === "products") && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Products</Text>
            <View style={styles.sectionHeaderRight}>
              <TouchableOpacity
                style={styles.viewToggle}
                onPress={() => setShowProductFilters(!showProductFilters)}
              >
                <Ionicons 
                  name={showProductFilters ? "filter" : "filter-outline"} 
                  size={16} 
                  color="#277874" 
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewToggle}
                onPress={() => setCompactView(!compactView)}
              >
                <Ionicons 
                  name={compactView ? "grid" : "list"} 
                  size={16} 
                  color="#277874" 
                />
              </TouchableOpacity>
              <View style={styles.sectionCountBadge}>
                <Ionicons name="cube-outline" size={14} color="#277874" />
                <Text style={styles.sectionCountText}>
                  {filteredProducts.length}/{productsForStore.length}
                </Text>
              </View>
            </View>
          </View>

          {showProductFilters && (
            <View style={styles.filterContainer}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={16} color="#6B7280" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search products..."
                  value={productSearchQuery}
                  onChangeText={setProductSearchQuery}
                  placeholderTextColor="#9CA3AF"
                />
                {productSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setProductSearchQuery("")}>
                    <Ionicons name="close-circle" size={18} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.filterRow}>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Status:</Text>
                  <View style={styles.filterButtons}>
                    {(["all", "active", "inactive"] as const).map((filter) => (
                      <TouchableOpacity
                        key={filter}
                        style={[
                          styles.filterButton,
                          productFilterActive === filter && styles.filterButtonActive,
                        ]}
                        onPress={() => setProductFilterActive(filter)}
                      >
                        <Text
                          style={[
                            styles.filterButtonText,
                            productFilterActive === filter && styles.filterButtonTextActive,
                          ]}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Sort:</Text>
                  <View style={styles.filterButtons}>
                    {(["name", "price", "date"] as const).map((sort) => (
                      <TouchableOpacity
                        key={sort}
                        style={[
                          styles.filterButton,
                          productSortBy === sort && styles.filterButtonActive,
                        ]}
                        onPress={() => setProductSortBy(sort)}
                      >
                        <Text
                          style={[
                            styles.filterButtonText,
                            productSortBy === sort && styles.filterButtonTextActive,
                          ]}
                        >
                          {sort.charAt(0).toUpperCase() + sort.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}

          {productsForStore.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No products for this store</Text>
              <Text style={styles.emptySub}>
                Products created under this store will appear here.
              </Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No products match your filters</Text>
              <Text style={styles.emptySub}>
                Try adjusting your search or filter criteria.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filteredProducts.map((product) => (
                <TouchableOpacity 
                  key={product.id} 
                  style={[styles.productCard, compactView && styles.productCardCompact]}
                  onPress={() => handleProductPress(product)}
                  activeOpacity={0.7}
                >
                  {compactView ? (
                    <>
                      <Image
                        source={{
                          uri:
                            product.imageUrl ||
                            "https://via.placeholder.com/64x64.png?text=P",
                        }}
                        style={styles.productThumbnailCompact}
                      />
                      <View style={styles.productBodyCompact}>
                        <Text style={styles.productTitleCompact} numberOfLines={1}>{product.name}</Text>
                        <View style={styles.productMetaRowCompact}>
                          <View
                            style={[
                              styles.metaPillCompact,
                              { backgroundColor: "#E0F2F1" },
                            ]}
                          >
                            <Ionicons
                              name="pricetag"
                              size={10}
                              color="#277874"
                            />
                            <Text
                              style={[
                                styles.metaTextCompact,
                                { color: "#277874" },
                              ]}
                            >
                              ₱{Number(product.price).toLocaleString()}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.metaPillCompact,
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
                              size={10}
                              color={
                                product.isActive ? "#10B981" : "#6B7280"
                              }
                            />
                            <Text
                              style={[
                                styles.metaTextCompact,
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
                      </View>
                      <View style={styles.actionsCompact}>
                        <TouchableOpacity
                          activeOpacity={1}
                          onPress={(e) => e.stopPropagation()}
                        >
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
                        </TouchableOpacity>
                        {productStatusLoading[product.id] && (
                          <ActivityIndicator size="small" color="#277874" />
                        )}
                      </View>
                    </>
                  ) : (
                    <>
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
                              size={12}
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
                              size={12}
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
                          <TouchableOpacity
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                            style={styles.switchRow}
                          >
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
                          </TouchableOpacity>
                          {productStatusLoading[product.id] && (
                            <ActivityIndicator size="small" color="#277874" />
                          )}
                        </View>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        )}

        {(displayMode === "both" || displayMode === "promotions") && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Promotions</Text>
            <View style={styles.sectionHeaderRight}>
              <TouchableOpacity
                style={styles.viewToggle}
                onPress={() => setShowPromotionFilters(!showPromotionFilters)}
              >
                <Ionicons 
                  name={showPromotionFilters ? "filter" : "filter-outline"} 
                  size={16} 
                  color="#277874" 
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewToggle}
                onPress={() => setCompactView(!compactView)}
              >
                <Ionicons 
                  name={compactView ? "grid" : "list"} 
                  size={16} 
                  color="#277874" 
                />
              </TouchableOpacity>
              <View style={styles.sectionCountBadge}>
                <Ionicons name="pricetag" size={14} color="#277874" />
                <Text style={styles.sectionCountText}>
                  {filteredPromotions.length}/{promotionsForStore.length}
                </Text>
              </View>
            </View>
          </View>

          {showPromotionFilters && (
            <View style={styles.filterContainer}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={16} color="#6B7280" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search promotions..."
                  value={promotionSearchQuery}
                  onChangeText={setPromotionSearchQuery}
                  placeholderTextColor="#9CA3AF"
                />
                {promotionSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setPromotionSearchQuery("")}>
                    <Ionicons name="close-circle" size={18} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.filterRow}>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Status:</Text>
                  <View style={styles.filterButtons}>
                    {(["all", "active", "inactive"] as const).map((filter) => (
                      <TouchableOpacity
                        key={filter}
                        style={[
                          styles.filterButton,
                          promotionFilterActive === filter && styles.filterButtonActive,
                        ]}
                        onPress={() => setPromotionFilterActive(filter)}
                      >
                        <Text
                          style={[
                            styles.filterButtonText,
                            promotionFilterActive === filter && styles.filterButtonTextActive,
                          ]}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Sort:</Text>
                  <View style={styles.filterButtons}>
                    {(["title", "date"] as const).map((sort) => (
                      <TouchableOpacity
                        key={sort}
                        style={[
                          styles.filterButton,
                          promotionSortBy === sort && styles.filterButtonActive,
                        ]}
                        onPress={() => setPromotionSortBy(sort)}
                      >
                        <Text
                          style={[
                            styles.filterButtonText,
                            promotionSortBy === sort && styles.filterButtonTextActive,
                          ]}
                        >
                          {sort.charAt(0).toUpperCase() + sort.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}

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
          ) : filteredPromotions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No promotions match your filters</Text>
              <Text style={styles.emptySub}>
                Try adjusting your search or filter criteria.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filteredPromotions.map(({ promo, productName }) => (
                <TouchableOpacity 
                  key={promo.id} 
                  style={[styles.promoCard, compactView && styles.promoCardCompact]}
                  onPress={() => handlePromotionPress({ promo, productName })}
                  activeOpacity={0.7}
                >
                  {compactView ? (
                    <>
                      <LinearGradient
                        colors={["#FFBE5D", "#F59E0B"]}
                        style={styles.promoIconBadgeCompact}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons name="flame" size={14} color="#FFFFFF" />
                      </LinearGradient>
                      <View style={styles.promoBodyCompact}>
                        <Text style={styles.promoTitleCompact} numberOfLines={1}>{promo.title}</Text>
                        <View style={styles.productMetaRowCompact}>
                          {(() => {
                            // Use new dealType fields first, fallback to legacy type/discount
                            let discountDisplay: string | null = null;
                            
                            if (promo.dealType) {
                              switch (promo.dealType) {
                                case "PERCENTAGE_DISCOUNT":
                                  discountDisplay = promo.percentageOff != null ? `${promo.percentageOff}%` : null;
                                  break;
                                case "FIXED_DISCOUNT":
                                  discountDisplay = promo.fixedAmountOff != null ? `₱${promo.fixedAmountOff}` : null;
                                  break;
                                case "BOGO":
                                  discountDisplay = `BOGO ${promo.buyQuantity ?? 1}/${promo.getQuantity ?? 1}`;
                                  break;
                                case "BUNDLE":
                                  discountDisplay = promo.bundlePrice != null ? `₱${promo.bundlePrice}` : null;
                                  break;
                                case "QUANTITY_DISCOUNT":
                                  discountDisplay = promo.quantityDiscount != null ? `${promo.quantityDiscount}%` : null;
                                  break;
                                case "VOUCHER":
                                  discountDisplay = promo.voucherValue != null ? `₱${promo.voucherValue}` : null;
                                  break;
                              }
                            }
                            
                            // Fallback to legacy fields
                            if (!discountDisplay && promo.type && promo.discount != null) {
                              const type = String(promo.type).toLowerCase();
                              if (type === "percentage") {
                                discountDisplay = `${promo.discount}%`;
                              } else {
                                discountDisplay = `₱${promo.discount}`;
                              }
                            }
                            
                            if (!discountDisplay) return null;
                            
                            return (
                              <View
                                style={[
                                  styles.metaPillCompact,
                                  { backgroundColor: "#E0F2F1" },
                                ]}
                              >
                                <Ionicons
                                  name="pricetag"
                                  size={10}
                                  color="#277874"
                                />
                                <Text
                                  style={[
                                    styles.metaTextCompact,
                                    { color: "#277874" },
                                  ]}
                                >
                                  {discountDisplay}
                                </Text>
                              </View>
                            );
                          })()}
                          <View
                            style={[
                              styles.metaPillCompact,
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
                              size={10}
                              color={
                                promo.active ? "#10B981" : "#6B7280"
                              }
                            />
                            <Text
                              style={[
                                styles.metaTextCompact,
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
                      </View>
                      <View style={styles.actionsCompact}>
                        <TouchableOpacity
                          activeOpacity={1}
                          onPress={(e) => e.stopPropagation()}
                        >
                          <Switch
                            value={!!promo.active}
                            onValueChange={(value) =>
                              handleTogglePromotionActive(promo.id, value)
                            }
                            trackColor={{ false: "#FECACA", true: "#A7F3D0" }}
                            thumbColor="#FFFFFF"
                            disabled={!!promotionStatusLoading[promo.id]}
                          />
                        </TouchableOpacity>
                        {promotionStatusLoading[promo.id] && (
                          <ActivityIndicator size="small" color="#277874" />
                        )}
                      </View>
                    </>
                  ) : (
                    <>
                      <LinearGradient
                        colors={["#FFBE5D", "#F59E0B"]}
                        style={styles.promoIconBadge}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons name="flame" size={20} color="#FFFFFF" />
                      </LinearGradient>
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
                          {(() => {
                            // Use new dealType fields first, fallback to legacy type/discount
                            let discountDisplay: string | null = null;
                            
                            if (promo.dealType) {
                              switch (promo.dealType) {
                                case "PERCENTAGE_DISCOUNT":
                                  discountDisplay = promo.percentageOff != null ? `${promo.percentageOff}%` : null;
                                  break;
                                case "FIXED_DISCOUNT":
                                  discountDisplay = promo.fixedAmountOff != null ? `₱${promo.fixedAmountOff}` : null;
                                  break;
                                case "BOGO":
                                  discountDisplay = `Buy ${promo.buyQuantity ?? 1} Get ${promo.getQuantity ?? 1}`;
                                  break;
                                case "BUNDLE":
                                  discountDisplay = promo.bundlePrice != null ? `₱${promo.bundlePrice}` : null;
                                  break;
                                case "QUANTITY_DISCOUNT":
                                  discountDisplay = promo.quantityDiscount != null ? `${promo.quantityDiscount}% off (${promo.minQuantity ?? 2}+)` : null;
                                  break;
                                case "VOUCHER":
                                  discountDisplay = promo.voucherValue != null ? `₱${promo.voucherValue} voucher` : null;
                                  break;
                              }
                            }
                            
                            // Fallback to legacy fields
                            if (!discountDisplay && promo.type && promo.discount != null) {
                              const type = String(promo.type).toLowerCase();
                              if (type === "percentage") {
                                discountDisplay = `${promo.discount}%`;
                              } else {
                                discountDisplay = `₱${promo.discount}`;
                              }
                            }
                            
                            if (!discountDisplay) return null;
                            
                            return (
                              <View
                                style={[
                                  styles.metaPill,
                                  { backgroundColor: "#E0F2F1" },
                                ]}
                              >
                                <Ionicons
                                  name="pricetag"
                                  size={12}
                                  color="#277874"
                                />
                                <Text
                                  style={[
                                    styles.metaText,
                                    { color: "#277874" },
                                  ]}
                                >
                                  {discountDisplay}
                                </Text>
                              </View>
                            );
                          })()}
                          {promo.dealType && 
                           typeof promo.dealType === "string" &&
                           (promo.dealType as string).trim() !== "" &&
                           ["PERCENTAGE_DISCOUNT", "FIXED_DISCOUNT", "BOGO", "BUNDLE", "QUANTITY_DISCOUNT", "VOUCHER"].includes(promo.dealType) && (() => {
                            const dealTypeLabel = getDealTypeLabel(promo.dealType as any);
                            if (!dealTypeLabel || dealTypeLabel === "undefined" || dealTypeLabel.trim() === "") {
                              return null;
                            }
                            return (
                              <View
                                style={[
                                  styles.metaPill,
                                  { backgroundColor: "#FEF3C7" },
                                ]}
                              >
                                <Ionicons
                                  name="gift"
                                  size={12}
                                  color="#D97706"
                                />
                                <Text
                                  style={[
                                    styles.metaText,
                                    { color: "#92400E" },
                                  ]}
                                >
                                  {dealTypeLabel}
                                </Text>
                              </View>
                            );
                          })()}
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
                              size={12}
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
                          <TouchableOpacity
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                            style={styles.switchRow}
                          >
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
                          </TouchableOpacity>
                          {promotionStatusLoading[promo.id] && (
                            <ActivityIndicator size="small" color="#277874" />
                          )}
                        </View>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        )}
      </ScrollView>

      {/* Product Detail Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowProductModal(false);
          setIsEditingProduct(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditingProduct ? "Edit Product" : "Product Details"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowProductModal(false);
                  setIsEditingProduct(false);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedProduct && (
                <>
                  {!isEditingProduct ? (
                    <>
                      <View style={styles.modalImageContainer}>
                        <Image
                          source={{
                            uri: selectedProduct.imageUrl || "https://via.placeholder.com/200x200.png?text=P",
                          }}
                          style={styles.modalImage}
                        />
                      </View>
                      
                      <View style={styles.modalInfoSection}>
                        <Text style={styles.modalInfoLabel}>Name</Text>
                        <Text style={styles.modalInfoValue}>{selectedProduct.name}</Text>
                      </View>

                      {selectedProduct.description && (
                        <View style={styles.modalInfoSection}>
                          <Text style={styles.modalInfoLabel}>Description</Text>
                          <Text style={styles.modalInfoValue}>{selectedProduct.description}</Text>
                        </View>
                      )}

                      <View style={styles.modalInfoSection}>
                        <Text style={styles.modalInfoLabel}>Price</Text>
                        <Text style={styles.modalInfoValue}>₱{Number(selectedProduct.price || 0).toLocaleString()}</Text>
                      </View>

                      <View style={styles.modalInfoSection}>
                        <Text style={styles.modalInfoLabel}>Stock</Text>
                        <Text style={styles.modalInfoValue}>{selectedProduct.stock ?? 0}</Text>
                      </View>

                      <View style={styles.modalInfoSection}>
                        <Text style={styles.modalInfoLabel}>Status</Text>
                        <View style={styles.modalStatusBadge}>
                          <Ionicons
                            name={selectedProduct.isActive ? "checkmark-circle" : "pause-circle"}
                            size={16}
                            color={selectedProduct.isActive ? "#10B981" : "#6B7280"}
                          />
                          <Text
                            style={[
                              styles.modalStatusText,
                              { color: selectedProduct.isActive ? "#10B981" : "#6B7280" },
                            ]}
                          >
                            {selectedProduct.isActive ? "Active" : "Inactive"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          style={[styles.modalActionButton, styles.editButton]}
                          onPress={handleEditProduct}
                        >
                          <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                          <Text style={styles.modalActionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.modalActionButton, styles.deleteButton]}
                          onPress={handleDeleteProduct}
                          disabled={isDeletingProduct}
                        >
                          {isDeletingProduct ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                              <Text style={styles.modalActionButtonText}>Delete</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.editFormGroup}>
                        <Text style={styles.editFormLabel}>Name *</Text>
                        <TextInput
                          style={styles.editFormInput}
                          value={editProductName}
                          onChangeText={setEditProductName}
                          placeholder="Product name"
                        />
                      </View>

                      <View style={styles.editFormGroup}>
                        <Text style={styles.editFormLabel}>Description</Text>
                        <TextInput
                          style={[styles.editFormInput, styles.editFormTextArea]}
                          value={editProductDescription}
                          onChangeText={setEditProductDescription}
                          placeholder="Product description"
                          multiline
                          numberOfLines={4}
                        />
                      </View>

                      <View style={styles.editFormRow}>
                        <View style={styles.editFormGroupHalf}>
                          <Text style={styles.editFormLabel}>Price *</Text>
                          <TextInput
                            style={styles.editFormInput}
                            value={editProductPrice}
                            onChangeText={setEditProductPrice}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                          />
                        </View>
                        <View style={styles.editFormGroupHalf}>
                          <Text style={styles.editFormLabel}>Stock *</Text>
                          <TextInput
                            style={styles.editFormInput}
                            value={editProductStock}
                            onChangeText={setEditProductStock}
                            placeholder="0"
                            keyboardType="number-pad"
                          />
                        </View>
                      </View>

                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          style={[styles.modalActionButton, styles.cancelButton]}
                          onPress={() => setIsEditingProduct(false)}
                        >
                          <Text style={[styles.modalActionButtonText, { color: "#6B7280" }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.modalActionButton, styles.saveButton]}
                          onPress={handleSaveProduct}
                          disabled={isSavingProduct}
                        >
                          {isSavingProduct ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Ionicons name="checkmark-outline" size={18} color="#FFFFFF" />
                              <Text style={styles.modalActionButtonText}>Save</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Promotion Detail Modal */}
      <Modal
        visible={showPromotionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPromotionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Promotion Details</Text>
              <TouchableOpacity
                onPress={() => setShowPromotionModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedPromotion && (
                <>
                  <View style={styles.modalIconContainer}>
                    <View style={styles.modalPromoIcon}>
                      <Ionicons name="flame" size={32} color="#FFFFFF" />
                    </View>
                  </View>

                  <View style={styles.modalInfoSection}>
                    <Text style={styles.modalInfoLabel}>Title</Text>
                    <Text style={styles.modalInfoValue}>{selectedPromotion.promo.title}</Text>
                  </View>

                  {selectedPromotion.promo.description && (
                    <View style={styles.modalInfoSection}>
                      <Text style={styles.modalInfoLabel}>Description</Text>
                      <Text style={styles.modalInfoValue}>{selectedPromotion.promo.description}</Text>
                    </View>
                  )}

                  {/* Products Section */}
                  {getPromotionProducts.length > 0 && (
                    <View style={styles.modalInfoSection}>
                      <Text style={styles.modalInfoLabel}>
                        {getPromotionProducts.length > 1 ? "Products" : "Product"}
                      </Text>
                      {getPromotionProducts.length === 1 ? (
                        <Text style={styles.modalInfoValue}>{getPromotionProducts[0].name}</Text>
                      ) : (
                        <View style={styles.modalProductsList}>
                          {getPromotionProducts.map((product) => (
                            <View key={product.id} style={styles.modalProductItem}>
                              <Image
                                source={{
                                  uri: product.imageUrl || "https://via.placeholder.com/48x48.png?text=P",
                                }}
                                style={styles.modalProductImage}
                              />
                              <View style={styles.modalProductInfo}>
                                <Text style={styles.modalProductName}>{product.name}</Text>
                                <Text style={styles.modalProductPrice}>
                                  ₱{Number(product.price || 0).toLocaleString()}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.modalInfoSection}>
                    <Text style={styles.modalInfoLabel}>Deal Type</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedPromotion.promo.dealType
                        ? getDealTypeLabel(selectedPromotion.promo.dealType as any)
                        : "N/A"}
                    </Text>
                  </View>

                  {selectedPromotion.promo.dealType === "PERCENTAGE_DISCOUNT" && selectedPromotion.promo.percentageOff != null && (
                    <View style={styles.modalInfoSection}>
                      <Text style={styles.modalInfoLabel}>Percentage Off</Text>
                      <Text style={styles.modalInfoValue}>{selectedPromotion.promo.percentageOff}%</Text>
                    </View>
                  )}

                  {selectedPromotion.promo.dealType === "FIXED_DISCOUNT" && selectedPromotion.promo.fixedAmountOff != null && (
                    <View style={styles.modalInfoSection}>
                      <Text style={styles.modalInfoLabel}>Fixed Amount Off</Text>
                      <Text style={styles.modalInfoValue}>₱{selectedPromotion.promo.fixedAmountOff}</Text>
                    </View>
                  )}

                  {selectedPromotion.promo.dealType === "BOGO" && (
                    <>
                      {selectedPromotion.promo.buyQuantity != null && (
                        <View style={styles.modalInfoSection}>
                          <Text style={styles.modalInfoLabel}>Buy Quantity</Text>
                          <Text style={styles.modalInfoValue}>{selectedPromotion.promo.buyQuantity}</Text>
                        </View>
                      )}
                      {selectedPromotion.promo.getQuantity != null && (
                        <View style={styles.modalInfoSection}>
                          <Text style={styles.modalInfoLabel}>Get Quantity</Text>
                          <Text style={styles.modalInfoValue}>{selectedPromotion.promo.getQuantity}</Text>
                        </View>
                      )}
                    </>
                  )}

                  {selectedPromotion.promo.dealType === "BUNDLE" && selectedPromotion.promo.bundlePrice != null && (
                    <View style={styles.modalInfoSection}>
                      <Text style={styles.modalInfoLabel}>Bundle Price</Text>
                      <Text style={styles.modalInfoValue}>₱{selectedPromotion.promo.bundlePrice}</Text>
                    </View>
                  )}

                  {selectedPromotion.promo.dealType === "QUANTITY_DISCOUNT" && (
                    <>
                      {selectedPromotion.promo.minQuantity != null && (
                        <View style={styles.modalInfoSection}>
                          <Text style={styles.modalInfoLabel}>Minimum Quantity</Text>
                          <Text style={styles.modalInfoValue}>{selectedPromotion.promo.minQuantity}</Text>
                        </View>
                      )}
                      {selectedPromotion.promo.quantityDiscount != null && (
                        <View style={styles.modalInfoSection}>
                          <Text style={styles.modalInfoLabel}>Quantity Discount</Text>
                          <Text style={styles.modalInfoValue}>{selectedPromotion.promo.quantityDiscount}%</Text>
                        </View>
                      )}
                    </>
                  )}

                  {selectedPromotion.promo.dealType === "VOUCHER" && selectedPromotion.promo.voucherValue != null && (
                    <View style={styles.modalInfoSection}>
                      <Text style={styles.modalInfoLabel}>Voucher Value</Text>
                      <Text style={styles.modalInfoValue}>₱{selectedPromotion.promo.voucherValue}</Text>
                    </View>
                  )}

                  {selectedPromotion.promo.startsAt && (
                    <View style={styles.modalInfoSection}>
                      <Text style={styles.modalInfoLabel}>Starts At</Text>
                      <Text style={styles.modalInfoValue}>
                        {new Date(selectedPromotion.promo.startsAt).toLocaleString()}
                      </Text>
                    </View>
                  )}

                  {selectedPromotion.promo.endsAt && (
                    <View style={styles.modalInfoSection}>
                      <Text style={styles.modalInfoLabel}>Ends At</Text>
                      <Text style={styles.modalInfoValue}>
                        {new Date(selectedPromotion.promo.endsAt).toLocaleString()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.modalInfoSection}>
                    <Text style={styles.modalInfoLabel}>Status</Text>
                    <View style={styles.modalStatusBadge}>
                      <Ionicons
                        name={selectedPromotion.promo.active ? "checkmark-circle" : "pause-circle"}
                        size={16}
                        color={selectedPromotion.promo.active ? "#10B981" : "#6B7280"}
                      />
                      <Text
                        style={[
                          styles.modalStatusText,
                          { color: selectedPromotion.promo.active ? "#10B981" : "#6B7280" },
                        ]}
                      >
                        {selectedPromotion.promo.active ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalActionButton, styles.deleteButton]}
                      onPress={handleDeletePromotion}
                      disabled={isDeletingPromotion}
                    >
                      {isDeletingPromotion ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                          <Text style={styles.modalActionButtonText}>Delete</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  // Greeting Section
  greetingSection: {
    marginBottom: 16,
    marginTop: 0,
  },
  greetingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 0,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  greetingDecoration: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  aiIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  locateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  locateButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 2,
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
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  storeHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  storeThumbnailWrapper: {
    position: "relative",
    marginRight: 14,
  },
  storeThumbnail: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    zIndex: 1,
  },
  storeThumbnailShadow: {
    position: "absolute",
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: "#E0F2F1",
    top: 2,
    left: 2,
    zIndex: 0,
  },
  storeInfo: {
    flex: 1,
    justifyContent: "center",
  },
  storeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    lineHeight: 24,
  },
  storeDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  storeMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
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
  sectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F0FDF4",
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  sectionCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  productThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    marginRight: 14,
  },
  productBody: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  productSub: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 10,
    lineHeight: 18,
  },
  productMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  promoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  promoIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  promoBody: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  promoSub: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 10,
    lineHeight: 18,
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
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    fontSize: 14,
  },
  deleteIconButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionControls: {
    marginTop: 0,
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
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
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  // Compact view styles
  // Compact view styles - single line horizontal layout
  productCardCompact: {
    padding: 8,
    marginBottom: 6,
    alignItems: "center",
    minHeight: 48,
    flexDirection: "row",
  },
  productThumbnailCompact: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 8,
  },
  productBodyCompact: {
    flex: 1,
    justifyContent: "center",
  },
  productTitleCompact: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  productMetaRowCompact: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
  },
  promoCardCompact: {
    padding: 8,
    marginBottom: 6,
    alignItems: "center",
    minHeight: 48,
    flexDirection: "row",
  },
  promoIconBadgeCompact: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  promoBodyCompact: {
    flex: 1,
    justifyContent: "center",
  },
  promoTitleCompact: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
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
  filterContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
    padding: 0,
  },
  filterRow: {
    gap: 12,
  },
  filterGroup: {
    gap: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterButtonActive: {
    backgroundColor: "#E0F2F1",
    borderColor: "#277874",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterButtonTextActive: {
    color: "#277874",
    fontWeight: "600",
  },
  displayModeContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  displayModeTab: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  displayModeTabActive: {
    // Handled by gradient
  },
  displayModeTabGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  displayModeTabInactive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  displayModeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#277874",
  },
  displayModeTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "90%",
    maxHeight: "85%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  modalScroll: {
    maxHeight: 500,
  },
  modalImageContainer: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  modalIconContainer: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalPromoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#277874",
    justifyContent: "center",
    alignItems: "center",
  },
  modalInfoSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalInfoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalInfoValue: {
    fontSize: 16,
    color: "#1F2937",
    lineHeight: 24,
  },
  modalStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalStatusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  modalActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: "#277874",
  },
  saveButton: {
    backgroundColor: "#059669",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  deleteButton: {
    backgroundColor: "#DC2626",
  },
  modalActionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Edit Form Styles
  editFormGroup: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  editFormGroupHalf: {
    flex: 1,
    marginRight: 12,
  },
  editFormRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  editFormLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  editFormInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1F2937",
    backgroundColor: "#FFFFFF",
  },
  editFormTextArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  // Modal Products List Styles
  modalProductsList: {
    marginTop: 8,
    gap: 8,
  },
  modalProductItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalProductImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginRight: 12,
  },
  modalProductInfo: {
    flex: 1,
  },
  modalProductName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  modalProductPrice: {
    fontSize: 13,
    color: "#277874",
    fontWeight: "600",
  },
});


