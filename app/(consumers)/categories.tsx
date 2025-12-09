import env from "@/config/env";
import { useCatalog } from "@/features/catalog";
import type { Category, Product as CatalogProduct } from "@/features/catalog/types";
import { useStore } from "@/features/store";
import type { Product as StoreProduct } from "@/features/store/types";
import type { Store } from "@/features/store/stores/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const fallbackProductImage = require("../../assets/images/partial-react-logo.png");

const normalizeImageUrl = (rawUrl?: string) => {
  if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    return undefined;
  }
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  if (rawUrl.startsWith("/")) return `${env.API_BASE_URL}${rawUrl}`;
  return `${env.API_BASE_URL}/files/${rawUrl}`;
};

// Map category names to icons (same as homepage)
const getCategoryIcon = (categoryName: string): keyof typeof Ionicons.glyphMap => {
  const name = categoryName.toLowerCase().trim();
  
  // Food & Groceries
  if (name.includes("grocery") || name.includes("food") || name.includes("grocery")) {
    return "storefront";
  }
  if (name.includes("restaurant") || name.includes("dining") || name.includes("meal")) {
    return "restaurant";
  }
  if (name.includes("beverage") || name.includes("drink")) {
    return "wine";
  }
  
  // Electronics
  if (name.includes("electronic") || name.includes("tech") || name.includes("device")) {
    return "phone-portrait";
  }
  if (name.includes("computer") || name.includes("laptop")) {
    return "laptop";
  }
  if (name.includes("phone") || name.includes("mobile")) {
    return "phone-portrait";
  }
  if (name.includes("tv") || name.includes("television")) {
    return "tv";
  }
  
  // Fashion & Clothing
  if (name.includes("fashion") || name.includes("clothing") || name.includes("apparel")) {
    return "shirt";
  }
  if (name.includes("shoe") || name.includes("footwear")) {
    return "footsteps";
  }
  if (name.includes("accessory") || name.includes("jewelry")) {
    return "diamond";
  }
  
  // Home & Furniture
  if (name.includes("home") || name.includes("house")) {
    return "home";
  }
  if (name.includes("furniture") || name.includes("sofa") || name.includes("chair")) {
    return "cube";
  }
  if (name.includes("decor") || name.includes("decoration") || name.includes("ornament")) {
    return "color-palette";
  }
  if (name.includes("kitchen") || name.includes("cookware")) {
    return "restaurant";
  }
  if (name.includes("bedroom") || name.includes("bed")) {
    return "bed";
  }
  if (name.includes("bathroom") || name.includes("bath")) {
    return "water";
  }
  
  // Health & Beauty
  if (name.includes("health") || name.includes("medical") || name.includes("pharmacy")) {
    return "medical";
  }
  if (name.includes("beauty") || name.includes("cosmetic") || name.includes("makeup")) {
    return "sparkles";
  }
  
  // Sports & Outdoors
  if (name.includes("sport") || name.includes("fitness") || name.includes("gym")) {
    return "barbell";
  }
  if (name.includes("outdoor") || name.includes("camping")) {
    return "trail-sign";
  }
  
  // Books & Education
  if (name.includes("book") || name.includes("education") || name.includes("stationery")) {
    return "library";
  }
  
  // Toys & Games
  if (name.includes("toy") || name.includes("game")) {
    return "game-controller";
  }
  
  // Automotive
  if (name.includes("auto") || name.includes("car") || name.includes("vehicle")) {
    return "car";
  }
  
  // Pets
  if (name.includes("pet") || name.includes("animal")) {
    return "paw";
  }
  
  // Garden
  if (name.includes("garden") || name.includes("plant") || name.includes("flower")) {
    return "leaf";
  }
  
  // Tools
  if (name.includes("tool") || name.includes("hardware")) {
    return "construct";
  }
  
  // Default icon
  return "grid";
};

