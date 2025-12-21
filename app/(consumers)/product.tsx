import DealBadge from "@/components/consumers/deals/DealBadge";
import env from "@/config/env";
import { useBookmarks } from "@/features/bookmarks";
import { useCatalog } from "@/features/catalog";
import type { Product } from "@/features/catalog/types";
import { useStore } from "@/features/store";
import type { Promotion } from "@/features/store/promotions/types";
import type { Store } from "@/features/store/stores/types";
import { promotionsApi } from "@/services/api/endpoints/promotions";
import { viewsApi } from "@/services/api/endpoints/views";
import type { VoucherTokenResponseDto } from "@/services/api/types/swagger";
import { getVouchersOnly } from "@/utils/dealPlacement";
import { formatDealDetails } from "@/utils/dealTypes";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import QRCode from "react-native-qrcode-svg";

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
  const { helpers: bookmarkHelpers, action: bookmarkActions } = useBookmarks();

  // Validate productId to ensure it's a valid number (not NaN, not null string, not empty)
  const productId = (() => {
    const raw = params.productId;
    if (!raw || raw === "null" || raw === "undefined" || raw === "") return undefined;
    const num = Number(raw);
    return Number.isFinite(num) && num > 0 ? num : undefined;
  })();

  // Get the actual product data if productId is available
  const actualProduct = useMemo(() => {
    if (productId && products) {
      return products.find((p: Product) => p.id === productId) || null;
    }
    return null;
  }, [productId, products]);

  // Ensure we fetch product details if missing or lacking storeId
  React.useEffect(() => {
    // Only call API if productId is a valid positive number
    if (
      productId &&
      Number.isFinite(productId) &&
      productId > 0 &&
      (!actualProduct || !actualProduct?.storeId)
    ) {
      findProductById(productId);
    }
  }, [productId, actualProduct, findProductById]);

  const productName =
    (params.name as string) || actualProduct?.name || "Product";
  const productStoreId = params.storeId
    ? Number(params.storeId)
    : actualProduct?.storeId;

  // Ensure we fetch store info if missing in list
  React.useEffect(() => {
    if (productStoreId) {
      findStoreById(productStoreId);
    }
  }, [productStoreId, findStoreById]);

  // Record view when product is viewed
  React.useEffect(() => {
    if (productId && Number.isFinite(productId) && productId > 0) {
      viewsApi.recordView({
        entityType: "PRODUCT",
        entityId: productId,
      }).catch((error) => {
        // Silently fail - view recording is not critical
        console.debug("Failed to record product view:", error);
      });
    }
  }, [productId]);
  const storeFromList = stores.find((s: Store) => s.id === productStoreId);
  const storeFromSelected =
    selectedStore && selectedStore.id === productStoreId
      ? selectedStore
      : undefined;
  const resolvedStore = storeFromSelected || storeFromList;
  const productStore =
    (params.store as string) || (resolvedStore?.name ?? "Store");
  const productPrice =
    typeof params.price === "number"
      ? (params.price as unknown as number)
      : Number(params.price || actualProduct?.price || 0);
  const productDistance =
    typeof params.distance === "number"
      ? (params.distance as unknown as number)
      : Number(params.distance || 0);
  const productDiscount = (params.discount as string) || "";
  const productImageUrl =
    (params.imageUrl as string) || actualProduct?.imageUrl || "";
  const productDescription = actualProduct?.description || "";

  const rawLogo = resolvedStore?.imageUrl ?? undefined;
  const logoUrl = (() => {
    if (!rawLogo) return undefined;
    if (/^https?:\/\//i.test(rawLogo)) return rawLogo;
    if (rawLogo.startsWith("/")) return `${env.API_BASE_URL}${rawLogo}`;
    return `${env.API_BASE_URL}/files/${rawLogo}`;
  })();
  // If this product exists but was disabled by administrators, hide details from consumers
  if (actualProduct && actualProduct.isActive === false) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View
          style={[
            styles.scrollViewContent,
            { alignItems: "center", justifyContent: "center" },
          ]}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#B91C1C",
              marginBottom: 8,
            }}
          >
            This product is not available
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", textAlign: "center" }}>
            This item has been disabled by the store administrators and is
            currently hidden from shoppers.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isSaved = bookmarkHelpers.isProductBookmarked(productId);

  const toggleBookmark = () => {
    if (productId == null) return;
    if (bookmarkHelpers.isProductBookmarked(productId)) {
      bookmarkActions.removeProductBookmark(productId);
    } else {
      bookmarkActions.addProductBookmark(productId);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.bookmarkButton}
          onPress={toggleBookmark}
        >
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={isSaved ? "#1B6F5D" : "#111827"} 
          />
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <ProductCard
          name={productName}
          store={productStore}
          price={productPrice}
          distance={productDistance}
          discount={productDiscount}
          imageUrl={productImageUrl}
          description={productDescription}
        />
        <SimpleStoreHeader
          storeName={productStore}
          storeId={productStoreId}
          logoUrl={logoUrl}
          onOpenStore={() =>
            router.push({
              pathname: "/(consumers)/storedetails",
              params: { store: productStore, storeId: productStoreId },
            })
          }
        />
        <SimpleLocationCard
          storeName={productStore}
          storeId={productStoreId}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  bookmarkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollViewContent: {
    paddingBottom: 24,
  },
});

