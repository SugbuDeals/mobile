import Card from "@/components/Card";
import { useLogin } from "@/features/auth";
import { useCatalog } from "@/features/catalog";
import type { Category, Product } from "@/features/catalog/types";
import { useStore } from "@/features/store";
import type { Promotion } from "@/features/store/types";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const STATIC_CATEGORIES: Category[] = [
  { id: 1001, name: "Groceries" },
  { id: 1002, name: "Electronics" },
  { id: 1003, name: "Fashion" },
  { id: 1004, name: "Home" },
  { id: 1005, name: "Furniture" },
  { id: 1006, name: "Decor" },
];

export default function Home() {
  const router = useRouter();
  const {
    state: { user },
  } = useLogin();
  const {
    state: { stores, loading, activePromotions },
    action: { findStores, findActivePromotions },
  } = useStore();
  const {
    state: { categories, products },
    action: { loadCategories, loadProducts },
  } = useCatalog();

  const [selectedPromotion, setSelectedPromotion] = useState<{
    promotion: Promotion;
    productPromotions: Array<{ product: Product; promotion: Promotion }>;
  } | null>(null);

  useEffect(() => {
    findStores();
    loadCategories();
    loadProducts();
    findActivePromotions(); // Get all active promotions (no storeId filter for consumers)
  }, [findStores, loadCategories, loadProducts, findActivePromotions]);

  const displayName =
    user?.name || (user as any)?.fullname || user?.email || "there";
  const displayCategories =
    categories?.length > 0 ? categories : STATIC_CATEGORIES;

  return (
    <>
      <ScrollView style={styles.container}>
        <Greeting name={displayName} />
        <Categories categories={displayCategories.slice(0, 4)} router={router} />
        <Recommendations 
          products={products || []}
          promotions={activePromotions || []}
      onPromotionPress={(promotion, productPromotions) => 
        setSelectedPromotion({ promotion, productPromotions })
      }
          router={router} 
        />
        <NearbyStores stores={stores || []} loading={loading} router={router} />
      </ScrollView>
      
      {/* Promotion Products Overlay */}
      {selectedPromotion && (
        <PromotionModal
          promotion={selectedPromotion.promotion}
          productPromotions={selectedPromotion.productPromotions}
          onClose={() => setSelectedPromotion(null)}
          router={router}
        />
      )}
    </>
  );
}

function Greeting({ name }: { name: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.greetingTitle}>Hello, {name}! 👋</Text>
      <Text style={styles.greetingSubtitle}>
        What would you like to shop today?
      </Text>
    </View>
  );
}

