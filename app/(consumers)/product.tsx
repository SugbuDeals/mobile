import env from "@/config/env";
import { useBookmarks } from "@/features/bookmarks";
import { useCatalog } from "@/features/catalog";
import { useStore } from "@/features/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Dimensions, Image, Linking, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function ProductDetailScreen() {
  const params = useLocalSearchParams() as Record<string, string | undefined>;
  const {
    state: { stores, selectedStore },
    action: { findProductById, findStoreById },
  } = useStore();
  const {
    state: { products },
  } = useCatalog();
  const router = useRouter();

  const productId = params.productId ? Number(params.productId) : undefined;
  
  // Get the actual product data if productId is available
  const actualProduct = useMemo(() => {
    if (productId && products) {
      return products.find((p: any) => p.id === productId);
    }
    return null;
  }, [productId, products]);

  // Ensure we fetch product details if missing or lacking storeId
  React.useEffect(() => {
    if (productId && (!actualProduct || !(actualProduct as any)?.storeId)) {
      findProductById(productId);
    }
  }, [productId, actualProduct, findProductById]);

  const productName = (params.name as string) || actualProduct?.name || "Product";
  const productStoreId = params.storeId ? Number(params.storeId) : (actualProduct as any)?.storeId;

  // Ensure we fetch store info if missing in list
  React.useEffect(() => {
    if (productStoreId) {
      findStoreById(productStoreId);
    }
  }, [productStoreId, findStoreById]);
  const storeFromList = stores.find((s: any) => s.id === productStoreId);
  const storeFromSelected =
    selectedStore && selectedStore.id === productStoreId ? selectedStore : undefined;
  const resolvedStore = storeFromSelected || storeFromList;
  const productStore =
    (params.store as string) || ((resolvedStore as any)?.name ?? "Store");
  const productPrice =
    typeof params.price === "number"
      ? (params.price as unknown as number)
      : Number(params.price || actualProduct?.price || 0);
  const productDistance =
    typeof params.distance === "number"
      ? (params.distance as unknown as number)
      : Number(params.distance || 0);
  const productDiscount = (params.discount as string) || "";
  const productImageUrl = (params.imageUrl as string) || actualProduct?.imageUrl || "";
  const productDescription = actualProduct?.description || "";

  const rawLogo = (resolvedStore as any)?.imageUrl as string | undefined;
  const logoUrl = (() => {
    if (!rawLogo) return undefined;
    if (/^https?:\/\//i.test(rawLogo)) return rawLogo;
    if (rawLogo.startsWith('/')) return `${env.API_BASE_URL}${rawLogo}`;
    return `${env.API_BASE_URL}/files/${rawLogo}`;
  })();

  // Compute store banner for this product's store (used in header)
  const rawBanner = (resolvedStore as any)?.bannerUrl as string | undefined;
  const bannerUrl = (() => {
    if (!rawBanner) return undefined;
    if (/^https?:\/\//i.test(rawBanner)) return rawBanner;
    if (rawBanner.startsWith('/')) return `${env.API_BASE_URL}${rawBanner}`;
    return `${env.API_BASE_URL}/files/${rawBanner}`;
  })();
  // If this product exists but was disabled by administrators, hide details from consumers
  if (actualProduct && (actualProduct as any)?.isActive === false) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={[styles.scrollViewContent, { alignItems: "center", justifyContent: "center" }]}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#B91C1C", marginBottom: 8 }}>
            This product is not available
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", textAlign: "center" }}>
            This item has been disabled by the store administrators and is currently hidden from shoppers.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <StoreHeader
          storeName={productStore}
          storeId={productStoreId}
          logoUrl={logoUrl}
          bannerUrl={bannerUrl}
          onOpenStore={() =>
            router.push({
              pathname: "/(consumers)/storedetails",
              params: { store: productStore, storeId: productStoreId },
            })
          }
        />
        <ProductCard
          name={productName}
          store={productStore}
          price={productPrice}
          distance={productDistance}
          discount={productDiscount}
          imageUrl={productImageUrl}
          description={productDescription}
        />
        <LocationCard
          storeName={productStore}
          storeId={productStoreId}
          onNavigate={() =>
            router.push({
              pathname: "/(consumers)/navigate",
              params: {
                storeName: productStore,
                storeId: productStoreId?.toString(),
                address: "123 Market Street",
              },
            })
          }
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
});

