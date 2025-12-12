/**
 * Enhanced Promotions Screen with All 6 Deal Types
 * Features: Create, edit, and manage promotions with comprehensive deal type support
 */

import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import type { DealType, CreatePromotionDto } from "@/services/api/types/swagger";
import type { Promotion } from "@/features/store/promotions/types";
import { validatePromotionData, formatDealDetails, getDealTypeLabel } from "@/utils/dealTypes";
import PromotionDealTypeForm from "@/components/retailers/promotions/PromotionDealTypeForm";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function PromotionsNew() {
  const { state: { user } } = useLogin();
  const {
    action: {
      findProducts,
      createPromotion,
      findActivePromotions,
      updatePromotion,
      findUserStore,
      deletePromotion,
    },
    state: { products, activePromotions, userStore, loading: productsLoading },
  } = useStore();

  // Form state
  const [promotionTitle, setPromotionTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dealType, setDealType] = useState<DealType>("PERCENTAGE_DISCOUNT");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Deal-specific form data
  const [formData, setFormData] = useState<Partial<CreatePromotionDto>>({
    dealType: "PERCENTAGE_DISCOUNT",
  });

  // Date pickers
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Initialize
  useEffect(() => {
    if (user?.id && !userStore) {
      findUserStore(Number(user.id));
    }
  }, [user, userStore, findUserStore]);

  const storeId = userStore?.id;

  useEffect(() => {
    if (!storeId) return;
    findProducts({ storeId });
    findActivePromotions(storeId);
  }, [storeId]);

  // Filter products
  const retailerProducts = React.useMemo(() => {
    if (!storeId) return [];
    return (products || []).filter((product) => product.storeId === storeId);
  }, [products, storeId]);

  const storeActivePromotions = React.useMemo(() => {
    if (!storeId) return [];
    const storeProductIds = new Set(retailerProducts.map((product) => product.id));
    return (activePromotions || []).filter((promotion) =>
      promotion.productId !== null && storeProductIds.has(promotion.productId)
    );
  }, [activePromotions, retailerProducts, storeId]);

  // Get available products (not in active promotions)
  const availableProducts = React.useMemo(() => {
    const promotedProductIds = storeActivePromotions.map((p) => p.productId);
    return retailerProducts.filter((p) => !promotedProductIds.includes(p.id));
  }, [retailerProducts, storeActivePromotions]);

  // Handle field changes
  const handleFieldChange = (field: keyof CreatePromotionDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Toggle product selection
  const toggleProductSelection = (productId: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Date handlers
  const handleStartDateChange = (_event: unknown, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (_event: unknown, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  // Create promotion
  const handleCreatePromotion = async () => {
    // Basic validation
    if (!promotionTitle.trim()) {
      Alert.alert("Error", "Please enter a promotion title");
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert("Error", "Please select start and end dates");
      return;
    }

    if (endDate <= startDate) {
      Alert.alert("Error", "End date must be after start date");
      return;
    }

    if (selectedProductIds.length === 0) {
      Alert.alert("Error", "Please select at least one product");
      return;
    }

    // Build promotion data
    const promotionData: CreatePromotionDto = {
      ...formData,
      title: promotionTitle,
      dealType: dealType,
      description: description || `${getDealTypeLabel(dealType)} - ${formatDealDetails({ ...formData, dealType } as any)}`,
      startsAt: startDate.toISOString(),
      endsAt: endDate.toISOString(),
      productIds: selectedProductIds,
      active: true,
    } as CreatePromotionDto;

    // Validate deal-specific fields
    const validationErrors = validatePromotionData(promotionData);
    if (validationErrors.length > 0) {
      const errorMessages = validationErrors.map((e) => e.message).join("\n");
      Alert.alert("Validation Error", errorMessages);
      return;
    }

    // Bundle deals require at least 2 products
    if (dealType === "BUNDLE" && selectedProductIds.length < 2) {
      Alert.alert("Error", "Bundle deals require at least 2 products");
      return;
    }

    if (!storeId) {
      Alert.alert("Error", "Store not found. Please complete your store setup first.");
      return;
    }

    setIsCreating(true);

    try {
      await createPromotion(promotionData).unwrap();

      // Refresh data
      if (storeId) {
        await findProducts({ storeId });
        await findActivePromotions(storeId);
      }

      // Reset form
      setPromotionTitle("");
      setDescription("");
      setStartDate(new Date());
      setEndDate(new Date());
      setSelectedProductIds([]);
      setFormData({ dealType: "PERCENTAGE_DISCOUNT" });
      setDealType("PERCENTAGE_DISCOUNT");

      Alert.alert("Success", "Promotion created successfully!");
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to create promotion. Please try again.";
      Alert.alert("Error", errorMessage);
      console.error("Error creating promotion:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Delete promotion handler
  const handleDeletePromotion = (promotionId: number, promotionTitle: string) => {
    Alert.alert(
      "Delete Promotion",
      `Are you sure you want to delete "${promotionTitle}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePromotion(promotionId).unwrap();
              if (storeId) {
                await findActivePromotions(storeId);
                await findProducts({ storeId });
              }
              Alert.alert("Success", "Promotion deleted successfully");
            } catch (error: any) {
              Alert.alert("Error", error?.message || "Failed to delete promotion");
            }
          },
        },
      ]
    );
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
          <View style={styles.headerIcon}>
            <Ionicons name="ticket" size={24} color="#ffffff" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Promotions</Text>
            <Text style={styles.headerSubtitle}>Create Amazing Deals</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          {/* Promotion Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Promotion Title *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="create" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Summer Sale"
                value={promotionTitle}
                onChangeText={setPromotionTitle}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="document-text" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Describe your promotion"
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          {/* Deal Type Form */}
          <PromotionDealTypeForm
            selectedDealType={dealType}
            onDealTypeChange={(newDealType) => {
              setDealType(newDealType);
              handleFieldChange("dealType", newDealType);
            }}
            formData={formData}
            onFieldChange={handleFieldChange}
          />

          {/* Promotion Period */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Promotion Period *</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateColumn}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <TouchableOpacity
                  style={[styles.inputContainer, styles.dateInput]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateColumn}>
                <Text style={styles.dateLabel}>End Date</Text>
                <TouchableOpacity
                  style={[styles.inputContainer, styles.dateInput]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Product Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Products *</Text>
            {dealType === "BUNDLE" && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={16} color="#277874" />
                <Text style={styles.infoText}>Bundle deals require at least 2 products</Text>
              </View>
            )}

            {productsLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading products...</Text>
              </View>
            ) : availableProducts.length > 0 ? (
              <View>
                {availableProducts.map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={[styles.productCard, isSelected && styles.productCardSelected]}
                      onPress={() => toggleProductSelection(product.id)}
                    >
                      <View style={styles.checkboxContainer}>
                        <View
                          style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                        >
                          {isSelected && <Ionicons name="checkmark" size={12} color="#ffffff" />}
                        </View>
                      </View>

                      <View style={styles.productImagePlaceholder}>
                        <Ionicons name="cube-outline" size={24} color="#9CA3AF" />
                      </View>

                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productPrice}>₱{product.price}</Text>
                        <Text style={styles.productStock}>Stock: {product.stock}</Text>
                      </View>

                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No products available</Text>
                <Text style={styles.emptySubtext}>
                  All products are in active promotions or add products to your store first
                </Text>
              </View>
            )}

            {/* Selected Count */}
            {selectedProductIds.length > 0 && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedText}>
                  {selectedProductIds.length} product{selectedProductIds.length !== 1 ? "s" : ""} selected
                </Text>
              </View>
            )}
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, isCreating && styles.createButtonDisabled]}
            onPress={handleCreatePromotion}
            disabled={isCreating}
          >
            <Ionicons name="add-circle" size={20} color="#ffffff" style={styles.buttonIcon} />
            <Text style={styles.createButtonText}>
              {isCreating ? "Creating..." : "Create Promotion"}
            </Text>
          </TouchableOpacity>

          {/* Active Promotions */}
          {storeActivePromotions.length > 0 && (
            <View style={styles.activeSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Promotions</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{storeActivePromotions.length}</Text>
                </View>
              </View>

              {storeActivePromotions.map((promo) => {
                const product = retailerProducts.find((p) => p.id === promo.productId);
                if (!product) return null;

                return (
                  <View key={promo.id} style={styles.promotionCard}>
                    <View style={styles.promotionHeader}>
                      <View style={styles.promotionIcon}>
                        <Ionicons name="flame" size={20} color="#FFBE5D" />
                      </View>
                      <View style={styles.promotionInfo}>
                        <Text style={styles.promotionTitle}>{promo.title}</Text>
                        <Text style={styles.promotionProduct}>
                          <Ionicons name="cube" size={12} color="#6B7280" /> {product.name}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.promotionDetails}>
                      <View style={styles.dealTypeBadge}>
                        <Text style={styles.dealTypeText}>{getDealTypeLabel(promo.dealType)}</Text>
                      </View>
                      <View style={styles.dealDetailsBadge}>
                        <Text style={styles.dealDetailsText}>{formatDealDetails(promo)}</Text>
                      </View>
                    </View>

                    {promo.startsAt && promo.endsAt && (
                      <View style={styles.promotionDates}>
                        <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                        <Text style={styles.promotionDatesText}>
                          {formatDate(new Date(promo.startsAt))} - {formatDate(new Date(promo.endsAt))}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeletePromotion(promo.id, promo.title)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ffffff" />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleStartDateChange}
          minimumDate={new Date()}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleEndDateChange}
          minimumDate={startDate}
        />
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
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
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
  content: {
    flex: 1,
    marginTop: -20,
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateColumn: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
  },
  dateInput: {
    flex: 1,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2F1",
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#277874",
    fontWeight: "500",
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  productCardSelected: {
    borderColor: "#10B981",
    backgroundColor: "#F0FDF4",
  },
  checkboxContainer: {
    marginRight: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  checkboxSelected: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  productImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
  productStock: {
    fontSize: 11,
    color: "#6B7280",
  },
  loadingContainer: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyContainer: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 30,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  selectedBadge: {
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  selectedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#FFBE5D",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFBE5D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 8,
  },
  createButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.1,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  activeSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
  },
  countBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D97706",
  },
  promotionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  promotionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  promotionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  promotionInfo: {
    flex: 1,
  },
  promotionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },
  promotionProduct: {
    fontSize: 12,
    color: "#6B7280",
  },
  promotionDetails: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  dealTypeBadge: {
    backgroundColor: "#E0F2F1",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dealTypeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#277874",
  },
  dealDetailsBadge: {
    backgroundColor: "#DBEAFE",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dealDetailsText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E40AF",
  },
  promotionDates: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  promotionDatesText: {
    fontSize: 11,
    color: "#6B7280",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    borderRadius: 8,
    paddingVertical: 8,
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
  },
});

