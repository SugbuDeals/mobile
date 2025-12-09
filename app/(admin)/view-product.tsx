import { useCatalog } from "@/features/catalog";
import { useStore } from "@/features/store";
import type { Product } from "@/features/store/products/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Image, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");

export default function AdminViewProducts() {
  const { state: storeState, action: storeActions } = useStore();
  const { state: catalogState, action: catalogActions } = useCatalog();
  const [query, setQuery] = useState("");
  const [productStatusLoading, setProductStatusLoading] = useState<Record<number, boolean>>({});
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    storeActions.findProducts();
    storeActions.findStores();
    catalogActions.loadCategories();
  }, []);

  const categoryMap = useMemo(() => {
    const map: Record<number, string> = {};
    (catalogState.categories || []).forEach((category) => {
      if (category?.id) {
        map[category.id] = category.name;
      }
    });
    return map;
  }, [catalogState.categories]);

  const products = storeState.products.filter((p) =>
    (p.name || "").toLowerCase().includes(query.toLowerCase())
  );

  const handleToggleProductActive = async (productId: number, nextValue: boolean) => {
    setProductStatusLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      await storeActions.updateProductAdminStatus({ id: productId, isActive: nextValue }).unwrap();
      Alert.alert("Success", `Product has been ${nextValue ? "enabled" : "disabled"}.`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update product visibility.";
      Alert.alert("Error", errorMessage);
    } finally {
      setProductStatusLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const getCategoryLabel = (product: Product) => {
    if (!product.categoryId) {
      return "Uncategorized";
    }
    return categoryMap[product.categoryId] || `Category #${product.categoryId}`;
  };

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setEditName(product.name || "");
    setEditDescription(product.description || "");
    setEditPrice(product.price?.toString() || "");
    setEditStock(product.stock?.toString() || "");
    setEditCategoryId(product.categoryId || null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!productToEdit) return;
    
    if (!editName.trim()) {
      Alert.alert("Error", "Product name is required");
      return;
    }
    
    const price = parseFloat(editPrice);
    const stock = parseInt(editStock, 10);
    
    if (isNaN(price) || price <= 0) {
      Alert.alert("Error", "Price must be a positive number");
      return;
    }
    
    if (isNaN(stock) || stock < 0) {
      Alert.alert("Error", "Stock must be a non-negative number");
      return;
    }

    setIsSaving(true);
    
    try {
      await storeActions.updateProduct({
        id: productToEdit.id,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        price: price,
        stock: stock,
        categoryId: editCategoryId || undefined,
      }).unwrap();
      
      // Refresh products list
      await storeActions.findProducts();
      
      setShowEditModal(false);
      setProductToEdit(null);
      Alert.alert("Success", "Product updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = (productId: number) => {
    setProductToDelete(productId);
    setShowDeleteModal(true);
  };

  const confirmDeleteProduct = async () => {
    if (productToDelete === null) return;
    
    setIsDeleting(true);
    try {
      await storeActions.deleteProduct(productToDelete).unwrap();
      // Refresh products list
      await storeActions.findProducts();
      setShowDeleteModal(false);
      setProductToDelete(null);
      Alert.alert("Success", "Product deleted successfully");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  if (storeState.loading && (!storeState.products || storeState.products.length === 0)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#277874" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  const isOrphanProduct = (storeId: number) => !storeState.stores.some((s) => s.id === storeId);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Products</Text>
          <View style={styles.countBadge}>
            <Ionicons name="cube-outline" color="#277874" size={16} />
            <Text style={styles.countText}>{storeState.products?.length || 0}</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySub}>Try a different search term</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {products.map((product) => (
              <View key={product.id} style={styles.card}>
                <Image
                  source={{ uri: product.imageUrl || "https://via.placeholder.com/64x64.png?text=P" }}
                  style={styles.thumbnail}
                />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{product.name}</Text>
                  <Text style={styles.cardSub} numberOfLines={2}>
                    {product.description}
                  </Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.metaPill, { backgroundColor: "#e0f2f1" }]}>
                      <Ionicons name="pricetag" size={14} color="#277874" />
                      <Text style={[styles.metaText, { color: "#277874" }]}>₱{Number(product.price).toLocaleString()}</Text>
                    </View>
                    <View style={[styles.metaPill, { backgroundColor: "#fef3c7" }]}>
                      <Ionicons name="cube" size={14} color="#F59E0B" />
                      <Text style={[styles.metaText, { color: "#B45309" }]}>Stock: {product.stock}</Text>
                    </View>
                    <View style={[styles.metaPill, { backgroundColor: product.isActive ? "#D1FAE5" : "#F3F4F6" }]}>
                      <Ionicons name={product.isActive ? "checkmark-circle" : "pause-circle"} size={14} color={product.isActive ? "#10B981" : "#6B7280"} />
                      <Text style={[styles.metaText, { color: product.isActive ? "#065F46" : "#374151" }]}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Text>
                    </View>
                    <View style={[styles.metaPill, { backgroundColor: "#E0E7FF" }]}>
                      <Ionicons name="albums" size={14} color="#4338CA" />
                      <Text style={[styles.metaText, { color: "#312E81" }]} numberOfLines={1}>
                        {getCategoryLabel(product)}
                      </Text>
                    </View>
                    {product.categoryId && (
                      <View style={[styles.metaPill, { backgroundColor: "#F3F4F6" }]}>
                        <Ionicons name="pricetags" size={14} color="#4B5563" />
                        <Text style={[styles.metaText, { color: "#374151" }]}>ID: {product.categoryId}</Text>
                      </View>
                    )}
                    {isOrphanProduct(product.storeId) && (
                      <View style={[styles.metaPill, styles.deletePill]}>
                        <Ionicons name="alert-circle" size={14} color="#991B1B" />
                        <Text style={[styles.metaText, { color: "#991B1B" }]}>Recommended to delete</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.productActions}>
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>{product.isActive ? "Active" : "Disabled"}</Text>
                      <Switch
                        value={!!product.isActive}
                        onValueChange={(value) => handleToggleProductActive(product.id, value)}
                        trackColor={{ false: "#FECACA", true: "#A7F3D0" }}
                        thumbColor="#FFFFFF"
                        disabled={!!productStatusLoading[product.id]}
                      />
                    </View>
                    {productStatusLoading[product.id] && (
                      <ActivityIndicator size="small" color="#277874" />
                    )}
                  </View>
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => handleEditProduct(product)}
                    >
                      <Ionicons name="create-outline" size={18} color="#277874" />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteProduct(product.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit Product Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Edit Product</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalScroll}>
              <View style={styles.editFormGroup}>
                <Text style={styles.editFormLabel}>Product Name *</Text>
                <TextInput
                  style={styles.editFormInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter product name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.editFormGroup}>
                <Text style={styles.editFormLabel}>Description</Text>
                <TextInput
                  style={[styles.editFormInput, styles.textAreaInput]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  placeholder="Enter product description"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.editFormRow}>
                <View style={styles.editFormGroupHalf}>
                  <Text style={styles.editFormLabel}>Price (₱) *</Text>
                  <TextInput
                    style={styles.editFormInput}
                    value={editPrice}
                    onChangeText={setEditPrice}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                  />
                </View>
                
                <View style={styles.editFormGroupHalf}>
                  <Text style={styles.editFormLabel}>Stock *</Text>
                  <TextInput
                    style={styles.editFormInput}
                    value={editStock}
                    onChangeText={setEditStock}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.editFormGroup}>
                <Text style={styles.editFormLabel}>Category</Text>
                <View style={styles.categorySelector}>
                  <TouchableOpacity
                    style={[
                      styles.categoryOption,
                      editCategoryId === null && styles.categoryOptionSelected
                    ]}
                    onPress={() => setEditCategoryId(null)}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        editCategoryId === null && styles.categoryOptionTextSelected
                      ]}
                    >
                      Uncategorized
                    </Text>
                  </TouchableOpacity>
                  {catalogState.categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        editCategoryId === category.id && styles.categoryOptionSelected
                      ]}
                      onPress={() => setEditCategoryId(category.id)}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          editCategoryId === category.id && styles.categoryOptionTextSelected
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.editModalButtons}>
              <TouchableOpacity
                style={[styles.editModalButton, styles.cancelEditButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelEditButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editModalButton, styles.saveButton]}
                onPress={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning-outline" size={64} color="#DC2626" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Delete Product</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete this product? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteModalButton]}
                onPress={confirmDeleteProduct}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.deleteModalButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#277874",
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9f8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  countText: {
    color: "#277874",
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 44,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#1F2937",
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#F3F4F6",
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  deletePill: {
    backgroundColor: "#FEE2E2",
  },
  metaText: {
    fontSize: 12,
    fontWeight: "700",
  },
  productActions: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchLabel: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  actionButtonsRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f0f9f8",
    borderWidth: 1,
    borderColor: "#277874",
  },
  editButtonText: {
    color: "#277874",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#DC2626",
  },
  deleteButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#6B7280",
  },
  emptySub: {
    marginTop: 4,
    fontSize: 13,
    color: "#9CA3AF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#277874",
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: width - 80,
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteModalButton: {
    backgroundColor: "#DC2626",
  },
  deleteModalButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  
  // Edit Modal Styles
  editModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    width: width - 40,
    maxHeight: "80%",
    overflow: "hidden",
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  editModalScroll: {
    maxHeight: 400,
  },
  editFormGroup: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  editFormGroupHalf: {
    flex: 1,
    marginRight: 12,
  },
  editFormRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  editFormLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  editFormInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  textAreaInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  categorySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryOptionSelected: {
    backgroundColor: "#277874",
    borderColor: "#277874",
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  categoryOptionTextSelected: {
    color: "#ffffff",
  },
  editModalButtons: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  editModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelEditButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelEditButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#277874",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});


