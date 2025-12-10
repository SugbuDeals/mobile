import { Modal } from "@/components/Modal";
import { PaginationControls } from "@/components/PaginationControls";
import { SearchBar } from "@/components/SearchBar";
import { useLogin } from "@/features/auth";
import { useCatalog } from "@/features/catalog";
import { useStore } from "@/features/store";
import { selectIsDeletingProduct } from "@/features/store/products/slice";
import type { Product } from "@/features/store/products/types";
import { useModal } from "@/hooks/useModal";
import { useStableThunk } from "@/hooks/useStableCallback";
import { useAppSelector } from "@/store/hooks";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

// Helper function to get icon name based on category name
const getCategoryIcon = (categoryName: string): keyof typeof Ionicons.glyphMap => {
  const name = categoryName.toLowerCase();
  if (name.includes("gadget") || name.includes("electronics") || name.includes("tech")) {
    return "phone-portrait-outline";
  }
  if (name.includes("cloth") || name.includes("apparel") || name.includes("fashion")) {
    return "shirt-outline";
  }
  if (name.includes("food") || name.includes("grocery")) {
    return "restaurant-outline";
  }
  if (name.includes("book") || name.includes("stationery")) {
    return "library-outline";
  }
  if (name.includes("sport") || name.includes("fitness")) {
    return "barbell-outline";
  }
  if (name.includes("beauty") || name.includes("cosmetic")) {
    return "sparkles-outline";
  }
  if (name.includes("home") || name.includes("furniture")) {
    return "home-outline";
  }
  if (name.includes("toy") || name.includes("game")) {
    return "game-controller-outline";
  }
  if (name.includes("health") || name.includes("medical")) {
    return "medical-outline";
  }
  if (name.includes("car") || name.includes("auto") || name.includes("vehicle")) {
    return "car-outline";
  }
  // Default icon
  return "pricetags-outline";
};