function Categories({ categories, router }: { categories: Category[]; router: any }) {
  return (
    <View style={styles.section}>
      <SectionHeader 
        title="Categories" 
        linkText="See All" 
        onPress={() => router.push("/(consumers)/categories")}
      />
      <View style={styles.grid}>
        {categories.map((cat) => (
          <View key={cat.id} style={styles.gridItem}>
            <TouchableOpacity activeOpacity={0.8}>
              <View style={styles.iconWrap}>
                <Image
                  source={require("../../assets/images/icon.png")}
                  style={styles.icon}
                />
              </View>
            </TouchableOpacity>
            <Text style={styles.caption} numberOfLines={1}>
              {cat.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PromotionModal({
  promotion,
  productPromotions,
  onClose,
  router,
}: {
  promotion: Promotion;
  productPromotions: Array<{ product: Product; promotion: Promotion }>;
  onClose: () => void;
  router: any;
}) {
  const handleProductPress = (item: { product: Product; promotion: Promotion }) => {
    router.push({
      pathname: "/(consumers)/product",
      params: {
        name: item.product.name,
        storeId: item.product.storeId,
        price: item.product.price,
        productId: item.product.id,
        promotionId: item.promotion.id,
      },
    });
    onClose();
  };

  const getDiscountedPrice = (originalPrice: number, promo: Promotion) => {
    if (promo.type === 'percentage') {
      return originalPrice * (1 - promo.discount / 100);
    } else {
      return Math.max(0, originalPrice - promo.discount);
    }
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderGradient}>
              <Text style={styles.modalHeaderTitle}>{promotion.title}</Text>
              <View style={styles.modalHeaderDiscountContainer}>
                <Text style={styles.modalHeaderDiscount}>
                  Special Prices
                </Text>
              </View>
              {promotion.description && (
                <Text style={styles.modalHeaderDescription}>{promotion.description}</Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalProducts}>
            {productPromotions.map(({ product, promotion: productPromo }) => {
              const discountedPrice = product.price ? getDiscountedPrice(product.price, productPromo) : null;
              return (
                <TouchableOpacity
                  key={product.id}
                  style={styles.modalProductCard}
                  onPress={() => handleProductPress({ product, promotion: productPromo })}
                  activeOpacity={0.8}
                >
                  <Image
                    source={require("../../assets/images/react-logo.png")}
                    style={styles.modalProductImage}
                  />
                  <View style={styles.modalProductInfo}>
                    <Text style={styles.modalProductName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <View style={styles.modalProductPriceRow}>
                      {discountedPrice && (
                        <>
                          <Text style={styles.modalProductOriginalPrice}>
                            ₱{Number(product.price).toFixed(2)}
                          </Text>
                          <Text style={styles.modalProductDiscountedPrice}>
                            ₱{discountedPrice.toFixed(2)}
                          </Text>
                          <Text style={styles.modalProductDiscount}>
                            {productPromo.type === 'percentage' 
                              ? `-${productPromo.discount}%`
                              : `-₱${productPromo.discount}`}
                          </Text>
                        </>
                      )}
                      {!discountedPrice && product.price && (
                        <Text style={styles.modalProductDiscountedPrice}>
                          ₱{Number(product.price).toFixed(2)}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Recommendations({
  products,
  promotions,
  onPromotionPress,
  router,
}: {
  products: Product[];
  promotions: Promotion[];
  onPromotionPress: (promotion: Promotion, productPromotions: Array<{ product: Product; promotion: Promotion }>) => void;
  router: any;
}) {
  const [activeTab, setActiveTab] = useState<"products" | "deals">("products");

  // Group promotions by title
  const groupedPromotions = useMemo(() => {
    const groups: { [key: string]: { 
      promotion: Promotion; 
      products: Array<{ product: Product; promotion: Promotion }> 
    } } = {};
    
    promotions.forEach(promotion => {
      const product = products.find(p => p.id === promotion.productId);
      const key = promotion.title;
      
      if (!groups[key]) {
        groups[key] = {
          promotion,
          products: product ? [{ product, promotion }] : [],
        };
      } else if (product) {
        groups[key].products.push({ product, promotion });
      }
    });
    
    return Object.values(groups);
  }, [promotions, products]);

  const handleProductPress = (p: Product) => {
    router.push({
      pathname: "/(consumers)/product",
      params: {
        name: p.name,
        storeId: p.storeId,
        price: p.price,
        productId: p.id,
      },
    });
  };

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Recommended for You"
        linkText="View All"
        onPress={() => router.push("/(consumers)/recommendations")}
      />
      
      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          onPress={() => setActiveTab("products")}
          style={[styles.tab, activeTab === "products" && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === "products" && styles.tabTextActive]}>
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("deals")}
          style={[styles.tab, activeTab === "deals" && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === "deals" && styles.tabTextActive]}>
            Deals
          </Text>
        </TouchableOpacity>
      </View>

      {/* Products Tab Content */}
      {activeTab === "products" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {products.map((p) => (
            <Card key={p.id} style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleProductPress(p)}
              >
                <View style={styles.imageWrap}>
                  <Image
                    source={require("../../assets/images/react-logo.png")}
                    style={styles.image}
                  />
                  <Text style={styles.badge}>New</Text>
                </View>
                <View>
                  <View style={styles.detailsContainer}>
                    <Text style={styles.title} numberOfLines={1}>
                      {p.name}
                    </Text>
                    {p.price != null && (
                      <Text style={styles.price}>
                        ₱{Number(p.price).toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* Deals Tab Content */}
      {activeTab === "deals" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promotionsRow}
        >
          {groupedPromotions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No deals available at the moment</Text>
            </View>
          ) : (
            groupedPromotions.map((group, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.85}
                onPress={() => onPromotionPress(group.promotion, group.products)}
              >
                <View style={styles.promotionCard}>
                  {/* Left side - Image */}
                  <View style={styles.promotionCardLeft}>
                    <Image
                      source={require("../../assets/images/react-logo.png")}
                      style={styles.promotionCardImage}
                    />
                  </View>
                  {/* Right side - Color with text */}
                  <View style={styles.promotionCardRight}>
                    <Text style={styles.promotionCardDiscount}>
                      {group.promotion.type === 'percentage' 
                        ? `${group.promotion.discount}% OFF`
                        : `₱${group.promotion.discount} OFF`}
                    </Text>
                    <Text style={styles.promotionCardTitle} numberOfLines={2}>
                      {group.promotion.title}
                    </Text>
                    {group.promotion.description && (
                      <Text style={styles.promotionCardDescription} numberOfLines={2}>
                        {group.promotion.description}
                      </Text>
                    )}
                  </View>
                  {/* Blending gradient in the center */}
                  <View style={styles.promotionCardBlend} pointerEvents="none">
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 1.0)', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.promotionCardBlendGradient}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function NearbyStores({
  stores,
  loading,
  router,
}: {
  stores: any[];
  loading: boolean;
  router: any;
}) {
  if (loading) return null;

  const handleStorePress = (store: any) => {
    router.push({
      pathname: "/(consumers)/storedetails",
      params: { store: store.name, storeId: store.id },
    });
  };

  return (
    <View style={styles.section}>
      <SectionHeader 
        title="Nearby Stores" 
        linkText="View Map" 
        onPress={() => router.push("/(consumers)/viewmap")}
      />
      {stores.map((s) => (
        <TouchableOpacity
          key={s.id ?? s.name}
          style={styles.nearbyCard}
          activeOpacity={0.8}
          onPress={() => handleStorePress(s)}
        >
          <Image
            source={require("../../assets/images/partial-react-logo.png")}
            style={styles.storeIcon}
          />
          <View style={styles.info}>
            <Text style={[styles.text, styles.bold]} numberOfLines={1}>
              {s.name}
            </Text>
            <Text style={styles.text}>{s.distance ?? "~1.2 km"}</Text>
            <Text style={styles.text}>{s.rating ?? "4.5 ★"}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SectionHeader({
  title,
  linkText,
  onPress,
}: {
  title: string;
  linkText: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.headerRow}>
      <Text style={styles.header}>{title}</Text>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.link}>{linkText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // General / Layout
  container: {
    paddingHorizontal: 15,
    backgroundColor: "#ffffff",
  },
  section: {
    marginVertical: 15,
  },

  // Greeting Component
  greetingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  greetingSubtitle: {
    fontSize: 16,
    color: "#6b7280",
  },

  // SectionHeader Component
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    fontSize: 15,
    fontWeight: "600",
  },
  link: {
    fontSize: 13,
    color: "#D97706",
  },

  // Categories Component
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gridItem: {
    alignItems: "center",
  },
  iconWrap: {
    width: 55,
    height: 55,
    borderRadius: "100%",
    backgroundColor: "#E5F3F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },
  caption: {
    fontSize: 12,
  },

  // Tab Selector Styles
  tabSelector: {
    flexDirection: "row",
    marginBottom: 12,
    marginTop: 6,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  tabActive: {
    backgroundColor: "#FFBE5D",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#ffffff",
  },

  // Recommendations Component
  row: {
    paddingVertical: 7,
    paddingHorizontal: 2,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  card: {
    width: 240,
    backgroundColor: "#FFFFFF",
    borderRadius: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  imageWrap: {
    position: "relative",
    width: "100%",
    height: 150,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#1B6F5D",
    color: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 30,
    overflow: "hidden",
  },
  detailsContainer: {
    padding: 10,
  },
  title: {
    paddingHorizontal: 10,
    marginTop: 6,
  },
  price: {
    paddingHorizontal: 10,
  },

  // NearbyStores Component
  nearbyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    height: 80,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 5,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 2,
    overflow: "hidden",
  },
  storeIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    padding: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 10,
    resizeMode: "contain",
  },
  info: {
    flex: 1,
  },
  text: {
    lineHeight: 18,
  },
  bold: {
    fontWeight: "bold",
  },

  // Deals Section Styles
  promotionsRow: {
    paddingVertical: 7,
    paddingHorizontal: 2,
  },
  promotionCard: {
    width: 280,
    height: 120,
    borderRadius: 12,
    marginHorizontal: 8,
    flexDirection: "row",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  promotionCardLeft: {
    width: "50%",
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  promotionCardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  promotionCardRight: {
    width: "50%",
    backgroundColor: "#FFBE5D",
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  promotionCardDiscount: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 4,
    textAlign: "center",
  },
  promotionCardTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    opacity: 0.95,
    marginTop: 4,
  },
  promotionCardDescription: {
    fontSize: 10,
    fontWeight: "400",
    color: "#ffffff",
    textAlign: "center",
    opacity: 0.85,
    marginTop: 4,
  },
  promotionCardBlend: {
    position: "absolute",
    left: "45%",
    width: "10%",
    height: "100%",
    zIndex: 2,
  },
  promotionCardBlendGradient: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    position: "relative",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  modalHeaderGradient: {
    backgroundColor: "#FFBE5D",
    paddingVertical: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modalHeaderTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 6,
  },
  modalHeaderDiscountContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 6,
  },
  modalHeaderDiscount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#277874",
  },
  modalHeaderDescription: {
    fontSize: 14,
    fontWeight: "400",
    color: "#ffffff",
    marginTop: 12,
    opacity: 0.95,
    lineHeight: 20,
  },
  modalCloseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modalCloseText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#277874",
  },
  modalProducts: {
    padding: 20,
    maxHeight: 500,
  },
  modalProductCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalProductImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  modalProductInfo: {
    flex: 1,
  },
  modalProductName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  modalProductPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalProductOriginalPrice: {
    fontSize: 13,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  modalProductDiscountedPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10B981",
  },
  modalProductDiscount: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFBE5D",
    backgroundColor: "rgba(255, 190, 93, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
