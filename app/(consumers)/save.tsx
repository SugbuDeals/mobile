import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { useBookmarks } from "@/features/bookmarks";
import { useCatalog } from "@/features/catalog";
import { useStore } from "@/features/store";

type SavedItem = {
  id: string;
  name: string;
  category: string;
  type: "product" | "store";
  image?: string;
};

export default function Save() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"products" | "stores">("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { action: bookmarkAction, state: bookmarkState } = useBookmarks();
  const { state: catalogState, action: catalogAction } = useCatalog();
  const { state: storeState, action: storeAction } = useStore();

  useEffect(() => {
    bookmarkAction.loadProductBookmarks();
    bookmarkAction.loadStoreBookmarks();
    if (!catalogState.products?.length) {
      catalogAction.loadProducts();
    }
    if (!storeState.stores?.length) {
      storeAction.findStores();
    }
  }, []);

  const savedProducts: SavedItem[] = useMemo(() => {
    const products = catalogState.products || [];
    return (bookmarkState.products || []).map((bp) => {
      const match = products.find((p: any) => p.id === bp.productId);
      return {
        id: String(bp.productId),
        name: match?.name || `Product #${bp.productId}`,
        category: (match as any)?.category || "all",
        type: "product",
      } as SavedItem;
    });
  }, [bookmarkState.products, catalogState.products]);

  const savedStores: SavedItem[] = useMemo(() => {
    const stores = storeState.stores || [];
    return (bookmarkState.stores || []).map((bs) => {
      const match = stores.find((s: any) => s.id === bs.storeId);
      return {
        id: String(bs.storeId),
        name: match?.name || `Store #${bs.storeId}`,
        category: "all",
        type: "store",
      } as SavedItem;
    });
  }, [bookmarkState.stores, storeState.stores]);

  // Categories for filtering
  const productCategories = [
    "all",
    "electronics",
    "clothing",
    "home",
    "food",
    "beauty",
  ];
  const storeCategories = [
    "all",
    "grocery",
    "electronics",
    "fashion",
    "home",
    "restaurant",
  ];

  const currentItems = activeTab === "products" ? savedProducts : savedStores;
  const currentCategories =
    activeTab === "products" ? productCategories : storeCategories;

  const filteredItems = currentItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          (p: any) => p.id === Number(item.id)
        );
        if (product) {
          router.push({
            pathname: "/(consumers)/product",
            params: {
              name: product.name,
              storeId: product.storeId,
              price: product.price,
              productId: product.id,
            },
          });
        }
      } else {
        const store = storeState.stores?.find(
          (s: any) => s.id === Number(item.id)
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

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={handleItemPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.storeRow}>
            <View style={styles.storeLogo}>
              <Ionicons
                name={
                  item.type === "product" ? "bag-outline" : "storefront-outline"
                }
                size={22}
                color="#277874"
              />
            </View>
            <View>
              <Text style={styles.storeName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.storeLocation}>{item.category}</Text>
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
        <View style={styles.searchBox}>
          <Ionicons
            name="search"
            size={20}
            color="#6b7280"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search saved ${activeTab}...`}
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "products" && styles.activeTab]}
          onPress={() => setActiveTab("products")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "products" && styles.activeTabText,
            ]}
          >
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "stores" && styles.activeTab]}
          onPress={() => setActiveTab("stores")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "stores" && styles.activeTabText,
            ]}
          >
            Stores
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {currentCategories.map((category) => (
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
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

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
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: "#f3f4f6",
    borderRadius: 30,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 30,
  },
  activeTab: {
    backgroundColor: "#277874",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  activeTabText: {
    color: "#ffffff",
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
