import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Dimensions,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function Products() {
  const { state: { user } } = useLogin();
  const { action: { findProducts, deleteProduct }, state: { products, loading } } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(2);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Fetch products for the current user's store
    if (user && (user as any).id) {
      findProducts({ storeId: Number((user as any).id) });
    }
  }, [user]);

  // Calculate optimal items per page based on screen height
  useEffect(() => {
    const calculateItemsPerPage = () => {
      const windowHeight = Dimensions.get('window').height;
      
      // Calculate available height for product list
      // Header: ~120px, Search: ~80px, Pagination: ~80px, Tab bar: ~65px
      const reservedHeight = 120 + 80 + 80 + 65;
      const availableHeight = windowHeight - reservedHeight;
      
      // Each product card is approximately 112px (80px image + 32px padding)
      const cardHeight = 112;
      const maxItems = Math.floor(availableHeight / cardHeight);
      
      // Ensure at least 1 item per page, but not more than total products
      const optimalItems = Math.max(1, Math.min(maxItems, products.length));
      setItemsPerPage(optimalItems);
    };

    calculateItemsPerPage();
    
    // Listen for orientation changes
    const subscription = Dimensions.addEventListener('change', calculateItemsPerPage);
    
    return () => subscription?.remove();
  }, [products.length]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  const handleDelete = (product: any) => {
    setProductToDelete(product);
    setSelectedProductId(product.id.toString());
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        console.log("Deleting product:", productToDelete.id);
        await deleteProduct(Number(productToDelete.id));
        
        // Refresh the products list after successful deletion
        if (user && (user as any).id) {
          await findProducts({ storeId: Number((user as any).id) });
        }
        
        setDeleteModalVisible(false);
        setProductToDelete(null);
        setSelectedProductId(null);
      } catch (error) {
        console.error("Error deleting product:", error);
        // Keep modal open on error so user can try again
      }
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setProductToDelete(null);
    setSelectedProductId(null);
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
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Product List */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : currentProducts.length > 0 ? (
          currentProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              {selectedProductId === product.id.toString() && deleteModalVisible ? (
                <View style={styles.deleteModalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Are you sure to remove this product?</Text>
                    <Text style={styles.modalProductName}>{product.name}</Text>
                    
                    <View style={styles.modalButtons}>
                      <TouchableOpacity 
                        style={styles.removeButton}
                        onPress={confirmDelete}
                      >
                        <Text style={styles.removeButtonText}>REMOVE</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={cancelDelete}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="cube-outline" size={32} color="#9CA3AF" />
                  </View>
                  
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
                </>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search terms' : 'Add your first product to get started'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Pagination - Only show if there are multiple pages */}
      {totalPages > 1 && (
        <View style={styles.pagination}>
          {Array.from({ length: totalPages }, (_, index) => (
            <TouchableOpacity
              key={index + 1}
              style={[
                styles.pageButton,
                currentPage === index + 1 && styles.activePageButton
              ]}
              onPress={() => setCurrentPage(index + 1)}
            >
              <Text style={[
                styles.pageButtonText,
                currentPage === index + 1 && styles.activePageButtonText
              ]}>
                {index + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
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
  deleteModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    // Ensure it maintains the same dimensions as the product card
   
    
  },
  modalContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: 8,
    width: "100%",
    height: "100%",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginBottom: 6,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    lineHeight: 20,
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  removeButton: {
    backgroundColor: "#FFBE5D",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 120,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  cancelButton: {
    backgroundColor: "#277874",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 120,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
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