export default function Products() {
  const { state: { user } } = useLogin();
  const { action: { findProducts, deleteProduct }, state: { products, loading, userStore } } = useStore();
  const { action: { loadCategories }, state: { categories } } = useCatalog();
  const { isOpen: deleteModalVisible, data: productToDelete, open: openDeleteModal, close: closeDeleteModal } = useModal<Product>();
  const isDeleting = useAppSelector((state) => 
    productToDelete ? selectIsDeletingProduct(state, productToDelete.id) : false
  );
  const lastFetchedStoreIdRef = useRef<number | null>(null);
  const lastFetchedUserIdRef = useRef<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid"); // Default to grid for visual browsing
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Stable thunk references
  const stableFindProducts = useStableThunk(findProducts);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Get categories that have products in the store
  const availableCategories = useMemo(() => {
    if (!categories.length || !products.length) return [];
    
    // Get unique category IDs from products
    const productCategoryIds = new Set(
      products
        .map((p) => p.categoryId)
        .filter((id): id is number => id !== null && id !== undefined)
    );
    
    // Filter categories to only those that have products
    return categories.filter((cat) => productCategoryIds.has(cat.id));
  }, [categories, products]);

  // Derived state: filtered products based on search query and category
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategoryId !== null) {
      filtered = filtered.filter(
        (product) => product.categoryId === selectedCategoryId
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, searchQuery, selectedCategoryId]);

  useEffect(() => {
    const storeId = userStore?.id;
    const userId = user?.id ? Number(user.id) : null;

    // Skip if we've already fetched for this store
    if (storeId && lastFetchedStoreIdRef.current === storeId) {
      return;
    }
    // Skip if we've already fetched for this user (fallback case)
    if (userId && !storeId && lastFetchedUserIdRef.current === userId) {
      return;
    }

    if (storeId) {
      lastFetchedStoreIdRef.current = storeId;
      stableFindProducts({ storeId });
    } else if (userId) {
      lastFetchedUserIdRef.current = userId;
      stableFindProducts({ storeId: userId });
    }
  }, [userStore?.id, user?.id, stableFindProducts]);

  // Refresh products when component comes into focus
  useFocusEffect(
    useCallback(() => {
      const storeId = userStore?.id;
      const userId = user?.id ? Number(user.id) : null;

      if (storeId) {
        stableFindProducts({ storeId });
      } else if (userId) {
        stableFindProducts({ storeId: userId });
      }
    }, [userStore?.id, user?.id, stableFindProducts])
  );

  const getStockStatusColor = (stock: number) => {
    if (stock > 10) return "#10B981"; // In Stock
    if (stock > 0) return "#F59E0B"; // Low Stock
    return "#EF4444"; // Out of Stock
  };

  const getStockStatusText = (stock: number) => {
    if (stock > 10) return "In Stock";
    if (stock > 0) return "Low Stock";
    return "Out of Stock";
  };

  const handleEdit = (productId: string) => {
    router.push(`/(retailers)/edit-product?productId=${productId}`);
  };

  const handleDelete = (product: Product) => {
    openDeleteModal(product);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        console.log("Deleting product:", productToDelete.id);
        await deleteProduct(Number(productToDelete.id));
        
        // Refresh the products list after successful deletion
        if (userStore?.id) {
          await findProducts({ storeId: userStore.id });
        }
        
        closeDeleteModal();
      } catch (error) {
        console.error("Error deleting product:", error);
        // Keep modal open on error so user can try again
      }
    }
  };

  const cancelDelete = () => {
    closeDeleteModal();
  };

  const handleAddProduct = () => {
    router.push("/(retailers)/add-product");
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "list" ? "grid" : "list"));
  };

  // Render product card for list view
  const renderListItem = ({ item: product }: { item: Product }) => (
    <View style={styles.productCard}>
                  {product.imageUrl ? (
                    <Image
                      source={{ uri: product.imageUrl }}
                      style={styles.productImage}
                    />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Ionicons name="cube-outline" size={32} color="#9CA3AF" />
                    </View>
                  )}
                  
                  <View style={styles.productInfo}>
                    <View style={styles.productHeader}>
                      <View style={styles.productDetails}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productCategory}>
                          {product.description || 'No description'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.stockStatus}>
                      <View style={[styles.stockTag, { backgroundColor: getStockStatusColor(product.stock) }]}>
                        <Text style={styles.stockText}>{getStockStatusText(product.stock)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.productFooter}>
                      <Text style={styles.productPrice}>${product.price}</Text>
                      
                      <View style={styles.actionButtons}>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleEdit(product.id.toString())}
                        >
                          <Ionicons name="create" size={16} color="#ffffff" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleDelete(product)}
                        >
                          <Ionicons name="trash" size={16} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
  );

  // Render product card for grid view
  const renderGridItem = ({ item: product }: { item: Product }) => {
    const screenWidth = Dimensions.get("window").width;
    const cardWidth = (screenWidth - 60) / 2; // 2 columns with padding
    
    return (
      <TouchableOpacity
        style={[styles.gridCard, { width: cardWidth }]}
        onPress={() => handleEdit(product.id.toString())}
        activeOpacity={0.8}
      >
        <View style={styles.gridImageContainer}>
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.gridImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.gridImagePlaceholder}>
              <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
            </View>
          )}
          <View style={[styles.gridStockBadge, { backgroundColor: getStockStatusColor(product.stock) }]}>
            <Text style={styles.gridStockText}>{getStockStatusText(product.stock)}</Text>
          </View>
        </View>
        
        <View style={styles.gridContent}>
          <Text style={styles.gridProductName} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.gridProductPrice}>${product.price}</Text>
          
          <View style={styles.gridActions}>
            <TouchableOpacity 
              style={styles.gridActionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleEdit(product.id.toString());
              }}
            >
              <Ionicons name="create" size={14} color="#ffffff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.gridActionButton, styles.gridDeleteButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(product);
              }}
            >
              <Ionicons name="trash" size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyText}>No products found</Text>
                <Text style={styles.emptySubtext}>
                  Try adjusting your search terms or add your first product to get started
                </Text>
              </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      
      {/* Header */}
      <LinearGradient
        colors={["#FFBE5D", "#277874"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="cart" size={24} color="#ffffff" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Inventory</Text>
              <Text style={styles.headerSubtitle}>Manage your products</Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.viewModeButton} 
              onPress={toggleViewMode}
            >
              <Ionicons 
                name={viewMode === "grid" ? "list" : "grid"} 
                size={20} 
                color="#ffffff" 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
              <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          items={products}
          placeholder="Search products..."
          filterFn={(product, query) => {
            if (!query.trim()) return true;
            const q = query.toLowerCase();
            return !!(product.name.toLowerCase().includes(q) || 
                   (product.description && product.description.toLowerCase().includes(q)));
          }}
          onSearchChange={(query) => {
            setSearchQuery(query);
          }}
        />
      </View>

      {/* Category Filter */}
      {availableCategories.length > 0 && (
        <View style={styles.categoryContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategoryId === null && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategoryId(null)}
            >
              <View style={[
                styles.categoryIconCircle,
                selectedCategoryId === null && styles.categoryIconCircleActive
              ]}>
                <Ionicons 
                  name="apps-outline" 
                  size={20} 
                  color={selectedCategoryId === null ? "#ffffff" : "#6B7280"} 
                />
              </View>
              <Text style={[
                styles.categoryText,
                selectedCategoryId === null && styles.categoryTextActive
              ]}>
                All
              </Text>
            </TouchableOpacity>

            {availableCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategoryId === category.id && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategoryId(
                  selectedCategoryId === category.id ? null : category.id
                )}
              >
                <View style={[
                  styles.categoryIconCircle,
                  selectedCategoryId === category.id && styles.categoryIconCircleActive
                ]}>
                  <Ionicons 
                    name={getCategoryIcon(category.name)} 
                    size={20} 
                    color={selectedCategoryId === category.id ? "#ffffff" : "#6B7280"} 
                  />
                </View>
                <Text style={[
                  styles.categoryText,
                  selectedCategoryId === category.id && styles.categoryTextActive
                ]} numberOfLines={1}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Product List/Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : viewMode === "grid" ? (
        <FlatList
          data={filteredProducts}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
        />
      ) : (
        <PaginationControls
          totalItems={filteredProducts.length}
          items={filteredProducts}
          initialPage={1}
          initialItemsPerPage={10}
          autoCalculateItemsPerPage={true}
          reservedHeight={345}
          itemHeight={164}
        >
          {(paginatedProducts) => (
            <FlatList
              data={paginatedProducts}
              renderItem={renderListItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={5}
              windowSize={5}
            />
        )}
      </PaginationControls>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalVisible}
        onClose={closeDeleteModal}
        variant="confirmation"
        size="small"
        title="Delete Product"
        message={productToDelete ? `Are you sure you want to delete "${productToDelete.name}"? This action cannot be undone.` : "Are you sure you want to delete this product? This action cannot be undone."}
        icon="trash-outline"
        iconColor="#EF4444"
        actions={[
          {
            label: "Cancel",
            onPress: cancelDelete,
            variant: "outline",
            loading: false,
          },
          {
            label: isDeleting ? "Deleting..." : "Delete",
            onPress: confirmDelete,
            variant: "danger",
            loading: isDeleting,
          },
        ]}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomRightRadius: 40,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#277874",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFBE5D",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    backgroundColor: "#ffffff",
  },
  categoryContainer: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 12,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
    alignItems: "center",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    gap: 8,
    minWidth: 80,
    justifyContent: "center",
  },
  categoryChipActive: {
    backgroundColor: "#277874",
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryIconCircleActive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
    maxWidth: 100,
  },
  categoryTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    // Ensure consistent height
    minHeight: 164,
    position: "relative",
  },
  productImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    marginRight: 16,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: "#6B7280",
  },
  discountTag: {
    backgroundColor: "#FFBE5D",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  stockStatus: {
    marginBottom: 12,
  },
  stockTag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  stockText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#10B981",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFBE5D",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  activePageButton: {
    backgroundColor: "#FFBE5D",
  },
  pageButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  activePageButtonText: {
    color: "#ffffff",
  },
  loadingContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  emptyContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    marginBottom: 16,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  // Grid view styles
  gridCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridImageContainer: {
    width: "100%",
    height: 180,
    position: "relative",
    backgroundColor: "#F3F4F6",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  gridStockBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gridStockText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ffffff",
  },
  gridContent: {
    padding: 12,
  },
  gridProductName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    minHeight: 36,
  },
  gridProductPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 8,
  },
  gridActions: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  gridActionButton: {
    flex: 1,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#FFBE5D",
    justifyContent: "center",
    alignItems: "center",
  },
  gridDeleteButton: {
    backgroundColor: "#EF4444",
  },
});