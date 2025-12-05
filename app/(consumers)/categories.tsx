import env from "@/config/env";
import { useCatalog } from "@/features/catalog";
import { useStore } from "@/features/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
    Image,
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

export default function CategoriesPage() {
  const [selectedCategory, setSelectedCategory] = React.useState("All Items");
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

  const getProductCategoryName = (product: any): string => {
    const directCategory =
      (product as any)?.category?.name ||
      (product as any)?.categoryName ||
      (product as any)?.category;
    if (directCategory) return String(directCategory);
    const categoryId =
      (product as any)?.category?.id || (product as any)?.categoryId;
    const match = (categories || []).find(
      (cat: any) => String(cat.id) === String(categoryId)
    );
    return match?.name ? String(match.name) : "";
  };

  const availableCategories = useMemo(() => {
    const productCategories = new Set<string>();
    (products || []).forEach((product: any) => {
      const categoryName = getProductCategoryName(product);
      if (categoryName) productCategories.add(categoryName);
    });

    const names: string[] = [];
    (categories || []).forEach((category: any) => {
      const name = String(category?.name || "");
      if (!name) return;
      if (productCategories.has(name) && !names.includes(name)) {
        names.push(name);
      }
    });
    return names;
  }, [categories, products]);

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
    .map((store: any) => {
      const storeProducts = (products || []).filter(
        (p: any) => p.storeId === store.id
      );
      const filteredProducts = storeProducts
        .filter((p: any) => {
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
        .map((p: any) => {
          const imageUrl = normalizeImageUrl(p.imageUrl);
          return {
            id: String(p.id),
            name: p.name,
            price: `₱${Number(p.price ?? 0).toFixed(2)}`,
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

        {filteredStores.map((store) => (
          <StoreSection
            key={store.id}
            storeName={store.storeName}
            distance={store.distance}
            isOpen={store.isOpen}
            products={store.products}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoriesHeader() {
  const router = useRouter();
  return (
    <View style={headerStyles.pageHeader}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={headerStyles.backBtn}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      <Text style={headerStyles.pageTitle}>Categories</Text>
      <View style={{ width: 24 }} />
    </View>
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={filterStyles.categoryScroll}
    >
      <View style={filterStyles.categoryContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              filterStyles.categoryBtn,
              selectedCategory === category && filterStyles.categoryBtnActive,
            ]}
            onPress={() => onCategorySelect(category)}
          >
            <Text
              style={[
                filterStyles.categoryText,
                selectedCategory === category &&
                  filterStyles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function SearchBar({
  value,
  onChangeText,
  placeholder = "Search products",
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={searchStyles.container}>
      <View style={searchStyles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#9CA3AF"
          style={searchStyles.searchIcon}
        />
        <TextInput
          style={searchStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
        />
      </View>
    </View>
  );
}

function StoreSection({
  storeName,
  distance,
  isOpen,
  products,
}: {
  storeName: string;
  distance: string;
  isOpen: boolean;
  products: any[];
}) {
  const router = useRouter();
  const {
    state: { stores },
  } = useStore();
  
  const storeInfo = stores.find((s: any) => s.name === storeName);
  const storeId = storeInfo?.id;

  return (
    <View style={sectionStyles.container}>
      <View style={sectionStyles.storeHeader}>
        <View style={sectionStyles.storeInfo}>
          <Text style={sectionStyles.storeName}>{storeName}</Text>
          <View style={sectionStyles.distanceRow}>
            <Ionicons name="location-outline" size={14} color="#9CA3AF" />
            <Text style={sectionStyles.distance}>{distance}</Text>
          </View>
        </View>
        <View
          style={[
            sectionStyles.statusPill,
            { backgroundColor: isOpen ? "#D1FAE5" : "#FEE2E2" },
          ]}
        >
          <Text
            style={[
              sectionStyles.statusText,
              { color: isOpen ? "#1B6F5D" : "#DC2626" },
            ]}
          >
            {isOpen ? "Open" : "Closed"}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={sectionStyles.productsScroll}
      >
        <View style={sectionStyles.productsContainer}>
          {products.map((product) => {
            const imageSource =
              typeof product.imageUrl === "string" && product.imageUrl.length > 0
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
                <Text style={sectionStyles.currentPrice}>{product.price}</Text>
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
  safeArea: { flex: 1, backgroundColor: "#fff" },
  mainContent: { flex: 1, backgroundColor: "#fff", paddingBottom: 60 },
});

const headerStyles = StyleSheet.create({
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#fff",
  },
  backBtn: { padding: 5 },
  pageTitle: { fontSize: 24, fontWeight: "bold", color: "#000" },
});

const filterStyles = StyleSheet.create({
  categoryScroll: { marginBottom: 20 },
  categoryContainer: { flexDirection: "row", paddingHorizontal: 20, gap: 10 },
  categoryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  categoryBtnActive: { backgroundColor: "#F9AD3F" },
  categoryText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  categoryTextActive: { color: "#000" },
});

const searchStyles = StyleSheet.create({
  container: { paddingHorizontal: 20, marginBottom: 20 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: "#000" },
});

const sectionStyles = StyleSheet.create({
  container: { marginBottom: 30 },
  storeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  storeInfo: { flex: 1 },
  storeName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  distanceRow: { flexDirection: "row", alignItems: "center" },
  distance: { fontSize: 14, color: "#9CA3AF", marginLeft: 4 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  statusText: { fontSize: 12, fontWeight: "600" },
  productsScroll: { paddingLeft: 20 },
  productsContainer: { flexDirection: "row", gap: 15 },
  productCard: {
    width: 120,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productImage: {
    width: "100%",
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
    marginBottom: 8,
    resizeMode: "contain",
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
  },
  priceContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  currentPrice: { fontSize: 16, fontWeight: "bold", color: "#000" },
  originalPrice: {
    fontSize: 14,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
});
