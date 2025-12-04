import { logout } from "@/features/auth/slice";
import { useAppDispatch } from "@/store/hooks";
import { useCatalog } from "@/features/catalog";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const SETTINGS_STORAGE_KEY = "@admin_settings";

interface AdminSettingsData {
  aiResponse: string;
  searchRadius: string;
  minDiscount: string;
  maxResults: string;
}

// ===== MAIN COMPONENT =====
export default function AdminSettings() {
  const dispatch = useAppDispatch();
  const { state: catalogState, action: catalogActions } = useCatalog();
  
  // State management for all form inputs
  const [aiResponse, setAiResponse] = useState("");
  const [searchRadius, setSearchRadius] = useState("25");
  const [minDiscount, setMinDiscount] = useState("10");
  const [maxResults, setMaxResults] = useState("50");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<AdminSettingsData | null>(null);
  
  // Category management state
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<any>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  
  const categoryColors = [
    "#277874", "#FFBE5D", "#8B5CF6", "#F87171", "#60A5FA", 
    "#F59E0B", "#1E40AF", "#10B981", "#EF4444", "#06B6D4"
  ];

  // Load settings and categories on mount
  useEffect(() => {
    loadSettings();
    catalogActions.loadCategories();
  }, []);

  // Track changes
  useEffect(() => {
    if (originalSettings) {
      const current = { aiResponse, searchRadius, minDiscount, maxResults };
      const changed = JSON.stringify(current) !== JSON.stringify(originalSettings);
      setHasChanges(changed);
    }
  }, [aiResponse, searchRadius, minDiscount, maxResults, originalSettings]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const saved = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const settings: AdminSettingsData = JSON.parse(saved);
        setAiResponse(settings.aiResponse || "");
        setSearchRadius(settings.searchRadius || "25");
        setMinDiscount(settings.minDiscount || "10");
        setMaxResults(settings.maxResults || "50");
        setOriginalSettings(settings);
      } else {
        // Set defaults
        const defaults = {
          aiResponse: "",
          searchRadius: "25",
          minDiscount: "10",
          maxResults: "50",
        };
        setOriginalSettings(defaults);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      Alert.alert("Error", "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  // Event handlers
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validate numeric inputs
      const radius = parseFloat(searchRadius);
      const discount = parseFloat(minDiscount);
      const results = parseFloat(maxResults);
      
      if (isNaN(radius) || radius <= 0) {
        Alert.alert("Validation Error", "Search radius must be a positive number");
        return;
      }
      
      if (isNaN(discount) || discount < 0 || discount > 100) {
        Alert.alert("Validation Error", "Minimum discount must be between 0 and 100");
        return;
      }
      
      if (isNaN(results) || results <= 0) {
        Alert.alert("Validation Error", "Max results must be a positive number");
        return;
      }

      const settings: AdminSettingsData = {
        aiResponse: aiResponse.trim(),
        searchRadius: searchRadius.trim(),
        minDiscount: minDiscount.trim(),
        maxResults: maxResults.trim(),
      };

      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      setOriginalSettings(settings);
      setHasChanges(false);
      Alert.alert("Success", "Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      Alert.alert("Error", "Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              if (originalSettings) {
                setAiResponse(originalSettings.aiResponse);
                setSearchRadius(originalSettings.searchRadius);
                setMinDiscount(originalSettings.minDiscount);
                setMaxResults(originalSettings.maxResults);
                setHasChanges(false);
              }
            },
          },
        ]
      );
    }
  };
  
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            // Dispatch logout action to clear Redux state
            dispatch(logout());
            // Navigate back to login screen
            router.replace("/auth/login");
          }
        }
      ]
    );
  };

  // Category management functions
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Error", "Category name is required");
      return;
    }

    setIsSavingCategory(true);
    try {
      await catalogActions.addCategory({ name: newCategoryName.trim() });
      setShowAddCategoryModal(false);
      setNewCategoryName("");
      Alert.alert("Success", "Category created successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to create category");
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editCategoryName.trim()) {
      Alert.alert("Error", "Category name is required");
      return;
    }

    if (!categoryToEdit) return;

    setIsSavingCategory(true);
    try {
      await catalogActions.editCategory(categoryToEdit.id, { name: editCategoryName.trim() });
      setShowEditCategoryModal(false);
      setCategoryToEdit(null);
      setEditCategoryName("");
      Alert.alert("Success", "Category updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update category");
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsSavingCategory(true);
    try {
      await catalogActions.removeCategory(categoryToDelete);
      setShowDeleteCategoryModal(false);
      setCategoryToDelete(null);
      Alert.alert("Success", "Category deleted successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to delete category");
    } finally {
      setIsSavingCategory(false);
    }
  };

  const openEditCategoryModal = (category: any) => {
    setCategoryToEdit(category);
    setEditCategoryName(category.name);
    setShowEditCategoryModal(true);
  };

  const openDeleteCategoryModal = (categoryId: number) => {
    setCategoryToDelete(categoryId);
    setShowDeleteCategoryModal(true);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#277874" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <AIConfigurationCard 
          aiResponse={aiResponse}
          setAiResponse={setAiResponse}
          searchRadius={searchRadius}
          setSearchRadius={setSearchRadius}
        />
        
        <DealFinderSettingsCard
          minDiscount={minDiscount}
          setMinDiscount={setMinDiscount}
          maxResults={maxResults}
          setMaxResults={setMaxResults}
        />
        
        <ActionButtons 
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={isSaving}
          hasChanges={hasChanges}
        />
        
        <CategoryManagementCard
          categories={catalogState.categories}
          categoryColors={categoryColors}
          onAdd={() => setShowAddCategoryModal(true)}
          onEdit={openEditCategoryModal}
          onDelete={openDeleteCategoryModal}
        />
        
        <LogoutButton onLogout={handleLogout} />
      </ScrollView>

      {/* Add Category Modal */}
      <Modal
        visible={showAddCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Category</Text>
              <TouchableOpacity
                onPress={() => setShowAddCategoryModal(false)}
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
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="Enter category name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddCategoryModal(false);
                  setNewCategoryName("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddCategory}
                disabled={isSavingCategory}
              >
                {isSavingCategory ? (
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
        visible={showEditCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Category</Text>
              <TouchableOpacity
                onPress={() => setShowEditCategoryModal(false)}
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
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditCategoryModal(false);
                  setCategoryToEdit(null);
                  setEditCategoryName("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleEditCategory}
                disabled={isSavingCategory}
              >
                {isSavingCategory ? (
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
        visible={showDeleteCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDeleteCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Category</Text>
              <TouchableOpacity
                onPress={() => setShowDeleteCategoryModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.warningIcon}>
                <Ionicons name="warning" size={48} color="#DC2626" />
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
                  setShowDeleteCategoryModal(false);
                  setCategoryToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDeleteCategory}
                disabled={isSavingCategory}
              >
                {isSavingCategory ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete Category</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ===== SUB-COMPONENTS =====

// AI Configuration Card Component
const AIConfigurationCard = ({ 
  aiResponse, 
  setAiResponse, 
  searchRadius, 
  setSearchRadius 
}: {
  aiResponse: string;
  setAiResponse: (value: string) => void;
  searchRadius: string;
  setSearchRadius: (value: string) => void;
}) => (
  <View style={styles.settingsCard}>
    <Text style={styles.sectionTitle}>AI Configuration</Text>
    
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Describe what A.i would response</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter AI response description..."
        value={aiResponse}
        onChangeText={setAiResponse}
        placeholderTextColor="#9CA3AF"
        multiline
      />
    </View>
    
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Deal Search Radius (miles)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="25"
        value={searchRadius}
        onChangeText={setSearchRadius}
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
      />
    </View>
  </View>
);

// Deal Finder Settings Card Component
const DealFinderSettingsCard = ({ 
  minDiscount, 
  setMinDiscount, 
  maxResults, 
  setMaxResults 
}: {
  minDiscount: string;
  setMinDiscount: (value: string) => void;
  maxResults: string;
  setMaxResults: (value: string) => void;
}) => (
  <View style={styles.settingsCard}>
    <View style={styles.sectionHeader}>
      <Ionicons name="search" size={20} color="#20B2AA" />
      <Text style={styles.sectionTitle}>Deal Finder Settings</Text>
    </View>
    
    <View style={styles.inputRow}>
      <View style={styles.inputGroupHalf}>
        <Text style={styles.inputLabel}>Minimum Discount %</Text>
        <TextInput
          style={styles.textInput}
          placeholder="10"
          value={minDiscount}
          onChangeText={setMinDiscount}
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>
      
      <View style={[styles.inputGroupHalf, { marginRight: 0 }]}>
        <Text style={styles.inputLabel}>Max Results per Search</Text>
        <TextInput
          style={styles.textInput}
          placeholder="50"
          value={maxResults}
          onChangeText={setMaxResults}
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>
    </View>
  </View>
);

// Action Buttons Component
const ActionButtons = ({ 
  onSave, 
  onCancel,
  isSaving,
  hasChanges
}: {
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  hasChanges: boolean;
}) => (
  <View style={styles.buttonContainer}>
    <TouchableOpacity 
      style={[
        styles.saveButton, 
        (!hasChanges || isSaving) && styles.saveButtonDisabled
      ]} 
      onPress={onSave}
      disabled={!hasChanges || isSaving}
    >
      {isSaving ? (
        <>
          <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>Saving...</Text>
        </>
      ) : (
        <Text style={styles.saveButtonText}>Save Changes</Text>
      )}
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[
        styles.cancelButton,
        !hasChanges && styles.cancelButtonDisabled
      ]} 
      onPress={onCancel}
      disabled={!hasChanges}
    >
      <Text style={[
        styles.cancelButtonText,
        !hasChanges && styles.cancelButtonTextDisabled
      ]}>Cancel</Text>
    </TouchableOpacity>
  </View>
);

// Category Management Card Component
const CategoryManagementCard = ({
  categories,
  categoryColors,
  onAdd,
  onEdit,
  onDelete,
}: {
  categories: any[];
  categoryColors: string[];
  onAdd: () => void;
  onEdit: (category: any) => void;
  onDelete: (categoryId: number) => void;
}) => (
  <View style={styles.settingsCard}>
    <View style={styles.sectionHeader}>
      <Ionicons name="albums" size={20} color="#8B5CF6" />
      <Text style={styles.sectionTitle}>Category Management</Text>
      <TouchableOpacity 
        style={styles.addCategoryButton}
        onPress={onAdd}
      >
        <Ionicons name="add" size={20} color="#1f2937" />
      </TouchableOpacity>
    </View>
    
    <View style={styles.categoriesList}>
      {categories.length > 0 ? (
        categories.map((category, index) => (
          <View key={category.id} style={styles.categoryCard}>
            <View style={styles.categoryInfo}>
              <View style={[styles.categoryColorDot, { backgroundColor: categoryColors[index % categoryColors.length] }]} />
              <Text style={styles.categoryName}>{category.name}</Text>
            </View>
            <View style={styles.categoryActions}>
              <TouchableOpacity 
                style={styles.categoryActionButton}
                onPress={() => onEdit(category)}
              >
                <Ionicons name="create-outline" size={18} color="#277874" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.categoryActionButton}
                onPress={() => onDelete(category.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyCategoriesState}>
          <Ionicons name="folder-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyCategoriesText}>No categories created yet</Text>
          <Text style={styles.emptyCategoriesSubtext}>
            Create your first category to start organizing products
          </Text>
        </View>
      )}
    </View>
  </View>
);

// Logout Button Component
const LogoutButton = ({ 
  onLogout 
}: {
  onLogout: () => void;
}) => (
  <View style={styles.logoutContainer}>
    <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
      <Ionicons name="log-out-outline" size={20} color="#DC2626" />
      <Text style={styles.logoutButtonText}>Logout</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  // ===== MAIN LAYOUT STYLES =====
  // Used by: Main AdminSettings component
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // Light gray background
  },
  content: {
    flex: 1,
    paddingHorizontal: 20, // Side padding for content
    paddingTop: 20, // Top padding
  },
  
  // ===== SETTINGS CARD STYLES =====
  // Used by: AIConfigurationCard, DealFinderSettingsCard
  settingsCard: {
    backgroundColor: "#ffffff", // White card background
    borderRadius: 16, // Rounded corners
    padding: 24, // Internal padding
    shadowColor: "#277874", // Shadow for depth
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5, // Android shadow
    marginBottom: 20, // Space between cards
  },
  
  // ===== SECTION HEADER STYLES =====
  // Used by: DealFinderSettingsCard header with icon
  sectionHeader: {
    flexDirection: "row", // Horizontal layout
    alignItems: "center", // Center vertically
    marginBottom: 20, // Space below header
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold", // Bold text
    color: "#277874", // Teal text
    marginLeft: 8, // Space after icon
  },
  
  // ===== INPUT FORM STYLES =====
  // Used by: AIConfigurationCard, DealFinderSettingsCard
  inputGroup: {
    marginBottom: 24, // Space between input groups
  },
  inputGroupHalf: {
    flex: 1, // Take half width
    marginRight: 16, // Space between half-width inputs
  },
  inputRow: {
    flexDirection: "row", // Horizontal layout for half-width inputs
    justifyContent: "space-between", // Distribute space
    alignItems: "flex-start", // Align to top
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600", // Semi-bold
    color: "#374151", // Medium gray
    marginBottom: 8, // Space above input
  },
  textInput: {
    backgroundColor: "#ffffff", // White background
    borderWidth: 1,
    borderColor: "#277874", // Teal border
    borderRadius: 8, // Rounded corners
    paddingHorizontal: 16, // Horizontal padding
    paddingVertical: 14, // Vertical padding
    fontSize: 16,
    color: "#1F2937", // Dark text
    minHeight: 52, // Minimum height
    textAlignVertical: "top", // Text starts at top for multiline
  },
  
  // ===== ACTION BUTTON STYLES =====
  // Used by: ActionButtons component (Save/Cancel)
  buttonContainer: {
    flexDirection: "row", // Horizontal layout
    justifyContent: "space-between", // Space between buttons
    marginTop: 0, // No top margin
    marginBottom: 20, // Bottom margin
  },
  saveButton: {
    backgroundColor: "#277874", // Teal background
    paddingHorizontal: 24, // Horizontal padding
    paddingVertical: 12, // Vertical padding
    borderRadius: 8, // Rounded corners
    flex: 1, // Take available space
    marginRight: 12, // Space before cancel button
    alignItems: "center", // Center content
  },
  saveButtonText: {
    color: "#ffffff", // White text
    fontSize: 16,
    fontWeight: "600", // Semi-bold
  },
  cancelButton: {
    backgroundColor: "#ffffff", // White background
    borderWidth: 1,
    borderColor: "#277874", // Teal border
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1, // Take available space
    alignItems: "center", // Center content
  },
  cancelButtonText: {
    color: "#277874", // Teal text
    fontSize: 16,
    fontWeight: "600", // Semi-bold
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonTextDisabled: {
    color: "#9CA3AF",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  
  // ===== LOGOUT BUTTON STYLES =====
  // Used by: LogoutButton component
  logoutContainer: {
    marginBottom: 20, // Bottom margin
  },
  logoutButton: {
    backgroundColor: "#ffffff", // White background
    borderWidth: 1,
    borderColor: "#FEE2E2", // Light red border
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row", // Horizontal layout for icon + text
    alignItems: "center", // Center vertically
    justifyContent: "center", // Center horizontally
  },
  logoutButtonText: {
    color: "#DC2626", // Red text
    fontSize: 16,
    fontWeight: "600", // Semi-bold
    marginLeft: 8, // Space after icon
  },
  
  // ===== CATEGORY MANAGEMENT STYLES =====
  categoriesList: {
    gap: 12,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  categoryActions: {
    flexDirection: "row",
    gap: 8,
  },
  categoryActionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  addCategoryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFBE5D",
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  emptyCategoriesState: {
    alignItems: "center",
    padding: 40,
  },
  emptyCategoriesText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 12,
    marginBottom: 8,
  },
  emptyCategoriesSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  
  // ===== MODAL STYLES =====
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
    maxHeight: "80%",
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
  deleteButton: {
    backgroundColor: "#DC2626",
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  warningIcon: {
    alignItems: "center",
    marginBottom: 16,
  },
  warningText: {
    fontSize: 16,
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
});
