import { useCatalog } from "@/features/catalog";
import { useStore } from "@/features/store";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const { width } = Dimensions.get("window");

// Color palette for categories
const categoryColors = [
  "#277874", "#FFBE5D", "#8B5CF6", "#F87171", "#60A5FA", 
  "#F59E0B", "#1E40AF", "#10B981", "#EF4444", "#06B6D4"
];

// SVG Pie Chart Component
const SimpleChart = ({ categories }: { categories: Array<{ name: string; percentage: number; color: string }> }) => {
  const size = 120;
  const radius = size / 2;
  const centerX = radius;
  const centerY = radius;
  const innerRadius = 30;
  const outerRadius = 60;
  
  let cumulativeFraction = 0;
  
  const createArcPath = (startAngle: number, endAngle: number, innerR: number, outerR: number) => {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + innerR * Math.cos(startAngleRad);
    const y1 = centerY + innerR * Math.sin(startAngleRad);
    const x2 = centerX + outerR * Math.cos(startAngleRad);
    const y2 = centerY + outerR * Math.sin(startAngleRad);
    const x3 = centerX + outerR * Math.cos(endAngleRad);
    const y3 = centerY + outerR * Math.sin(endAngleRad);
    const x4 = centerX + innerR * Math.cos(endAngleRad);
    const y4 = centerY + innerR * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return [
      `M ${x1} ${y1}`,
      `L ${x2} ${y2}`,
      `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x3} ${y3}`,
      `L ${x4} ${y4}`,
      `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x1} ${y1}`,
      'Z'
    ].join(' ');
  };

  return (
    <View style={styles.chartVisual}>
      <Svg width={size} height={size}>
        {categories.map((category, index) => {
          const segmentFraction = Math.max(0, Math.min(1, category.percentage / 100));
          const startAngle = (cumulativeFraction * 360) - 90;
          const endAngle = ((cumulativeFraction + segmentFraction) * 360) - 90;
          
          const pathData = createArcPath(startAngle, endAngle, innerRadius, outerRadius);
          cumulativeFraction += segmentFraction;
          
          return (
            <Path
              key={index}
              d={pathData}
              fill={category.color}
            />
          );
        })}
      </Svg>
      <View style={styles.chartCenter}>
        <Text style={styles.chartCenterText}>100%</Text>
      </View>
    </View>
  );
};