// Location Card (inline)
const screen = Dimensions.get("window");
function LocationCard({
  storeName,
  storeId,
  onNavigate,
}: {
  storeName: string;
  storeId?: number;
  onNavigate: () => void;
}) {
  const {
    state: { stores, selectedStore },
  } = useStore();
  const store = stores.find((s: any) => s.id === storeId) || (selectedStore && selectedStore.id === storeId ? selectedStore : undefined);
  const latitude = (store as any)?.latitude;
  const longitude = (store as any)?.longitude;
  const address = (store as any)?.address || "";
  const [region, setRegion] = React.useState<any | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted" && typeof latitude === 'number' && typeof longitude === 'number') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setRegion({
            latitude: latitude,
            longitude: longitude,
            latitudeDelta: Math.abs(latitude - pos.coords.latitude) + 0.02,
            longitudeDelta: Math.abs(longitude - pos.coords.longitude) + 0.02,
          });
        } else if (typeof latitude === 'number' && typeof longitude === 'number') {
          setRegion({ latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 });
        }
      } catch {}
    })();
  }, [latitude, longitude]);

  const openExternalDirections = () => {
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
    } else if (address) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`);
    } else {
      onNavigate();
    }
  };

  return (
    <View style={locStyles.container}>
      <Text style={locStyles.sectionTitle}>Location</Text>
      <View style={locStyles.card}>
        {region ? (
          <MapView style={locStyles.mapImage} initialRegion={region}>
            {typeof latitude === 'number' && typeof longitude === 'number' && (
              <Marker coordinate={{ latitude, longitude }} title={storeName} description={address} />
            )}
          </MapView>
        ) : (
          <Image source={require("../../assets/images/partial-react-logo.png")} style={locStyles.mapImage} />
        )}
        <View style={locStyles.detailsRow}>
          <View style={locStyles.locationDetails}>
            <Text style={locStyles.address}>{address || "Store location"}</Text>
            <Text style={locStyles.distance}>Navigate to destination</Text>
          </View>
          <View style={locStyles.buttonContainer}>
            <TouchableOpacity style={locStyles.navigateButton} activeOpacity={0.85} onPress={openExternalDirections}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="navigate" size={16} color="#ffffff" />
                <Text style={locStyles.buttonTitle}> Navigate</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const locStyles = StyleSheet.create({
  container: { marginTop: 20, marginBottom: 20, paddingHorizontal: 5 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mapImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
    backgroundColor: "#dedede",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  locationDetails: { flex: 1, marginRight: 10 },
  address: { fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 4 },
  distance: { fontSize: 14, color: "#888" },
  buttonContainer: { width: 120 },
  navigateButton: {
    backgroundColor: "#1B6F5D",
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  buttonTitle: { fontSize: 14, fontWeight: "600", color: "#ffffff", marginLeft: 6 },
});

// Product Card (inline)
function ProductCard({
  name,
  store,
  price,
  distance,
  discount,
  imageUrl,
  description,
}: {
  name: string;
  store: string;
  price: number;
  distance?: number;
  discount?: string;
  imageUrl?: string;
  description?: string;
}) {
  const { state: { activePromotions } } = useStore();
  const params = useLocalSearchParams() as Record<string, string | undefined>;
  const productId = params.productId ? Number(params.productId) : undefined;
  const [showDescription, setShowDescription] = useState(false);
  const hasDescription = description && description.trim().length > 0;

  const computedDiscountedPrice = React.useMemo(() => {
    if (!productId) return undefined;
    const promo = (activePromotions || []).find((p: any) => p.productId === productId && p.active === true);
    if (!promo) return undefined;
    const p = Number(price);
    if (!isFinite(p)) return undefined;
    const type = String(promo.type || '').toLowerCase();
    const value = Number(promo.discount || 0);
    if (type === 'percentage') return Math.max(0, p * (1 - value / 100));
    if (type === 'fixed') return Math.max(0, p - value);
    return undefined;
  }, [activePromotions, productId, price]);

  return (
    <>
      <View style={prodStyles.container}>
        <View style={prodStyles.headerRow}>
          <Text style={prodStyles.sectionTitle}>Product Details</Text>
          <View style={prodStyles.statusHeaderRow}>
            <Text style={prodStyles.statusHeaderLabel}>Status:</Text>
            <View style={prodStyles.statusPill}>
              <Text style={prodStyles.statusPillText}>In Stock</Text>
            </View>
          </View>
        </View>
        <View style={prodStyles.card}>
          <View style={prodStyles.cardRow}>
            <View style={prodStyles.leftContent}>
              <Image
                source={
                  imageUrl
                    ? { uri: imageUrl }
                    : require("../../assets/images/react-logo.png")
                }
                style={prodStyles.productImage}
              />
            </View>
            <View style={prodStyles.rightContent}>
              {discount ? (
                <View style={prodStyles.discountTag}>
                  <Text style={prodStyles.discountText}>{discount} OFF</Text>
                </View>
              ) : null}
              <Text style={prodStyles.productName}>{name}</Text>
              <View style={prodStyles.metaRow}>
                <MaterialIcons name="storefront" size={16} color="#888" />
                <Text style={prodStyles.metaText}>{store}</Text>
                <Text style={prodStyles.metaSeparator}>•</Text>
                <MaterialIcons name="location-pin" size={16} color="#888" />
                <Text style={prodStyles.metaText}>
                  {distance ? `${distance} km` : ""}
                </Text>
              </View>
              <View style={prodStyles.statusRow}>
                <Text style={prodStyles.statusLabel}>Status:</Text>
                <Text style={prodStyles.statusValue}>In Stock</Text>
              </View>
              <TouchableOpacity
                style={[
                  prodStyles.descriptionButton,
                  !hasDescription && prodStyles.descriptionButtonDisabled
                ]}
                activeOpacity={0.85}
                onPress={() => setShowDescription(true)}
                disabled={!hasDescription}
              >
                <Text style={[
                  prodStyles.descriptionButtonTitle,
                  !hasDescription && prodStyles.descriptionButtonTitleDisabled
                ]}>
                  {hasDescription ? "View Description" : "No Description Available"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={prodStyles.priceContainer}>
          {computedDiscountedPrice !== undefined ? (
            <>
              <Text style={prodStyles.priceOld}>₱ {Number(price).toFixed(2)}</Text>
              <Text style={prodStyles.priceNew}>₱ {computedDiscountedPrice.toFixed(2)}</Text>
            </>
          ) : (
            <Text style={prodStyles.priceText}>₱ {Number(price).toFixed(2)}</Text>
          )}
        </View>
      </View>

      {/* Description Modal */}
      {showDescription && (
        <Modal
          visible={showDescription}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDescription(false)}
        >
          <View style={prodStyles.modalOverlay}>
            <View style={prodStyles.modalContent}>
              <View style={prodStyles.modalHeader}>
                <Text style={prodStyles.modalTitle}>Product Description</Text>
                <TouchableOpacity
                  onPress={() => setShowDescription(false)}
                  style={prodStyles.modalCloseButton}
                >
                  <Text style={prodStyles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={prodStyles.modalScrollView}>
                <Text style={prodStyles.modalDescription}>{description}</Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const prodStyles = StyleSheet.create({
  container: { marginTop: 20, marginBottom: 20, paddingHorizontal: 5 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    color: "#333",
  },
  statusHeaderRow: { flexDirection: "row", alignItems: "center", columnGap: 8 },
  statusHeaderLabel: { fontSize: 12, color: "#9CA3AF" },
  statusPill: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: { fontSize: 12, color: "#1B6F5D", fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 10,
    minHeight: 190,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    ...Platform.select({ android: { elevation: 3 }, ios: {} }),
  },
  cardRow: {
    flexDirection: "row",
  },
  leftContent: {
    flexBasis: "40%",
    maxWidth: "40%",
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: { width: "100%", height: 140, resizeMode: "contain" },
  rightContent: {
    flex: 1,
    paddingLeft: 10,
    paddingTop: 4,
    justifyContent: "flex-start",
  },
  discountTag: {
    backgroundColor: "#FFBE5D",
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    marginBottom: 6,
  },
  discountText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  metaText: { fontSize: 14, color: "#888", marginLeft: 4 },
  metaSeparator: { marginHorizontal: 8, fontSize: 14, color: "#888" },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  statusLabel: { fontSize: 14, color: "#888", marginRight: 5 },
  statusValue: { fontSize: 14, fontWeight: "600", color: "#1B6F5D" },
  buttonContainer: { marginTop: 8 },
  descriptionButton: {
    backgroundColor: "#1B6F5D",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    alignSelf: "stretch",
  },
  descriptionButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  descriptionButtonTitle: { fontSize: 16, fontWeight: "600", color: "#ffffff", textAlign: "center" },
  descriptionButtonTitleDisabled: { color: "#9CA3AF", textAlign: "center" },
  priceContainer: {
    marginTop: -40,
    marginLeft: 5,
    alignSelf: "flex-start",
    backgroundColor: "#E6F8EF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: { fontSize: 18, fontWeight: "900", color: "#1B6F5D" },
  priceOld: { fontSize: 16, color: "#9CA3AF", textDecorationLine: 'line-through', marginRight: 8 },
  priceNew: { fontSize: 18, fontWeight: '900', color: '#1B6F5D', marginLeft: 8 },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    width: "90%",
    maxHeight: "70%",
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1B6F5D",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 18,
    color: "#6B7280",
    fontWeight: "600",
  },
  modalScrollView: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
});

// Store Header (inline)
function StoreHeader({
  storeName,
  storeId,
  logoUrl,
  bannerUrl,
  onOpenStore,
}: {
  storeName: string;
  storeId?: number;
  logoUrl?: string;
  bannerUrl?: string;
  onOpenStore?: () => void;
}) {
  const params = useLocalSearchParams() as Record<string, string | undefined>;
  const productId = params.productId ? Number(params.productId) : undefined;
  const { helpers, action } = useBookmarks();
  const isSaved = helpers.isProductBookmarked(productId);
  const toggle = () => {
    if (productId == null) return;
    if (helpers.isProductBookmarked(productId))
      action.removeProductBookmark(productId);
    else action.addProductBookmark(productId);
  };
  const { state: { stores, selectedStore } } = useStore();
  const store = stores.find((s: any) => s.id === storeId) || (selectedStore && selectedStore.id === storeId ? selectedStore : undefined);
  const description = (store as any)?.description || "";
  return (
    <View style={hdrStyles.container}>
      {bannerUrl ? (
        <Image
          source={{ uri: bannerUrl }}
          style={hdrStyles.bannerImage}
        />
      ) : (
        <Image
          source={require("../../assets/images/partial-react-logo.png")}
          style={hdrStyles.bannerImage}
        />
      )}
      <View style={hdrStyles.storeInfoContainer}>
        <View style={hdrStyles.logoAndName}>
          <Image
            source={typeof logoUrl === 'string' && logoUrl.length > 0 ? { uri: logoUrl } : require("../../assets/images/partial-react-logo.png")}
            style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: '#fff', marginTop: 15 }}
          />
          <View style={hdrStyles.storeDetails}>
            <Text style={hdrStyles.storeName}>{storeName}</Text>
            {description ? (
              <Text style={hdrStyles.storeDescription} numberOfLines={2}>
                {description}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={hdrStyles.bookmarkIcon} />
      </View>
      <View style={hdrStyles.buttonRow}>
        <View style={hdrStyles.buttonContainer}>
          <TouchableOpacity
            style={hdrStyles.detailsButton}
            activeOpacity={0.85}
            onPress={onOpenStore}
          >
            <Text style={hdrStyles.detailsButtonTitle}>Store Details</Text>
          </TouchableOpacity>
        </View>
        <View style={hdrStyles.buttonContainer}>
          <TouchableOpacity
            style={hdrStyles.saveButton}
            activeOpacity={0.85}
            onPress={toggle}
          >
            <Text style={hdrStyles.saveButtonTitle}>
              {isSaved ? "Unsave Item" : "Save Item"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const hdrStyles = StyleSheet.create({
  container: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  bannerImage: {
    height: 200,
    marginLeft: -20,
    marginRight: -20,
    marginBottom: 0,
  },
  storeInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: -40,
    paddingHorizontal: 5,
  },
  logoAndName: { flexDirection: "row", alignItems: "center", flex: 1 },
  quickMartLogo: {
    backgroundColor: "#277874",
    paddingVertical: 22,
    paddingHorizontal: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 15,
  },
  logoText: {
    color: "#ffffff",
    marginLeft: 5,
    fontWeight: "bold",
    fontSize: 14,
    textTransform: "uppercase",
  },
  storeDetails: { marginLeft: 10, marginTop: 35 },
  storeName: { fontSize: 22, fontWeight: "700", color: "#333" },
  storeDescription: { fontSize: 14, color: "#888" },
  bookmarkIcon: { alignSelf: "flex-end", marginTop: 10 },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 5,
  },
  buttonContainer: { flex: 1, marginHorizontal: 5 },
  detailsButton: {
    backgroundColor: "#1B6F5D",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    minHeight: 44,
  },
  detailsButtonTitle: { fontSize: 16, fontWeight: "600", color: "#ffffff" },
  saveButton: {
    borderColor: "#1B6F5D",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    minHeight: 44,
  },
  saveButtonTitle: { color: "#1B6F5D", fontSize: 16, fontWeight: "600" },
});