export default function CategoriesPage() {
  const params = useLocalSearchParams() as Record<string, string | undefined>;
  const initialCategory = params.category || "All Items";
  const [selectedCategory, setSelectedCategory] = React.useState(initialCategory);
  const [searchQuery, setSearchQuery] = React.useState("");

  const {
    state: { categories, products },
    action: { loadCategories, loadProducts },
  } = useCatalog();
  const {
    state: { stores },
    action: { findStores },
  } = useStore();

  useEffect(() => {
    if (!categories || categories.length === 0) loadCategories();
    if (!products || products.length === 0) loadProducts();
    if (!stores || stores.length === 0) findStores();
  }, [categories, products, stores, loadCategories, loadProducts, findStores]);

  // Update selected category when route params change or when categories are loaded
  useEffect(() => {
    if (params.category && availableCategories.length > 0) {
      // Try to find exact match first (case-insensitive)
      const exactMatch = availableCategories.find(
        (cat) => cat.toLowerCase() === params.category?.toLowerCase()
      );
      if (exactMatch) {
        setSelectedCategory(exactMatch);
        return;
      }
      // If no exact match, try to find a category that contains the param
      const partialMatch = availableCategories.find(
        (cat) => cat.toLowerCase().includes(params.category?.toLowerCase() || "")
      );
      if (partialMatch) {
        setSelectedCategory(partialMatch);
        return;
      }
      // If no match found, it will default to "All Items" via the existing useEffect below
    }
  }, [params.category, availableCategories]);

  const getProductCategoryName = useCallback(
    (product: CatalogProduct | StoreProduct): string => {
      const categoryId = 'categoryId' in product ? product.categoryId : undefined;
      if (!categoryId) return "";
      const match = (categories || []).find(
        (cat: Category) => String(cat.id) === String(categoryId)
      );
      return match?.name ? String(match.name) : "";
    },
    [categories]
  );

  const availableCategories = useMemo(() => {
    // Only consider products from verified stores
    const verifiedProductCategories = new Set<string>();
    (products || []).forEach((product: CatalogProduct | StoreProduct) => {
      // Check if product is from a verified store
      const productStore = (stores || []).find((s: Store) => s.id === product.storeId);
      if (productStore?.verificationStatus !== "VERIFIED") {
        return; // Skip products from unverified stores
      }
      
      const categoryName = getProductCategoryName(product);
      if (categoryName) verifiedProductCategories.add(categoryName);
    });

    const names: string[] = [];
    (categories || []).forEach((category: Category) => {
      const name = String(category?.name || "");
      if (!name) return;
      if (verifiedProductCategories.has(name) && !names.includes(name)) {
        names.push(name);
      }
    });
    return names;
  }, [categories, getProductCategoryName, products, stores]);

  const categoryNames = useMemo(
    () => ["All Items", ...availableCategories],
    [availableCategories]
  );

  useEffect(() => {
    if (
      selectedCategory !== "All Items" &&
      !availableCategories.includes(selectedCategory)
    ) {
      setSelectedCategory("All Items");
    }
  }, [availableCategories, selectedCategory]);

  const filteredStores = (stores || [])
    .map((store: Store) => {
      // Only show products from verified stores
      if (store.verificationStatus !== "VERIFIED") {
        return {
          id: String(store.id),
          storeName: store.name,
          distance: "~1.0 km",
          isOpen: true,
          products: [],
        };
      }
      
      const storeProducts = (products || []).filter(
        (p: CatalogProduct | StoreProduct) => p.storeId === store.id
      );
      const filteredProducts = storeProducts
        .filter((p: CatalogProduct | StoreProduct) => {
          const matchesQuery =
            searchQuery.trim().length === 0 ||
            String(p.name)
              .toLowerCase()
              .includes(searchQuery.trim().toLowerCase());
          const productCategoryName = getProductCategoryName(p);
          const matchesCategory =
            selectedCategory === "All Items" ||
            productCategoryName === selectedCategory;
          return matchesQuery && matchesCategory;
        })
        .map((p: CatalogProduct | StoreProduct) => {
          const imageUrl = normalizeImageUrl(p.imageUrl ?? undefined);
          const priceValue = typeof p.price === 'string' ? parseFloat(p.price) : (typeof p.price === 'number' ? p.price : 0);
          return {
            id: String(p.id),
            name: p.name,
            price: `₱${priceValue.toFixed(2)}`,
            originalPrice: undefined,
            imageUrl,
            description: p.description ?? "",
          };
        });
      return {
        id: String(store.id),
        storeName: store.name,
        distance: "~1.0 km",
        isOpen: true,
        products: filteredProducts,
      };
    })
    .filter((s) => s.products.length > 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <CategoriesHeader />

      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        <CategoryFilter
          categories={categoryNames}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search products"
        />

        {filteredStores.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery.trim() ? "No products found" : "No products available"}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery.trim() 
                ? "Try adjusting your search or select a different category"
                : "Check back later for new products"}
            </Text>
          </View>
        ) : (
          filteredStores.map((store) => (
            <StoreSection
              key={store.id}
              storeName={store.storeName}
              distance={store.distance}
              isOpen={store.isOpen}
              products={store.products}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoriesHeader() {
  const router = useRouter();
  return (
    <LinearGradient
      colors={["#FFBE5D", "#277874"]}
      style={headerStyles.pageHeader}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={headerStyles.backBtn}
      >
        <Ionicons name="arrow-back" size={24} color="#ffffff" />
      </TouchableOpacity>
      <View style={headerStyles.titleContainer}>
        <Ionicons name="grid" size={24} color="#ffffff" />
        <Text style={headerStyles.pageTitle}>Categories</Text>
      </View>
      <View style={{ width: 40 }} />
    </LinearGradient>
  );
}

function CategoryFilter({
  categories,
  selectedCategory,
  onCategorySelect,
}: {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (c: string) => void;
}) {
  return (
    <View style={filterStyles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={filterStyles.categoryScroll}
      >
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          const iconName = category === "All Items" ? "apps" : getCategoryIcon(category);
          
          return (
            <TouchableOpacity
              key={category}
              style={[
                filterStyles.categoryBtn,
                isActive && filterStyles.categoryBtnActive,
              ]}
              onPress={() => onCategorySelect(category)}
              activeOpacity={0.7}
            >
              <View style={[
                filterStyles.iconContainer,
                isActive && filterStyles.iconContainerActive
              ]}>
                <Ionicons 
                  name={iconName} 
                  size={18} 
                  color={isActive ? "#ffffff" : "#277874"} 
                />
              </View>
              <Text
                style={[
                  filterStyles.categoryText,
                  isActive && filterStyles.categoryTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function SearchBar({
  value,
  onChangeText,
  placeholder = "Search products...",
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={searchStyles.container}>
      <View style={searchStyles.searchContainer}>
        <View style={searchStyles.searchIconContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#6b7280"
          />
        </View>
        <TextInput
          style={searchStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeText("")}
            style={searchStyles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

type ProductDisplayItem = {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  imageUrl?: string;
  description: string;
};

function StoreSection({
  storeName,
  distance,
  isOpen,
  products,
}: {
  storeName: string;
  distance: string;
  isOpen: boolean;
  products: ProductDisplayItem[];
}) {
  const router = useRouter();
  const {
    state: { stores },
  } = useStore();

  const storeInfo = stores.find((s: Store) => s.name === storeName);
  const storeId = storeInfo?.id;

  return (
    <View style={sectionStyles.container}>
      <TouchableOpacity
        style={sectionStyles.storeHeader}
        onPress={() => {
          if (storeId) {
            router.push({
              pathname: "/(consumers)/storedetails",
              params: {
                store: storeName,
                storeId: storeId,
              },
            });
          }
        }}
        activeOpacity={0.7}
      >
        <View style={sectionStyles.storeInfo}>
          <View style={sectionStyles.storeNameRow}>
            <Ionicons name="storefront" size={18} color="#277874" />
            <Text style={sectionStyles.storeName}>{storeName}</Text>
          </View>
          <View style={sectionStyles.distanceRow}>
            <Ionicons name="location" size={12} color="#9CA3AF" />
            <Text style={sectionStyles.distance}>{distance}</Text>
          </View>
        </View>
        <View style={sectionStyles.headerRight}>
          <View
            style={[
              sectionStyles.statusPill,
              { backgroundColor: isOpen ? "#D1FAE5" : "#FEE2E2" },
            ]}
          >
            <View style={[
              sectionStyles.statusDot,
              { backgroundColor: isOpen ? "#10B981" : "#EF4444" }
            ]} />
            <Text
              style={[
                sectionStyles.statusText,
                { color: isOpen ? "#1B6F5D" : "#DC2626" },
              ]}
            >
              {isOpen ? "Open" : "Closed"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={sectionStyles.productsScroll}
      >
        <View style={sectionStyles.productsContainer}>
          {products.map((product) => {
            const imageSource =
              typeof product.imageUrl === "string" &&
              product.imageUrl.length > 0
                ? { uri: product.imageUrl }
                : fallbackProductImage;
            return (
              <TouchableOpacity
                key={product.id}
                style={sectionStyles.productCard}
                onPress={() =>
                  router.push({
                    pathname: "/(consumers)/product",
                    params: {
                      name: product.name,
                      store: storeName,
                      storeId: storeId,
                      price: product.price?.replace("₱", ""),
                      description: product.description,
                      productId: product.id,
                      imageUrl: product.imageUrl,
                    },
                  })
                }
              >
                <Image
                  source={imageSource}
                  style={sectionStyles.productImage}
                />
                <Text style={sectionStyles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                <View style={sectionStyles.priceContainer}>
                  <Text style={sectionStyles.currentPrice}>
                    {product.price}
                  </Text>
                  {product.originalPrice && (
                    <Text style={sectionStyles.originalPrice}>
                      {product.originalPrice}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },
  mainContent: { 
    flex: 1, 
    backgroundColor: "#f9fafb", 
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
  },
});

const headerStyles = StyleSheet.create({
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight || 20,
    paddingBottom: 20,
    paddingVertical: 20,
  },
  backBtn: { 
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pageTitle: { 
    fontSize: 22, 
    fontWeight: "700", 
    color: "#ffffff" 
  },
});

const filterStyles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  categoryScroll: { 
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  categoryBtnActive: { 
    backgroundColor: "#277874",
    borderColor: "#277874",
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainerActive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  categoryText: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#6B7280" 
  },
  categoryTextActive: { 
    color: "#ffffff" 
  },
});

const searchStyles = StyleSheet.create({
  container: { 
    paddingHorizontal: 20, 
    marginBottom: 20,
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIconContainer: {
    marginRight: 10,
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: "#1f2937",
    fontWeight: "500",
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
});

const sectionStyles = StyleSheet.create({
  container: { 
    marginBottom: 32,
    backgroundColor: "#f9fafb",
    paddingTop: 20,
    paddingBottom: 16,
  },
  storeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  storeInfo: { 
    flex: 1,
    marginRight: 12,
  },
  storeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  storeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  distanceRow: { 
    flexDirection: "row", 
    alignItems: "center",
    gap: 4,
  },
  distance: { 
    fontSize: 13, 
    color: "#6b7280",
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusPill: { 
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: { 
    fontSize: 12, 
    fontWeight: "600" 
  },
  productsScroll: { 
    paddingLeft: 20,
    paddingRight: 20,
  },
  productsContainer: { 
    flexDirection: "row", 
    gap: 12,
  },
  productCard: {
    width: 140,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  productImage: {
    width: "100%",
    height: 100,
    backgroundColor: "#F8F9FA",
    resizeMode: "cover",
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingTop: 8,
    lineHeight: 18,
  },
  priceContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  currentPrice: { 
    fontSize: 15, 
    fontWeight: "700", 
    color: "#277874" 
  },
  originalPrice: {
    fontSize: 12,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
});