// Metrics Cards Component
const MetricsCard = ({ label, value, icon, color, bgColor }: {
  label: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
}) => (
  <View style={styles.metricCard}>
    <View style={styles.metricHeader}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={[styles.metricIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
    </View>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
  </View>
);

export default function DealsAnalytics() {
  const { state: storeState, action: storeActions } = useStore();
  const { state: catalogState, action: catalogActions } = useCatalog();
  const [isLoading, setIsLoading] = useState(true);
  const [promotionStatusLoading, setPromotionStatusLoading] = useState<Record<number, boolean>>({});
  
  // Category management state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<any>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch promotions, products, and categories data
    storeActions.findPromotions();
    storeActions.findProducts();
    catalogActions.loadCategories();
    
    // Set loading to false after a short delay
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Calculate metrics from real data
  const totalDeals = storeState.promotions.length;
  const activeDeals = storeState.promotions.filter(promotion => promotion.active).length;
  
  // Calculate average discount
  const totalDiscount = storeState.promotions.reduce((sum, promotion) => {
    return sum + (promotion.discount || 0);
  }, 0);
  const averageDiscount = totalDeals > 0 ? (totalDiscount / totalDeals).toFixed(1) : "0.0";

  const handleTogglePromotionActive = async (promotionId: number, nextValue: boolean) => {
    setPromotionStatusLoading((prev) => ({ ...prev, [promotionId]: true }));
    try {
      await storeActions.updatePromotion({ id: promotionId, active: nextValue }).unwrap();
      Alert.alert("Success", `Promotion has been ${nextValue ? "enabled" : "disabled"}.`);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update promotion status.");
    } finally {
      setPromotionStatusLoading((prev) => ({ ...prev, [promotionId]: false }));
    }
  };

  // Calculate category distribution from real data
  const calculateCategoryDistribution = () => {
    if (!storeState.products.length || !catalogState.categories.length) {
      return [];
    }

    // Count products by category
    const categoryCounts = new Map<number, number>();
    storeState.products.forEach((product) => {
      const rawCategoryId = (product as any)?.categoryId ?? (product as any)?.category?.id;
      if (rawCategoryId === null || rawCategoryId === undefined) {
        return;
      }

      const categoryId = Number(rawCategoryId);
      categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + 1);
    });

    const totalProductsWithCategories = Array.from(categoryCounts.values()).reduce((sum, count) => sum + count, 0);

    if (totalProductsWithCategories === 0) {
      return [];
    }

    return Array.from(categoryCounts.entries())
      .map(([categoryId, count], index) => {
        const category = catalogState.categories.find((cat) => String(cat.id) === String(categoryId));
        const percentage = (count / totalProductsWithCategories) * 100;

        return {
          name: category?.name || `Category ${categoryId}`,
          percentage: Math.round(percentage * 10) / 10,
          color: categoryColors[index % categoryColors.length],
          count,
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  };

  const categoryDistribution = calculateCategoryDistribution();

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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      Alert.alert("Error", "Failed to delete category");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (category: any) => {
    setCategoryToEdit(category);
    setEditCategoryName(category.name);
    setShowEditModal(true);
  };

  const openDeleteModal = (categoryId: number) => {
    setCategoryToDelete(categoryId);
    setShowDeleteModal(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#277874" />
        <Text style={styles.loadingText}>Loading deals analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Key Metrics Cards */}
        <View style={styles.metricsSection}>
          <View style={styles.metricsGrid}>
            <MetricsCard
              label="Total Deals"
              value={totalDeals.toLocaleString()}
              icon="flame"
              color="#277874"
              bgColor="#e0f2f1"
            />
            <MetricsCard
              label="Active Deals"
              value={activeDeals.toLocaleString()}
              icon="pricetag"
              color="#FFBE5D"
              bgColor="#fef3c7"
            />
          </View>
          <View style={styles.fullWidthCard}>
            <View style={styles.fullWidthMetricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Avg Discount</Text>
                <View style={[styles.metricIcon, { backgroundColor: "#e0f2f1" }]}>
                  <Ionicons name="trending-up" size={20} color="#277874" />
                </View>
              </View>
              <Text style={[styles.metricValue, { color: "#277874" }]}>{averageDiscount}%</Text>
            </View>
          </View>
        </View>

        {/* Deal Categories Distribution Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deal Categories Distribution</Text>
          
          <View style={styles.chartContainer}>
            <View style={styles.chartLabels}>
              <Text style={styles.chartLabel}>Pie Graph</Text>
              <Text style={styles.chartLabel}>Categories</Text>
            </View>
            
            <View style={styles.chartContent}>
              <View style={styles.chartVisual}>
                <SimpleChart categories={categoryDistribution} />
              </View>
              
              <View style={styles.legendContainer}>
                {categoryDistribution.length > 0 ? (
                  categoryDistribution.map((category, index) => (
                    <View key={index} style={styles.legendItem}>
                      <View style={[styles.legendBullet, { backgroundColor: category.color }]} />
                      <Text style={styles.legendText}>
                        {category.name} ({category.percentage}%)
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No category data available</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Categories will appear here once products are assigned to categories
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Quick Promotion Management */}
          <View style={styles.promotionManageSection}>
            <Text style={styles.sectionSubtitle}>Manage Promotions</Text>
            {storeState.promotions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="pricetag-outline" size={40} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>No promotions available</Text>
              </View>
            ) : (
              <View style={styles.promotionList}>
                {storeState.promotions.slice(0, 5).map((promotion) => (
                  <View key={promotion.id} style={styles.promotionCard}>
                    <View style={styles.promotionInfo}>
                      <Text style={styles.promotionTitle} numberOfLines={1}>
                        {promotion.title}
                      </Text>
                      <Text style={styles.promotionSub} numberOfLines={1}>
                        {promotion.description}
                      </Text>
                    </View>
                    <View style={styles.promotionStatusRow}>
                      <Text style={styles.promotionStatusLabel}>
                        {promotion.active ? "Active" : "Disabled"}
                      </Text>
                      <Switch
                        value={!!promotion.active}
                        onValueChange={(value) => handleTogglePromotionActive(promotion.id, value)}
                        trackColor={{ false: "#FECACA", true: "#A7F3D0" }}
                        thumbColor="#FFFFFF"
                        disabled={!!promotionStatusLoading[promotion.id]}
                      />
                      {promotionStatusLoading[promotion.id] && (
                        <ActivityIndicator size="small" color="#277874" style={styles.promotionSpinner} />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Categories Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories Management</Text>
            <TouchableOpacity 
              style={styles.addCategoryButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={20} color="#1f2937" />
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesList}>
            {catalogState.categories.length > 0 ? (
              catalogState.categories.map((category, index) => (
                <View key={category.id} style={styles.categoryCard}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryColorDot, { backgroundColor: categoryColors[index % categoryColors.length] }]} />
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                  <View style={styles.categoryActions}>
                    <TouchableOpacity 
                      style={styles.categoryActionButton}
                      onPress={() => openEditModal(category)}
                    >
                      <Ionicons name="create-outline" size={18} color="#277874" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.categoryActionButton}
                      onPress={() => openDeleteModal(category.id)}
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
        animationType="slide"
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
  
  // ===== METRICS SECTION =====
  metricsSection: {
    marginBottom: 24,
    marginTop: 20,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  fullWidthCard: {
    width: "100%",
    marginBottom: 0,
  },
  fullWidthMetricCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  metricCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  metricValue: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1F2937",
  },

  // ===== PROMOTION MANAGEMENT SECTION =====
  promotionManageSection: {
    marginTop: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 8,
  },
  promotionList: {
    gap: 8,
  },
  promotionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  promotionInfo: {
    flex: 1,
    paddingRight: 8,
  },
  promotionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  promotionSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  promotionStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  promotionStatusLabel: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  promotionSpinner: {
    marginLeft: 4,
  },
  
  // ===== DEAL CATEGORIES SECTION =====
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#277874",
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  chartLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  chartContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chartVisual: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  chartCenterText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1F2937",
  },
  chartCenter: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendContainer: {
    flex: 1,
    marginLeft: 20,
  },
  legendBullet: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },

  // ===== LOADING STYLES =====
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

  // ===== EMPTY STATE STYLES =====
  emptyState: {
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },

  // ===== CATEGORIES LIST STYLES =====
  categoriesList: {
    gap: 12,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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

  // ===== CATEGORY MANAGEMENT STYLES =====
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addCategoryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFBE5D",
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryActions: {
    flexDirection: "row",
    gap: 8,
  },
  categoryActionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f0f9f8",
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