// Simple Location Card
function SimpleLocationCard({
  storeName,
  storeId,
}: {
  storeName: string;
  storeId?: number;
}) {
  const {
    state: { stores, selectedStore },
  } = useStore();
  const store =
    stores.find((s: Store) => s.id === storeId) ||
    (selectedStore && selectedStore.id === storeId ? selectedStore : undefined);
  const latitude = store?.latitude ?? null;
  const longitude = store?.longitude ?? null;
  const address = store?.address || "";

  const openDirections = () => {
    if (typeof latitude === "number" && typeof longitude === "number") {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
      );
    } else if (address) {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          address
        )}`
      );
    }
  };

  if (!address) return null;

  return (
    <View style={locStyles.container}>
      <TouchableOpacity 
        style={locStyles.locationButton}
        onPress={openDirections}
        activeOpacity={0.7}
      >
        <View style={locStyles.iconContainer}>
          <Ionicons name="location" size={24} color="#1B6F5D" />
        </View>
        <View style={locStyles.locationInfo}>
          <Text style={locStyles.locationLabel}>Store Location</Text>
          <Text style={locStyles.addressText} numberOfLines={2}>
            {address}
          </Text>
        </View>
        <Ionicons name="navigate" size={20} color="#1B6F5D" />
      </TouchableOpacity>
    </View>
  );
}

const locStyles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#047857",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  addressText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
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
  const {
    state: { activePromotions },
  } = useStore();
  const router = useRouter();
  const params = useLocalSearchParams() as Record<string, string | undefined>;
  // Validate productId to ensure it's a valid number (not NaN, not null string, not empty)
  const productId = (() => {
    const raw = params.productId;
    if (!raw || raw === "null" || raw === "undefined" || raw === "") return undefined;
    const num = Number(raw);
    return Number.isFinite(num) && num > 0 ? num : undefined;
  })();
  const [showDescription, setShowDescription] = useState(false);
  const hasDescription = description && description.trim().length > 0;

  // Voucher state
  const [voucherToken, setVoucherToken] = useState<VoucherTokenResponseDto | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [isGeneratingVoucher, setIsGeneratingVoucher] = useState(false);
  const [hasClaimedVoucherFromStore, setHasClaimedVoucherFromStore] = useState<boolean | null>(null); // null = checking, false = not claimed, true = claimed
  const [isCheckingVoucherStatus, setIsCheckingVoucherStatus] = useState(false);

  const {
    state: { products: allProducts },
  } = useCatalog();

  // Get voucher promotions that include this product
  const productVoucherPromotions = useMemo(() => {
    if (!productId || !params.storeId) return [];
    const allVouchers = getVouchersOnly(activePromotions || []);
    
    // Filter vouchers that include this specific product
    return allVouchers.filter((voucher: Promotion) => {
      // Check if voucher has this product via promotionProducts
      if (voucher.promotionProducts && Array.isArray(voucher.promotionProducts) && voucher.promotionProducts.length > 0) {
        return voucher.promotionProducts.some((pp: any) => pp.productId === productId);
      }
      // Fallback to single productId
      return voucher.productId === productId;
    });
  }, [activePromotions, productId, params.storeId]);

  // Generate voucher function
  const handleGenerateVoucher = async (promotionId: number) => {
    if (!params.storeId || !productId) {
      Alert.alert("Error", "Store or product information is missing");
      return;
    }

    // Prevent generation if already claimed (double check before API call)
    if (hasClaimedVoucherFromStore === true) {
      // Button should be disabled, but if somehow called, just return silently
      return;
    }

    setIsGeneratingVoucher(true);
    
    try {
      const response = await promotionsApi.generateVoucherToken({
        promotionId,
        storeId: Number(params.storeId),
        productId: productId,
      });
      
      const actualData = (response as any)?.data || response;
      setVoucherToken(actualData);
      setShowVoucherModal(true);
      // Don't mark as claimed after generation - voucher is PENDING, not REDEEMED
      // Only REDEEMED vouchers count as "claimed"
      // The status check will update hasClaimedVoucherFromStore when appropriate
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Please try again later";
      
      // If error indicates already claimed/redeemed, update state (don't show alert as button should be disabled)
      const isAlreadyClaimedError = 
        errorMessage.toLowerCase().includes("already claimed") || 
        errorMessage.toLowerCase().includes("already redeemed") ||
        errorMessage.toLowerCase().includes("only claim one voucher");
      
      if (isAlreadyClaimedError) {
        setHasClaimedVoucherFromStore(true);
        // Don't show alert since button should already be disabled
        // This handles edge cases where status wasn't checked yet
        return;
      }
      
      // Only show alert for other errors (not already claimed errors)
      // Only log non-expected errors
      console.error("Error generating voucher:", error);
      Alert.alert(
        "Failed to Generate Voucher",
        errorMessage
      );
    } finally {
      setIsGeneratingVoucher(false);
    }
  };

  // Check voucher claim status when storeId is available
  useEffect(() => {
    const checkVoucherStatus = async () => {
      if (!params.storeId) {
        setHasClaimedVoucherFromStore(null);
        return;
      }

      const storeId = Number(params.storeId);
      if (!Number.isFinite(storeId) || storeId <= 0) {
        setHasClaimedVoucherFromStore(null);
        return;
      }

      // Only check if there are voucher promotions available
      if (productVoucherPromotions.length === 0) {
        setHasClaimedVoucherFromStore(null);
        return;
      }

      setIsCheckingVoucherStatus(true);
      try {
        const status = await promotionsApi.checkVoucherClaimStatus(storeId);
        setHasClaimedVoucherFromStore(status.hasClaimed);
      } catch (error: any) {
        // If endpoint doesn't exist (404) or other error, default to allowing voucher generation
        // This provides graceful degradation if backend hasn't implemented the endpoint yet
        // 404 is expected until backend implements the endpoint - the API client now logs it as warning
        // Default to false (not claimed) so user can still try to generate
        // The generate endpoint will return proper error if they've actually claimed
        setHasClaimedVoucherFromStore(false);
      } finally {
        setIsCheckingVoucherStatus(false);
      }
    };

    checkVoucherStatus();
  }, [params.storeId, productVoucherPromotions.length]);

  // Log QR code generation (no longer needed for image display, but useful for debugging)
  useEffect(() => {
    if (voucherToken?.token) {
      const tokenValue = String(voucherToken.token);
      console.log('=== QR CODE GENERATION ===');
      console.log('QR Code Token Value:', tokenValue);
      console.log('QR Code Token Length:', tokenValue.length);
      console.log('QR Code Token Preview:', tokenValue.substring(0, 50) + '...');
    }
  }, [voucherToken?.token]);

  const handleBundleProductPress = (product: Product) => {
    if (product.id === productId) return; // Don't navigate to current product
    
    router.push({
      pathname: "/(consumers)/product",
      params: {
        name: product.name,
        storeId: product.storeId,
        price: product.price,
        description: product.description,
        productId: product.id,
        imageUrl: product.imageUrl || "",
        promotionId: activePromotion?.id || "",
      },
    });
  };

  const activePromotion = React.useMemo(() => {
    if (!productId) return undefined;
    
    // For bundle deals, first check if this product is part of any bundle's promotionProducts
    // This ensures bundle section stays visible when navigating between bundle items
    const bundleMatch = (activePromotions || []).find((p: Promotion) => {
      if (!p.active || p.dealType !== 'BUNDLE') return false;
      
      // Check if this product is in the bundle's promotionProducts array
      const promotionProducts = p.promotionProducts || [];
      return promotionProducts.some((pp: any) => pp.productId === productId);
    });
    
    if (bundleMatch) return bundleMatch;
    
    // Then, try to find a direct promotion match for non-bundle deals
    const directMatch = (activePromotions || []).find(
      (p: Promotion) => p.productId === productId && p.active === true
    );
    
    return directMatch;
  }, [activePromotions, productId]);

  // Get all products in the bundle if this is a bundle deal
  const bundleProducts = React.useMemo(() => {
    if (!activePromotion || activePromotion.dealType !== 'BUNDLE') return [];
    
    // Get product IDs from promotionProducts array
    const productIds = (activePromotion.promotionProducts || [])
      .map((pp: any) => pp.productId)
      .filter((id: number) => id != null);
    
    // Find all products in the bundle
    return productIds
      .map((id: number) => allProducts?.find((p: Product) => p.id === id))
      .filter((p: Product | undefined): p is Product => p != null);
  }, [activePromotion, allProducts]);

  // Calculate bundle savings
  const bundleSavings = React.useMemo(() => {
    if (!activePromotion || activePromotion.dealType !== 'BUNDLE' || !activePromotion.bundlePrice) {
      return undefined;
    }
    
    const totalOriginalPrice = bundleProducts.reduce((sum, p) => sum + Number(p.price || 0), 0);
    const bundlePrice = Number(activePromotion.bundlePrice);
    const savings = totalOriginalPrice - bundlePrice;
    
    return savings > 0 ? { totalOriginalPrice, bundlePrice, savings } : undefined;
  }, [activePromotion, bundleProducts]);

  const computedDiscountedPrice = React.useMemo(() => {
    if (!activePromotion) return undefined;
    
    const p = Number(price);
    if (!isFinite(p)) return undefined;
    
    let discounted: number | undefined;
    
    // Handle new dealType fields
    if (activePromotion.dealType === 'PERCENTAGE_DISCOUNT' && activePromotion.percentageOff != null) {
      const percentValue = Number(activePromotion.percentageOff);
      if (percentValue > 0) {
        discounted = Math.max(0, p * (1 - percentValue / 100));
      }
    } else if (activePromotion.dealType === 'FIXED_DISCOUNT' && activePromotion.fixedAmountOff != null) {
      const fixedValue = Number(activePromotion.fixedAmountOff);
      if (fixedValue > 0) {
        discounted = Math.max(0, p - fixedValue);
      }
    }
    // Fallback to legacy fields
    else if (activePromotion.type && activePromotion.discount != null) {
      const type = String(activePromotion.type).toLowerCase();
      const value = Number(activePromotion.discount);
      if (isFinite(value) && value > 0) {
        if (type === "percentage") {
          discounted = Math.max(0, p * (1 - value / 100));
        } else if (type === "fixed") {
          discounted = Math.max(0, p - value);
        }
      }
    }
    
    // Only return discounted price if it's actually different from base price
    if (discounted !== undefined && Math.abs(discounted - p) < 0.01) {
      return undefined;
    }
    
    return discounted;
  }, [activePromotion, price]);
  
  const discountDisplay = React.useMemo(() => {
    if (!activePromotion) return undefined;
    
    if (activePromotion.dealType === 'PERCENTAGE_DISCOUNT' && activePromotion.percentageOff != null) {
      return `${activePromotion.percentageOff}% OFF`;
    } else if (activePromotion.dealType === 'FIXED_DISCOUNT' && activePromotion.fixedAmountOff != null) {
      return `₱${Number(activePromotion.fixedAmountOff).toFixed(2)} OFF`;
    }
    // Fallback to legacy fields
    else if (activePromotion.discount != null) {
      if (activePromotion.type === 'percentage') {
        return `${activePromotion.discount}% OFF`;
      } else if (activePromotion.type === 'fixed') {
        return `₱${Number(activePromotion.discount).toFixed(2)} OFF`;
      }
    }
    
    return undefined;
  }, [activePromotion]);

  return (
    <>
      <View style={prodStyles.container}>
        {/* Product Image */}
        <View style={prodStyles.imageContainer}>
          <Image
            source={
              imageUrl
                ? { uri: imageUrl }
                : require("../../assets/images/react-logo.png")
            }
            style={prodStyles.productImage}
          />
          {activePromotion && activePromotion.dealType && (
            <View style={prodStyles.dealBadgeContainer}>
              <DealBadge dealType={activePromotion.dealType} size="small" />
            </View>
          )}
        </View>

        {/* Product Info Card */}
        <View style={prodStyles.infoCard}>
          <Text style={prodStyles.productName}>{name}</Text>
          
          <View style={prodStyles.priceContainer}>
            {computedDiscountedPrice !== undefined && computedDiscountedPrice < Number(price) ? (
              <>
                <Text style={prodStyles.priceNew}>
                  ₱{computedDiscountedPrice.toFixed(2)}
                </Text>
                <Text style={prodStyles.priceOld}>
                  ₱{Number(price).toFixed(2)}
                </Text>
                {discountDisplay && (
                  <View style={prodStyles.discountBadge}>
                    <Text style={prodStyles.discountText}>
                      {discountDisplay}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={prodStyles.priceNew}>
                ₱{Number(price).toFixed(2)}
              </Text>
            )}
          </View>

          {/* Active Deal Simplified - only show if has valid discount or special deal type */}
          {activePromotion && (computedDiscountedPrice !== undefined || ['BOGO', 'BUNDLE', 'VOUCHER', 'QUANTITY_DISCOUNT'].includes(activePromotion.dealType || '')) && (
            <View style={prodStyles.dealBanner}>
              <Ionicons name="flash" size={16} color="#F59E0B" />
              <Text style={prodStyles.dealBannerText}>
                {formatDealDetails(activePromotion)}
              </Text>
            </View>
          )}

          {/* Voucher Section - Show if there are any voucher promotions for this product */}
          {productVoucherPromotions.length > 0 && (
            <>
              {/* Show indicator if already claimed */}
              {hasClaimedVoucherFromStore === true && (
                <View style={prodStyles.voucherClaimedBanner}>
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                  <View style={prodStyles.voucherClaimedContent}>
                    <Text style={prodStyles.voucherClaimedTitle}>Voucher Already Claimed</Text>
                    <Text style={prodStyles.voucherClaimedMessage}>
                      You have already claimed a voucher from this store. Each consumer can only claim one voucher per store.
                    </Text>
                  </View>
                </View>
              )}

              {/* Always show button, but disable if already claimed */}
              <TouchableOpacity
                style={[
                  prodStyles.voucherButton,
                  (hasClaimedVoucherFromStore === true || isCheckingVoucherStatus || hasClaimedVoucherFromStore === null) && prodStyles.voucherButtonDisabled
                ]}
                onPress={() => {
                  // If multiple vouchers, use the first one; otherwise use the only one
                  const promotion = productVoucherPromotions[0];
                  handleGenerateVoucher(promotion.id);
                }}
                disabled={isGeneratingVoucher || isCheckingVoucherStatus || hasClaimedVoucherFromStore === true}
                activeOpacity={hasClaimedVoucherFromStore === true ? 1 : 0.7}
              >
                <Ionicons 
                  name="ticket" 
                  size={20} 
                  color={hasClaimedVoucherFromStore === true ? "#9CA3AF" : "#FFFFFF"} 
                />
                <Text style={[
                  prodStyles.voucherButtonText,
                  hasClaimedVoucherFromStore === true && prodStyles.voucherButtonTextDisabled
                ]}>
                  {hasClaimedVoucherFromStore === true
                    ? "Voucher Already Claimed"
                    : isCheckingVoucherStatus 
                    ? "Checking..." 
                    : isGeneratingVoucher 
                    ? "Generating..." 
                    : "Generate Voucher QR Code"}
                </Text>
                {(isGeneratingVoucher || isCheckingVoucherStatus) && (
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginLeft: 8 }} />
                )}
              </TouchableOpacity>
            </>
          )}

          <View style={prodStyles.statusBadge}>
            <View style={prodStyles.statusDot} />
            <Text style={prodStyles.statusText}>In Stock</Text>
          </View>

          {/* Description */}
          {hasDescription && (
            <View style={prodStyles.descriptionContainer}>
              <Text style={prodStyles.descriptionLabel}>Description</Text>
              <Text style={prodStyles.descriptionText} numberOfLines={3}>
                {description}
              </Text>
              <TouchableOpacity onPress={() => setShowDescription(true)}>
                <Text style={prodStyles.readMoreText}>Read more</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Bundle Products Section */}
      {activePromotion && activePromotion.dealType === 'BUNDLE' && bundleProducts.length > 0 && (
        <View style={prodStyles.bundleSection}>
          <View style={prodStyles.bundleHeader}>
            <Ionicons name="apps" size={20} color="#42A5F5" />
            <Text style={prodStyles.bundleSectionTitle}>Bundle Includes ({bundleProducts.length} items)</Text>
          </View>
          <View style={prodStyles.bundleCard}>
            {bundleProducts.map((product) => (
              <TouchableOpacity 
                key={product.id} 
                style={[
                  prodStyles.bundleItem,
                  product.id === productId && prodStyles.currentBundleItem
                ]}
                onPress={() => handleBundleProductPress(product)}
                activeOpacity={product.id === productId ? 1 : 0.7}
                disabled={product.id === productId}
              >
                <Image
                  source={
                    product.imageUrl
                      ? { uri: product.imageUrl }
                      : require("../../assets/images/react-logo.png")
                  }
                  style={prodStyles.bundleItemImage}
                />
                <View style={prodStyles.bundleItemInfo}>
                  <Text style={prodStyles.bundleItemName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={prodStyles.bundleItemPrice}>
                    ₱{Number(product.price).toFixed(2)}
                  </Text>
                </View>
                {product.id === productId && (
                  <View style={prodStyles.currentItemBadge}>
                    <Text style={prodStyles.currentItemText}>You&apos;re viewing</Text>
                  </View>
                )}
                {product.id !== productId && (
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            ))}
            
            {bundleSavings && (
              <View style={prodStyles.bundleSummary}>
                <View style={prodStyles.bundleSummaryRow}>
                  <Text style={prodStyles.bundleSummaryLabel}>Total if bought separately:</Text>
                  <Text style={prodStyles.bundleSummaryOriginalPrice}>
                    ₱{bundleSavings.totalOriginalPrice.toFixed(2)}
                  </Text>
                </View>
                <View style={prodStyles.bundleSummaryRow}>
                  <Text style={prodStyles.bundleSummaryLabel}>Bundle Price:</Text>
                  <Text style={prodStyles.bundleSummaryBundlePrice}>
                    ₱{bundleSavings.bundlePrice.toFixed(2)}
                  </Text>
                </View>
                <View style={prodStyles.bundleSavingsRow}>
                  <Ionicons name="pricetag" size={16} color="#10B981" />
                  <Text style={prodStyles.bundleSavingsText}>
                    You save ₱{bundleSavings.savings.toFixed(2)}!
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

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
                <Text style={prodStyles.modalTitle}>Description</Text>
                <TouchableOpacity
                  onPress={() => setShowDescription(false)}
                  style={prodStyles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <ScrollView style={prodStyles.modalScrollView}>
                <Text style={prodStyles.modalDescription}>{description}</Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Voucher QR Code Modal */}
      <Modal
        visible={showVoucherModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVoucherModal(false)}
      >
        <SafeAreaView style={prodStyles.modalOverlay}>
          <View style={prodStyles.voucherModalContent}>
            <View style={prodStyles.modalHeader}>
              <Text style={prodStyles.modalTitle}>Your Voucher</Text>
              <TouchableOpacity
                onPress={() => setShowVoucherModal(false)}
                style={prodStyles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {!voucherToken ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={{ marginTop: 16, fontSize: 14, color: '#111827', fontWeight: '600' }}>
                  Loading voucher...
                </Text>
              </View>
            ) : (
              <ScrollView 
                style={prodStyles.voucherModalScroll}
                contentContainerStyle={prodStyles.voucherModalScrollContent}
                showsVerticalScrollIndicator={true}
              >
                {/* Status Badge */}
                <View style={prodStyles.voucherStatusBadge}>
                  <View style={prodStyles.voucherStatusDot} />
                  <Text style={prodStyles.voucherStatusText}>
                    {voucherToken.status === 'PENDING' && 'Ready to Use'}
                    {voucherToken.status === 'VERIFIED' && 'Verified by Retailer'}
                    {voucherToken.status === 'REDEEMED' && 'Redeemed'}
                    {voucherToken.status === 'CANCELLED' && 'Cancelled'}
                  </Text>
                </View>

                {/* QR Code */}
                <View style={prodStyles.qrCodeContainer}>
                  {voucherToken?.token && typeof voucherToken.token === 'string' && voucherToken.token.length > 0 ? (
                    <>
                      {/* Display QR Code directly */}
                      <View style={prodStyles.qrCodeWrapper}>
                        <QRCode
                          value={String(voucherToken.token)}
                          size={240}
                          color="black"
                          backgroundColor="white"
                        />
                      </View>
                    </>
                  ) : (
                    <View style={{ width: 240, height: 240, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8 }}>
                      {(() => {
                        console.log('=== QR CODE GENERATION FAILED ===');
                        console.log('voucherToken:', voucherToken);
                        console.log('voucherToken?.token:', voucherToken?.token);
                        console.log('Token type:', typeof voucherToken?.token);
                        console.log('Token length:', voucherToken?.token?.length || 0);
                        console.log('Full voucherToken object:', JSON.stringify(voucherToken, null, 2));
                        return null;
                      })()}
                      <Ionicons name="alert-circle" size={48} color="#EF4444" />
                      <Text style={{ marginTop: 12, fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
                        Unable to generate QR code{'\n'}
                        Token is {!voucherToken?.token ? 'missing' : 'invalid'}
                      </Text>
                      <Text style={{ marginTop: 8, fontSize: 11, color: '#EF4444', textAlign: 'center' }}>
                        Type: {typeof voucherToken?.token}, Length: {voucherToken?.token?.length || 0}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Voucher Details */}
                <View style={prodStyles.voucherDetails}>
                  <View style={prodStyles.voucherDetailRow}>
                    <Ionicons name="person" size={18} color="#6B7280" />
                    <Text style={prodStyles.voucherDetailLabel}>Consumer:</Text>
                    <Text style={prodStyles.voucherDetailValue}>{voucherToken.userName}</Text>
                  </View>
                  
                  {activePromotion?.voucherValue && (
                    <View style={prodStyles.voucherDetailRow}>
                      <Ionicons name="cash" size={18} color="#6B7280" />
                      <Text style={prodStyles.voucherDetailLabel}>Value:</Text>
                      <Text style={prodStyles.voucherDetailValue}>
                        ₱{Number(activePromotion.voucherValue).toFixed(2)}
                      </Text>
                    </View>
                  )}

                  <View style={prodStyles.voucherDetailRow}>
                    <Ionicons name="storefront" size={18} color="#6B7280" />
                    <Text style={prodStyles.voucherDetailLabel}>Store:</Text>
                    <Text style={prodStyles.voucherDetailValue}>{store}</Text>
                  </View>

                  <View style={prodStyles.voucherDetailRow}>
                    <Ionicons name="cube" size={18} color="#6B7280" />
                    <Text style={prodStyles.voucherDetailLabel}>Product:</Text>
                    <Text style={prodStyles.voucherDetailValue}>{name}</Text>
                  </View>
                </View>

                {/* Instructions */}
                <View style={prodStyles.voucherInstructions}>
                  <Text style={prodStyles.instructionsTitle}>How to Use:</Text>
                  <View style={prodStyles.instructionStep}>
                    <Text style={prodStyles.stepNumber}>1</Text>
                    <Text style={prodStyles.stepText}>Show this QR code to the retailer</Text>
                  </View>
                  <View style={prodStyles.instructionStep}>
                    <Text style={prodStyles.stepNumber}>2</Text>
                    <Text style={prodStyles.stepText}>Wait for them to scan and verify</Text>
                  </View>
                  <View style={prodStyles.instructionStep}>
                    <Text style={prodStyles.stepNumber}>3</Text>
                    <Text style={prodStyles.stepText}>Retailer confirms redemption</Text>
                  </View>
                  <View style={prodStyles.instructionStep}>
                    <Text style={prodStyles.stepNumber}>4</Text>
                    <Text style={prodStyles.stepText}>Enjoy your voucher discount!</Text>
                  </View>
                </View>

                {voucherToken.status === 'REDEEMED' && (
                  <View style={prodStyles.redeemedBanner}>
                    <Ionicons name="checkmark-circle" size={24} color="#059669" />
                    <Text style={prodStyles.redeemedText}>This voucher has been redeemed</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}


const prodStyles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#F3F4F6",
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dealBadgeContainer: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  infoCard: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  priceNew: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1B6F5D",
  },
  priceOld: {
    fontSize: 18,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "600",
  },
  dealBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  dealBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#10B981",
  },
  descriptionContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 16,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 8,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1B6F5D",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 24,
  },
  // Bundle section styles
  bundleSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  bundleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  bundleSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  bundleCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bundleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    position: "relative",
  },
  currentBundleItem: {
    backgroundColor: "#EFF6FF",
    borderWidth: 2,
    borderColor: "#BFDBFE",
  },
  bundleItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#F3F4F6",
  },
  bundleItemInfo: {
    flex: 1,
  },
  bundleItemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  bundleItemPrice: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  currentItemBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    position: "absolute",
    top: 8,
    right: 8,
  },
  currentItemText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1E40AF",
    textTransform: "uppercase",
  },
  bundleSummary: {
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  bundleSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  bundleSummaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  bundleSummaryOriginalPrice: {
    fontSize: 14,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  bundleSummaryBundlePrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#42A5F5",
  },
  bundleSavingsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  bundleSavingsText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#047857",
  },
  // Voucher dropdown styles
  voucherDropdownContainer: {
    marginBottom: 12,
  },
  voucherButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B5CF6",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 5,
    gap: 10,
  },
  voucherButtonDisabled: {
    opacity: 0.6,
    backgroundColor: "#E5E7EB",
  },
  voucherButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  voucherButtonTextDisabled: {
    color: "#9CA3AF",
  },
  voucherClaimedContent: {
    flex: 1,
  },
  voucherClaimedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#047857",
    marginBottom: 4,
  },
  voucherClaimedMessage: {
    fontSize: 14,
    color: "#065F46",
    lineHeight: 20,
  },
  voucherClaimedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#D1FAE5",
    borderWidth: 1,
    borderColor: "#10B981",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  voucherClaimedContent: {
    flex: 1,
  },
  voucherClaimedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#047857",
    marginBottom: 4,
  },
  voucherClaimedMessage: {
    fontSize: 14,
    color: "#065F46",
    lineHeight: 20,
  },
  voucherDropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  voucherDropdownButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  voucherDropdownButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  voucherDropdownList: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  voucherKindWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  voucherKindWrapperLast: {
    borderBottomWidth: 0,
  },
  voucherKindDropdown: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderLeftWidth: 3,
    borderLeftColor: "#8B5CF6",
  },
  voucherKindHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  voucherKindInfo: {
    flex: 1,
    marginRight: 12,
  },
  voucherKindTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  voucherKindMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  voucherKindValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8B5CF6",
  },
  voucherKindRemaining: {
    fontSize: 12,
    color: "#6B7280",
  },
  voucherProductsList: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: "#E5E7EB",
  },
  voucherProductItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  voucherProductItemLast: {
    borderBottomWidth: 0,
  },
  voucherProductInfo: {
    flex: 1,
    marginRight: 12,
  },
  voucherProductName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 4,
  },
  voucherProductPrice: {
    fontSize: 13,
    color: "#6B7280",
  },
  // Voucher modal styles
  voucherModalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    minHeight: "70%",
    flex: 1,
  },
  voucherModalScroll: {
    flex: 1,
  },
  voucherModalScrollContent: {
    padding: 20,
    paddingBottom: 40,
    alignItems: "center",
    flexGrow: 1,
  },
  voucherStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    gap: 8,
  },
  voucherStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },
  voucherStatusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E40AF",
  },
  qrCodeContainer: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: 288, // 240 (QR size) + 24*2 (padding)
    minHeight: 288, // 240 (QR size) + 24*2 (padding)
  },
  qrCodeWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 240,
    height: 240,
  },
  qrCodeImage: {
    width: 240,
    height: 240,
  },
  qrCodeLoadingContainer: {
    width: 240,
    height: 240,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  qrCodeLoadingText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  voucherDetails: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  voucherDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voucherDetailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    minWidth: 80,
  },
  voucherDetailValue: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  voucherInstructions: {
    width: "100%",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 12,
  },
  instructionStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    backgroundColor: "#F59E0B",
    color: "#fff",
    borderRadius: 12,
    textAlign: "center",
    lineHeight: 24,
    fontSize: 14,
    fontWeight: "700",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: "#92400E",
    lineHeight: 20,
  },
  redeemedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    width: "100%",
  },
  redeemedText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#047857",
  },
});

// Simple Store Header
function SimpleStoreHeader({
  storeName,
  storeId,
  logoUrl,
  onOpenStore,
}: {
  storeName: string;
  storeId?: number;
  logoUrl?: string;
  onOpenStore?: () => void;
}) {
  return (
    <View style={hdrStyles.container}>
      <Text style={hdrStyles.sectionTitle}>Store</Text>
      <TouchableOpacity 
        style={hdrStyles.storeInfo}
        onPress={onOpenStore}
        activeOpacity={0.7}
      >
        <Image
          source={
            typeof logoUrl === "string" && logoUrl.length > 0
              ? { uri: logoUrl }
              : require("../../assets/images/partial-react-logo.png")
          }
          style={hdrStyles.storeLogo}
        />
        <Text style={hdrStyles.storeName}>{storeName}</Text>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}

const hdrStyles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  storeInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  storeLogo: {
    width: 48,
    height: 48,
    borderRadius: 10,
    resizeMode: "cover",
    backgroundColor: "#E5E7EB",
  },
  storeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
});
