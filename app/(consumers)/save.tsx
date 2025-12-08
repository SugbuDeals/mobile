import { SearchBar } from "@/components/SearchBar";
import { TabSelector } from "@/components/TabSelector";
import env from "@/config/env";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useBookmarks } from "@/features/bookmarks";
import { useCatalog } from "@/features/catalog";
import type { Product as CatalogProduct, Category } from "@/features/catalog/types";
import { useStore } from "@/features/store";
import type { Promotion } from "@/features/store/promotions/types";
import type { Store } from "@/features/store/stores/types";
import type { Product as StoreProduct } from "@/features/store/types";

type SavedItem = {
  id: string;
  name: string;
  category: string;
  type: "product" | "store";
  image?: string;
  price?: number;
  storeName?: string;
  description?: string;
};

export default function Save() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filteredItems, setFilteredItems] = useState<SavedItem[]>([]);
  const { action: bookmarkAction, state: bookmarkState } = useBookmarks();
  const { state: catalogState, action: catalogAction } = useCatalog();
  const { state: storeState, action: storeAction } = useStore();

  useEffect(() => {
    bookmarkAction.loadProductBookmarks();
    bookmarkAction.loadStoreBookmarks();
    if (!catalogState.products?.length) {
      catalogAction.loadProducts();
    }
    if (!catalogState.categories?.length) {
      catalogAction.loadCategories();
    }
    if (!storeState.stores?.length) {
      storeAction.findStores();
    }
    storeAction.findActivePromotions();
  }, [bookmarkAction, catalogAction, catalogState.categories?.length, catalogState.products?.length, storeAction, storeState.stores?.length]);

  // Helper function to get product category name
  const getProductCategoryName = useCallback((product: CatalogProduct | StoreProduct): string => {
      const categoryId = 'categoryId' in product ? product.categoryId : null;
      if (categoryId == null) return "Uncategorized";
      const match = (catalogState.categories || []).find(
        (cat: Category) => String(cat.id) === String(categoryId)
      );
      return match?.name ? String(match.name) : "Uncategorized";
  }, [catalogState.categories]);

  const savedProducts: SavedItem[] = useMemo(() => {
    const products = catalogState.products || [];
    return (bookmarkState.products || []).map((bp) => {
      const match = products.find((p: CatalogProduct) => p.id === bp.productId);
      const activePromo = (storeState.activePromotions || []).find((ap: Promotion) => ap.productId === bp.productId && ap.active === true);
      const basePrice = typeof match?.price === 'string' ? Number(match.price) : match?.price;
      const discounted = (() => {
        if (!activePromo || !isFinite(Number(basePrice))) return undefined;
        const type = String(activePromo.type || '').toLowerCase();
        const value = Number(activePromo.discount || 0);
        if (type === 'percentage') return Math.max(0, Number(basePrice) * (1 - value / 100));
        if (type === 'fixed') return Math.max(0, Number(basePrice) - value);
        return undefined;
      })();
      return {
        id: String(bp.productId),
        name: match?.name || `Product #${bp.productId}`,
        category: match ? getProductCategoryName(match) : "Uncategorized",
        type: "product",
        image: match?.imageUrl,
        price: discounted ?? basePrice,
        storeName: (() => {
          const store = storeState.stores?.find((s: Store) => s.id === match?.storeId);
          return store?.name;
        })(),
      } as SavedItem;
    });
  }, [bookmarkState.products, catalogState.products, storeState.activePromotions, storeState.stores, getProductCategoryName]);

  const savedStores: SavedItem[] = useMemo(() => {
    const stores = storeState.stores || [];
    return (bookmarkState.stores || []).map((bs) => {
      const match = stores.find((s: Store) => s.id === bs.storeId);
      const rawLogo = match?.imageUrl;
      const logoUrl = (() => {
        if (!rawLogo) return undefined;
        if (/^https?:\/\//i.test(rawLogo)) return rawLogo;
        if (rawLogo.startsWith('/')) return `${env.API_BASE_URL}${rawLogo}`;
        return `${env.API_BASE_URL}/files/${rawLogo}`;
      })();
      return {
        id: String(bs.storeId),
        name: match?.name || `Store #${bs.storeId}`,
        category: "",
        type: "store",
        image: logoUrl,
        description: match?.description,
      } as SavedItem;
    });
  }, [bookmarkState.stores, storeState.stores]);

  // Get unique categories from saved products
  const productCategories = useMemo(() => {
    const categories = new Set<string>();
    savedProducts.forEach((product) => {
      if (product.category) {
        categories.add(product.category);
      }
    });
    return ["all", ...Array.from(categories).sort()];
  }, [savedProducts]);

  // Get current items based on active tab (will be managed by TabSelector)
  const [activeTab, setActiveTab] = useState<"products" | "stores">("products");
  const currentItems = activeTab === "products" ? savedProducts : savedStores;

  // Base items filtered by category (without search) - these are what SearchBar should filter
  const categoryFilteredItems = useMemo(() => {
    let items = currentItems.filter((item) => {
      if (activeTab === "stores") {
        return true; // No category filter for stores
      }
      // For products, filter by category
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      return matchesCategory;
    });

    // Sort products by category
    if (activeTab === "products") {
      items = [...items].sort((a, b) => {
        if (selectedCategory === "all") {
          // Sort by category name, then by product name
          const categoryCompare = a.category.localeCompare(b.category);
          if (categoryCompare !== 0) return categoryCompare;
          return a.name.localeCompare(b.name);
        }
        // If a specific category is selected, just sort by name
        return a.name.localeCompare(b.name);
      });
    } else {
      // Sort stores by name
      items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    }

    return items;
  }, [currentItems, selectedCategory, activeTab]);

  // Initialize filteredItems with category-filtered items when category/tab changes
  // SearchBar will update filteredItems through handleSearchChange when user searches
  useEffect(() => {
    setFilteredItems(categoryFilteredItems);
  }, [categoryFilteredItems]);

  // Memoize the filter function for SearchBar
  const searchFilterFn = useCallback((item: SavedItem, query: string) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return item.name.toLowerCase().includes(q);
  }, []);

  // Memoize the onSearchChange callback to prevent infinite loops
  const handleSearchChange = useCallback((query: string, filtered: SavedItem[]) => {
    // Update filtered items based on search
    // SearchBar filters the categoryFilteredItems, so we just use the filtered results
    setFilteredItems(filtered);
  }, []);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name={activeTab === "products" ? "bag-outline" : "storefront-outline"}
        size={80}
        color="#d1d5db"
      />
      <Text style={styles.emptyTitle}>
        No {activeTab === "products" ? "Products" : "Stores"} Saved Yet
      </Text>
      <Text style={styles.emptySubtitle}>
        Start exploring and save your favorite{" "}
        {activeTab === "products" ? "products" : "stores"} to see them here
      </Text>
    </View>
  );

  const renderSavedItem = (item: SavedItem) => {
    const onUnsave = () => {
      if (item.type === "product") {
        bookmarkAction.removeProductBookmark(Number(item.id));
      } else {
        bookmarkAction.removeStoreBookmark(Number(item.id));
      }
    };

    const handleItemPress = () => {
      if (item.type === "product") {
        const product = catalogState.products?.find(
          (p: CatalogProduct) => p.id === Number(item.id)
        );
        if (product) {
          router.push({
            pathname: "/(consumers)/product",
            params: {
              name: product.name,
              storeId: product.storeId,
              price: product.price,
              description: product.description,
              productId: product.id,
            },
          });
        }
      } else {
        const store = storeState.stores?.find(
          (s: Store) => s.id === Number(item.id)
        );
        if (store) {
          router.push({
            pathname: "/(consumers)/storedetails",
            params: {
              store: store.name,
              storeId: store.id,
            },
          });
        }
      }
    };

    const normalizedImage = (() => {
      const raw = item.image;
      if (!raw) return undefined;
      if (/^https?:\/\//i.test(raw)) return raw;
      if (raw.startsWith('/')) return `${env.API_BASE_URL}${raw}`;
      return `${env.API_BASE_URL}/files/${raw}`;
    })();

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={handleItemPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.storeRow}>
            {normalizedImage ? (
              <Image source={{ uri: normalizedImage }} style={styles.thumbnail} />
            ) : (
              <View style={styles.storeLogo}>
                <Ionicons
                  name={item.type === "product" ? "bag-outline" : "storefront-outline"}
                  size={22}
                  color="#277874"
                />
              </View>
            )}
            <View style={{ maxWidth: 220 }}>
              <Text style={styles.storeName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.type === 'product' ? (
                <Text style={styles.storeLocation} numberOfLines={1}>
                  {item.storeName ? `from ${item.storeName}` : "Product"}
                  {typeof item.price === 'number' ? ` • ₱${item.price.toFixed(2)}` : ""}
                </Text>
              ) : (
                <Text style={styles.storeLocation} numberOfLines={2}>
                  {item.description || "Store"}
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="bookmark" size={20} color="#F59E0B" />
        </View>

        <View style={styles.cardBottomRow}>
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>Saved</Text>
          </View>
          <View style={styles.spacer} />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={(e) => {
              e.stopPropagation();
              onUnsave();
            }}
          >
            <Ionicons name="trash" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          items={categoryFilteredItems}
          placeholder={`Search saved ${activeTab}...`}
          filterFn={searchFilterFn}
          onSearchChange={handleSearchChange}
        />
      </View>

      {/* Category Tabs */}
      <View style={styles.tabContainer}>
        <TabSelector
          tabs={[
            { key: "products", label: "Products", badge: savedProducts.length },
            { key: "stores", label: "Stores", badge: savedStores.length },
          ]}
          initialTab="products"
          onTabChange={(tab) => {
            setActiveTab(tab as "products" | "stores");
            setSelectedCategory("all");
          }}
        />
      </View>

      {/* Category Filter - Only show for products */}
      {activeTab === "products" && (
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {productCategories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.activeCategoryChip,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category &&
                    styles.activeCategoryChipText,
                ]}
              >
                  {category === "all" ? "All" : category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      )}

      {/* Saved Items */}
      <View style={styles.itemsContainer}>
        {filteredItems.length === 0
          ? renderEmptyState()
          : filteredItems.map(renderSavedItem)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  tabContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  activeCategoryChip: {
    backgroundColor: "#277874",
    borderColor: "#277874",
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  activeCategoryChipText: {
    color: "#ffffff",
  },
  itemsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  thumbnail: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  // Card styles (aligned with provided design)
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  storeRow: { flexDirection: "row", alignItems: "center", columnGap: 12 },
  storeLogo: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  storeName: { fontWeight: "700", fontSize: 16, maxWidth: 200 },
  storeLocation: {
    color: "#6B7280",
    fontSize: 13,
    textTransform: "capitalize",
  },
  cardBottomRow: { marginTop: 14, flexDirection: "row", alignItems: "center" },
  activePill: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  activePillText: { color: "#1B6F5D", fontWeight: "600", fontSize: 12 },
  spacer: { flex: 1 },
  removeButton: { padding: 8 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
});
