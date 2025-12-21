import { useCatalog } from "@/features/catalog";
import type { Category } from "@/features/catalog/types";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

// Color palette for categories
const categoryColors = [
  "#277874", "#FFBE5D", "#8B5CF6", "#F87171", "#60A5FA", 
  "#F59E0B", "#1E40AF", "#10B981", "#EF4444", "#06B6D4"
];

// Predefined categories for Auto Fill
const PREDEFINED_CATEGORIES = [
  "Groceries",
  "Electronics",
  "Fashion",
  "Home & Living",
  "Furniture",
  "Decor",
  "Beauty & Personal Care",
  "Health & Wellness",
  "Sports & Outdoors",
  "Toys & Games",
  "Books & Media",
  "Automotive",
  "Pet Supplies",
  "Office Supplies",
  "Baby & Kids",
  "Food & Beverages",
  "Clothing & Accessories",
  "Jewelry & Watches",
  "Shoes",
  "Bags & Luggage",
  "Kitchen & Dining",
  "Garden & Outdoor",
  "Tools & Hardware",
  "Musical Instruments",
  "Art & Crafts",
];

export default function AdminCategories() {
  const { state: catalogState, action: catalogActions } = useCatalog();
  const [isLoading, setIsLoading] = useState(true);
  
  // Category management state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAutoFillModal, setShowAutoFillModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<any>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPredefinedCategories, setSelectedPredefinedCategories] = useState<Set<string>>(new Set());
  const [isBulkCreating, setIsBulkCreating] = useState(false);

  useEffect(() => {
    catalogActions.loadCategories();
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Category management functions
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Error", "Category name is required");
      return;
    }

    setIsSaving(true);
    try {
      await catalogActions.addCategory({ name: newCategoryName.trim() });
      setShowAddModal(false);
      setNewCategoryName("");
      Alert.alert("Success", "Category created successfully");
    } catch {
      Alert.alert("Error", "Failed to create category");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editCategoryName.trim()) {
      Alert.alert("Error", "Category name is required");
      return;
    }

    if (!categoryToEdit) return;

    setIsSaving(true);
    try {
      await catalogActions.editCategory(categoryToEdit.id, { name: editCategoryName.trim() });
      setShowEditModal(false);
      setCategoryToEdit(null);
      setEditCategoryName("");
      Alert.alert("Success", "Category updated successfully");
    } catch {
      Alert.alert("Error", "Failed to update category");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsSaving(true);
    try {
      await catalogActions.removeCategory(categoryToDelete);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      Alert.alert("Success", "Category deleted successfully");
    } catch {
      Alert.alert("Error", "Failed to delete category");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (category: Category) => {
    setCategoryToEdit(category);
    setEditCategoryName(category.name);
    setShowEditModal(true);
  };

  const openDeleteModal = (categoryId: number) => {
    setCategoryToDelete(categoryId);
    setShowDeleteModal(true);
  };

  // Get available predefined categories (excluding existing ones)
  const availablePredefinedCategories = PREDEFINED_CATEGORIES.filter(
    (predefinedCat) => 
      !catalogState.categories.some(
        (existingCat) => existingCat.name.toLowerCase().trim() === predefinedCat.toLowerCase().trim()
      )
  );

  // Handle Auto Fill - bulk create selected categories
  const handleAutoFill = async () => {
    if (selectedPredefinedCategories.size === 0) {
      Alert.alert("No Selection", "Please select at least one category to add");
      return;
    }

    setIsBulkCreating(true);
    try {
      const categoriesToAdd = Array.from(selectedPredefinedCategories);
      let successCount = 0;
      let failCount = 0;

      // Create categories one by one
      for (const categoryName of categoriesToAdd) {
        try {
          await catalogActions.addCategory({ name: categoryName.trim() });
          successCount++;
        } catch (error) {
          console.error(`Failed to create category: ${categoryName}`, error);
          failCount++;
        }
      }

      // Reload categories
      await catalogActions.loadCategories();

      // Close modal and reset
      setShowAutoFillModal(false);
      setSelectedPredefinedCategories(new Set());

      // Show result
      if (failCount === 0) {
        Alert.alert("Success", `Successfully created ${successCount} categor${successCount === 1 ? 'y' : 'ies'}`);
      } else {
        Alert.alert(
          "Partial Success",
          `Created ${successCount} categor${successCount === 1 ? 'y' : 'ies'}. ${failCount} failed.`
        );
      }
    } catch {
      Alert.alert("Error", "Failed to create categories");
    } finally {
      setIsBulkCreating(false);
    }
  };

  const togglePredefinedCategory = (categoryName: string) => {
    const newSelected = new Set(selectedPredefinedCategories);
    if (newSelected.has(categoryName)) {
      newSelected.delete(categoryName);
    } else {
      newSelected.add(categoryName);
    }
    setSelectedPredefinedCategories(newSelected);
  };

  const selectAllPredefined = () => {
    setSelectedPredefinedCategories(new Set(availablePredefinedCategories));
  };

  const deselectAllPredefined = () => {
    setSelectedPredefinedCategories(new Set());
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#277874" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerInfo}>
            <Ionicons name="albums" size={32} color="#8B5CF6" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Category Management</Text>
              <Text style={styles.headerSubtitle}>
                {catalogState.categories.length} {catalogState.categories.length === 1 ? 'category' : 'categories'} total
              </Text>
            </View>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={[styles.headerButton, styles.autoFillHeaderButton]}
              onPress={() => setShowAutoFillModal(true)}
            >
              <Ionicons name="sparkles" size={20} color="#277874" />
              <Text style={styles.autoFillHeaderButtonText}>Auto Fill</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.headerButton, styles.addButton]}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={24} color="#ffffff" />
              <Text style={styles.addButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories List */}
        <View style={styles.categoriesSection}>
          {catalogState.categories.length > 0 ? (
            <View style={styles.categoriesList}>
              {catalogState.categories.map((category, index) => (
                <View key={category.id} style={styles.categoryCard}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryColorDot, { backgroundColor: categoryColors[index % categoryColors.length] }]} />
                    <View style={styles.categoryDetails}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.categoryId}>ID: {category.id}</Text>
                    </View>
                  </View>
                  <View style={styles.categoryActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => openEditModal(category)}
                    >
                      <Ionicons name="create-outline" size={18} color="#277874" />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => openDeleteModal(category.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="folder-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No categories created yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first category to start organizing products
              </Text>
              <TouchableOpacity 
                style={styles.emptyAddButton}
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="add" size={20} color="#ffffff" />
                <Text style={styles.emptyAddButtonText}>Create Category</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Category Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Category</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TouchableOpacity
                style={styles.autoFillButton}
                onPress={() => {
                  setShowAddModal(false);
                  setShowAutoFillModal(true);
                }}
              >
                <Ionicons name="sparkles" size={20} color="#277874" />
                <Text style={styles.autoFillButtonText}>Auto Fill from Predefined Categories</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="Enter category name"
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewCategoryName("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddCategory}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Create Category</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Category</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editCategoryName}
                  onChangeText={setEditCategoryName}
                  placeholder="Enter category name"
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditModal(false);
                  setCategoryToEdit(null);
                  setEditCategoryName("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleEditCategory}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Update Category</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Category Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Category</Text>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.warningIcon}>
                <Ionicons name="warning" size={64} color="#DC2626" />
              </View>
              <Text style={styles.warningText}>
                Are you sure you want to delete this category?
              </Text>
              <Text style={styles.warningSubtext}>
                This action cannot be undone. Products assigned to this category may be affected.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setCategoryToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDeleteCategory}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete Category</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Auto Fill Modal */}
      <Modal
        visible={showAutoFillModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAutoFillModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Auto Fill Categories</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAutoFillModal(false);
                  setSelectedPredefinedCategories(new Set());
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.autoFillDescription}>
                Select predefined categories to add. Categories that already exist are automatically excluded.
              </Text>

              {availablePredefinedCategories.length === 0 ? (
                <View style={styles.emptyPredefinedState}>
                  <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                  <Text style={styles.emptyPredefinedText}>
                    All predefined categories have been added
                  </Text>
                  <Text style={styles.emptyPredefinedSubtext}>
                    You can still add custom categories manually
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.selectAllContainer}>
                    <TouchableOpacity
                      style={styles.selectAllButton}
                      onPress={selectAllPredefined}
                    >
                      <Text style={styles.selectAllText}>Select All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.selectAllButton}
                      onPress={deselectAllPredefined}
                    >
                      <Text style={styles.selectAllText}>Deselect All</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.predefinedList} showsVerticalScrollIndicator={false}>
                    {availablePredefinedCategories.map((categoryName) => {
                      const isSelected = selectedPredefinedCategories.has(categoryName);
                      return (
                        <TouchableOpacity
                          key={categoryName}
                          style={[
                            styles.predefinedCategoryItem,
                            isSelected && styles.predefinedCategoryItemSelected,
                          ]}
                          onPress={() => togglePredefinedCategory(categoryName)}
                        >
                          <View
                            style={[
                              styles.predefinedCategoryCheckbox,
                              isSelected && styles.predefinedCategoryCheckboxSelected,
                            ]}
                          >
                            {isSelected && (
                              <Ionicons name="checkmark" size={18} color="#277874" />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.predefinedCategoryText,
                              isSelected && styles.predefinedCategoryTextSelected,
                            ]}
                          >
                            {categoryName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <Text style={styles.selectedCount}>
                    {selectedPredefinedCategories.size} of {availablePredefinedCategories.length} selected
                  </Text>
                </>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAutoFillModal(false);
                  setSelectedPredefinedCategories(new Set());
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  (availablePredefinedCategories.length === 0 || selectedPredefinedCategories.size === 0) &&
                    styles.modalButtonDisabled,
                ]}
                onPress={handleAutoFill}
                disabled={isBulkCreating || availablePredefinedCategories.length === 0 || selectedPredefinedCategories.size === 0}
              >
                {isBulkCreating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    Add Selected ({selectedPredefinedCategories.size})
                  </Text>
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
  
  // Header Section
  headerSection: {
    marginBottom: 24,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#277874",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  autoFillHeaderButton: {
    backgroundColor: "#F0F9F8",
    borderWidth: 2,
    borderColor: "#277874",
  },
  autoFillHeaderButtonText: {
    color: "#277874",
    fontSize: 16,
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#277874",
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  
  // Categories Section
  categoriesSection: {
    marginBottom: 20,
  },
  categoriesList: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryColorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  categoryId: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  categoryActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButton: {
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
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#DC2626",
  },
  deleteButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
  
  // Empty State
  emptyState: {
    alignItems: "center",
    padding: 60,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyAddButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#277874",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
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
    borderRadius: 20,
    width: width - 40,
    
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#277874",
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#277874",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
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
  saveButton: {
    backgroundColor: "#277874",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  warningIcon: {
    alignItems: "center",
    marginBottom: 16,
  },
  warningText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  warningSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  
  // Auto Fill Styles
  autoFillButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F9F8",
    borderWidth: 2,
    borderColor: "#277874",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  autoFillButtonText: {
    color: "#277874",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  autoFillDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  selectAllContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  selectAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  selectAllText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  predefinedList: {
    maxHeight: 300,
    marginBottom: 12,
  },
  predefinedCategoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  predefinedCategoryItemSelected: {
    backgroundColor: "#F0F9F8",
    borderColor: "#277874",
  },
  predefinedCategoryCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  predefinedCategoryCheckboxSelected: {
    borderColor: "#277874",
    backgroundColor: "#F0F9F8",
  },
  predefinedCategoryText: {
    fontSize: 16,
    color: "#374151",
    flex: 1,
  },
  predefinedCategoryTextSelected: {
    color: "#277874",
    fontWeight: "600",
  },
  selectedCount: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500",
  },
  emptyPredefinedState: {
    alignItems: "center",
    padding: 40,
  },
  emptyPredefinedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyPredefinedSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
});


