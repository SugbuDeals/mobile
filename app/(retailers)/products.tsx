import { PaginationControls } from "@/components/PaginationControls";
import { SearchBar } from "@/components/SearchBar";
import { Modal } from "@/components/Modal";
import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import { selectIsDeletingProduct } from "@/features/store/products/slice";
import type { Product } from "@/features/store/products/types";
import { useModal } from "@/hooks/useModal";
import { useAppSelector } from "@/store/hooks";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function Products() {
  const { state: { user } } = useLogin();
  const { action: { findProducts, deleteProduct }, state: { products, loading, userStore } } = useStore();
  const { isOpen: deleteModalVisible, data: productToDelete, open: openDeleteModal, close: closeDeleteModal } = useModal<Product>();
  const isDeleting = useAppSelector((state) => 
    productToDelete ? selectIsDeletingProduct(state, productToDelete.id) : false
  );
  const scrollViewRef = useRef<ScrollView>(null);
  const lastFetchedStoreId = useRef<number | null>(null);
  const [filteredProducts, setFilteredProducts] = React.useState<Product[]>(products);

  useEffect(() => {
    // Fetch products for the current user's store
    if (userStore?.id && lastFetchedStoreId.current !== userStore.id) {
      lastFetchedStoreId.current = userStore.id;
      findProducts({ storeId: userStore.id });
    } else if (user?.id && !userStore?.id) {
      // Fallback: if userStore is not available yet, try using user ID directly
      // This handles the timing issue when navigating directly to inventory
      console.log("Products page - userStore not available, using user ID as fallback");
      findProducts({ storeId: Number(user.id) });
    }
  }, [userStore?.id, user]);

  // Refresh products when component comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("Products page - Refreshing products on focus...");
      if (userStore?.id) {
        findProducts({ storeId: userStore.id });
      } else if (user?.id) {
        console.log("Products page - userStore not available on focus, using user ID");
        findProducts({ storeId: Number(user.id) });
      }
    }, [userStore?.id, user, findProducts])
  );

  // Update filtered products when products change
  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

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
          
          <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
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
          onSearchChange={(query, filtered) => {
            setFilteredProducts(filtered);
          }}
        />
      </View>

      {/* Product List with Pagination */}
      <PaginationControls
        totalItems={filteredProducts.length}
        items={filteredProducts}
        initialPage={1}
        initialItemsPerPage={2}
        autoCalculateItemsPerPage={true}
        reservedHeight={345}
        itemHeight={112}
      >
        {(paginatedProducts) => (
          <ScrollView 
            ref={scrollViewRef}
            style={styles.content} 
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading products...</Text>
              </View>
            ) : paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => (
                <View key={product.id} style={styles.productCard}>
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
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyText}>No products found</Text>
                <Text style={styles.emptySubtext}>
                  Try adjusting your search terms or add your first product to get started
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </PaginationControls>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalVisible}
        onClose={closeDeleteModal}
        variant="confirmation"
        size="small"
        title="Remove Product"
        message={productToDelete ? `Are you sure you want to remove "${productToDelete.name}"?` : ""}
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
            label: isDeleting ? "Removing..." : "Remove",
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
    paddingVertical: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
    width: 80,
    height: 80,
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
});