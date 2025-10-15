import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  stockStatus: "In Stock" | "Low Stock" | "Out of Stock";
  discount?: string;
  image: any;
}

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Pilot Frixion Erasable Pen",
    category: "Office Supplies",
    price: "$ 3,000.00",
    stockStatus: "In Stock",
    discount: "30% OFF",
    image: require("@/assets/images/index.png"),
  },
  {
    id: "2",
    name: "Wireless Keyboard",
    category: "Electronics",
    price: "$ 350.00",
    stockStatus: "Low Stock",
    discount: "30% OFF",
    image: require("@/assets/images/index1.png"),
  },
  {
    id: "3",
    name: "Whiteboard Marker Set",
    category: "Office Supplies",
    price: "$ 8.99",
    stockStatus: "In Stock",
    image: require("@/assets/images/index2.png"),
  },
  {
    id: "4",
    name: "Erasable Pen Set (5pcs)",
    category: "Office Supplies",
    price: "$ 15.99",
    stockStatus: "Out of Stock",
    image: require("@/assets/images/index3.png"),
  },
];

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(2);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

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
      const optimalItems = Math.max(1, Math.min(maxItems, mockProducts.length));
      setItemsPerPage(optimalItems);
    };

    calculateItemsPerPage();
    
    // Listen for orientation changes
    const subscription = Dimensions.addEventListener('change', calculateItemsPerPage);
    
    return () => subscription?.remove();
  }, []);

  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "#10B981";
      case "Low Stock":
        return "#F59E0B";
      case "Out of Stock":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const handleEdit = (productId: string) => {
    router.push(`/(retailers)/edit-product?productId=${productId}`);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setSelectedProductId(product.id);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      console.log("Confirm delete product:", productToDelete.id);
      // Handle actual delete logic here
      setDeleteModalVisible(false);
      setProductToDelete(null);
      setSelectedProductId(null);
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
        {currentProducts.map((product) => (
          <View key={product.id} style={styles.productCard}>
            {selectedProductId === product.id && deleteModalVisible ? (
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
                <Image source={product.image} style={styles.productImage} />
                
                <View style={styles.productInfo}>
                  <View style={styles.productHeader}>
                    <View style={styles.productDetails}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productCategory}>{product.category}</Text>
                    </View>
                    
                    {product.discount && (
                      <View style={styles.discountTag}>
                        <Text style={styles.discountText}>{product.discount}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.stockStatus}>
                    <View style={[styles.stockTag, { backgroundColor: getStockStatusColor(product.stockStatus) }]}>
                      <Text style={styles.stockText}>{product.stockStatus}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.productFooter}>
                    <Text style={styles.productPrice}>{product.price}</Text>
                    
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleEdit(product.id)}
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
        ))}
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
});
