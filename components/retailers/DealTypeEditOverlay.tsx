/**
 * DealTypeEditOverlay Component
 * Overlay modal for editing deal types on the retailer dashboard
 */

import PromotionDealTypeForm from "@/components/retailers/promotions/PromotionDealTypeForm";
import { useStore } from "@/features/store";
import type { Promotion } from "@/features/store/promotions/types";
import type { DealType, UpdatePromotionDto } from "@/services/api/types/swagger";
import { getDealTypeLabel, validatePromotionData } from "@/utils/dealTypes";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

interface DealTypeEditOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  promotion: Promotion | null;
  onUpdate: () => void;
}

export default function DealTypeEditOverlay({
  isOpen,
  onClose,
  promotion,
  onUpdate,
}: DealTypeEditOverlayProps) {
  const {
    action: { updatePromotion, findProducts },
    state: { products, userStore },
  } = useStore();

  const [dealType, setDealType] = useState<DealType>("PERCENTAGE_DISCOUNT");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Product management
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Deal-specific form data
  const [formData, setFormData] = useState<Partial<UpdatePromotionDto>>({});
  
  // Get store products
  const storeProducts = React.useMemo(() => {
    if (!userStore?.id) return [];
    return (products || []).filter((product) => product.storeId === userStore.id);
  }, [products, userStore]);
  
  // Get current products in promotion
  const currentProductIds = React.useMemo(() => {
    if (!promotion) return [];
    const promo = promotion as any;
    
    // Check promotionProducts array first
    if (promo.promotionProducts && Array.isArray(promo.promotionProducts) && promo.promotionProducts.length > 0) {
      return promo.promotionProducts
        .map((pp: any) => pp.productId)
        .filter((id: number) => id != null);
    }
    
    // Check productIds array
    if (promo.productIds && Array.isArray(promo.productIds) && promo.productIds.length > 0) {
      return promo.productIds;
    }
    
    // Fallback to single productId
    if (promo.productId != null) {
      return [promo.productId];
    }
    
    return [];
  }, [promotion]);
  
  // Get available products (not currently selected)
  const availableProducts = React.useMemo(() => {
    return storeProducts.filter((p) => !selectedProductIds.includes(p.id));
  }, [storeProducts, selectedProductIds]);
  
  // Get selected products for display
  const selectedProducts = React.useMemo(() => {
    return storeProducts.filter((p) => selectedProductIds.includes(p.id));
  }, [storeProducts, selectedProductIds]);
  
  // Initialize products when promotion changes
  useEffect(() => {
    if (promotion) {
      setSelectedProductIds(currentProductIds);
    }
  }, [promotion, currentProductIds]);
  
  // Load products when overlay opens
  useEffect(() => {
    if (isOpen && userStore?.id) {
      findProducts({ storeId: userStore.id });
    }
  }, [isOpen, userStore, findProducts]);

  // Initialize form data when promotion changes
  useEffect(() => {
    if (promotion) {
      setTitle(promotion.title || "");
      setDescription(promotion.description || "");
      
      // Parse deal type from promotion - handle both new and legacy formats
      let promoDealType: DealType = "PERCENTAGE_DISCOUNT";
      
      if ((promotion as any).dealType) {
        // New format with dealType field
        promoDealType = (promotion as any).dealType;
      } else if (promotion.type) {
        // Legacy format - convert type to dealType
        const typeStr = String(promotion.type).toUpperCase();
        if (typeStr === "PERCENTAGE" || typeStr.includes("PERCENTAGE")) {
          promoDealType = "PERCENTAGE_DISCOUNT";
        } else if (typeStr === "FIXED" || typeStr.includes("FIXED")) {
          promoDealType = "FIXED_DISCOUNT";
        } else if (typeStr.includes("BOGO")) {
          promoDealType = "BOGO";
        } else if (typeStr.includes("BUNDLE")) {
          promoDealType = "BUNDLE";
        } else if (typeStr.includes("QUANTITY")) {
          promoDealType = "QUANTITY_DISCOUNT";
        } else if (typeStr.includes("VOUCHER")) {
          promoDealType = "VOUCHER";
        }
      }
      
      setDealType(promoDealType);
      
      // Set dates
      if (promotion.startsAt) {
        setStartDate(new Date(promotion.startsAt));
      }
      if (promotion.endsAt) {
        setEndDate(new Date(promotion.endsAt));
      }

      // Set deal-specific fields from promotion
      const updateData: Partial<UpdatePromotionDto> = {};
      const promo = promotion as any;
      
      // Extract all deal-specific fields
      if (promo.percentageOff !== undefined && promo.percentageOff !== null) {
        updateData.percentageOff = Number(promo.percentageOff);
      }
      if (promo.fixedAmountOff !== undefined && promo.fixedAmountOff !== null) {
        updateData.fixedAmountOff = Number(promo.fixedAmountOff);
      }
      if (promo.buyQuantity !== undefined && promo.buyQuantity !== null) {
        updateData.buyQuantity = Number(promo.buyQuantity);
      }
      if (promo.getQuantity !== undefined && promo.getQuantity !== null) {
        updateData.getQuantity = Number(promo.getQuantity);
      }
      if (promo.bundlePrice !== undefined && promo.bundlePrice !== null) {
        updateData.bundlePrice = Number(promo.bundlePrice);
      }
      if (promo.minQuantity !== undefined && promo.minQuantity !== null) {
        updateData.minQuantity = Number(promo.minQuantity);
      }
      if (promo.quantityDiscount !== undefined && promo.quantityDiscount !== null) {
        updateData.quantityDiscount = Number(promo.quantityDiscount);
      }
      if (promo.voucherValue !== undefined && promo.voucherValue !== null) {
        updateData.voucherValue = Number(promo.voucherValue);
      }
      if (promo.voucherQuantity !== undefined && promo.voucherQuantity !== null) {
        updateData.voucherQuantity = Number(promo.voucherQuantity);
      }

      // Handle legacy discount field mapping
      if (promo.discount !== undefined && promo.discount !== null) {
        if (promoDealType === "PERCENTAGE_DISCOUNT" && !updateData.percentageOff) {
          updateData.percentageOff = Number(promo.discount);
        } else if (promoDealType === "FIXED_DISCOUNT" && !updateData.fixedAmountOff) {
          updateData.fixedAmountOff = Number(promo.discount);
        }
      }

      setFormData(updateData);
    }
  }, [promotion]);

  // Handle field changes
  const handleFieldChange = (field: keyof UpdatePromotionDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  // Handle product selection
  const handleAddProduct = (productId: number) => {
    setSelectedProductIds((prev) => [...prev, productId]);
  };
  
  // Handle product removal
  const handleRemoveProduct = (productId: number) => {
    setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
  };

  // Format date for display
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

  // Get icon for deal type
  const getDealIconName = (dealType?: string) => {
    switch (dealType) {
      case "PERCENTAGE_DISCOUNT":
        return "percent-outline" as const;
      case "FIXED_DISCOUNT":
        return "cash-outline" as const;
      case "BOGO":
        return "gift-outline" as const;
      case "BUNDLE":
        return "apps-outline" as const;
      case "QUANTITY_DISCOUNT":
        return "layers-outline" as const;
      case "VOUCHER":
        return "ticket-outline" as const;
      default:
        return "pricetag-outline" as const;
    }
  };

  // Handle update
  const handleUpdate = async () => {
    if (!promotion) return;

    // Basic validation
    if (!title.trim()) {
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

    // Validate product selection
    if (selectedProductIds.length === 0) {
      Alert.alert("Error", "Please select at least one product");
      return;
    }
    
    // Bundle deals require at least 2 products
    if (dealType === "BUNDLE" && selectedProductIds.length < 2) {
      Alert.alert("Error", "Bundle deals require at least 2 products");
      return;
    }

    // Build update data
    const updateData: UpdatePromotionDto = {
      ...formData,
      title: title.trim(),
      dealType: dealType,
      description: description.trim() || undefined,
      startsAt: startDate.toISOString(),
      endsAt: endDate.toISOString(),
      productIds: selectedProductIds, // Include product IDs
    };

    // Validate deal-specific fields
    const validationData = {
      ...updateData,
      dealType,
    } as any;

    const validationErrors = validatePromotionData(validationData);
    if (validationErrors.length > 0) {
      const errorMessages = validationErrors.map((e) => e.message).join("\n");
      Alert.alert("Validation Error", errorMessages);
      return;
    }

    setIsUpdating(true);

    try {
      await updatePromotion({
        id: promotion.id,
        ...updateData,
      }).unwrap();

      Alert.alert("Success", "Deal type updated successfully!");
      onUpdate();
      onClose();
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to update deal type. Please try again.";
      Alert.alert("Error", errorMessage);
      console.error("Error updating promotion:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!promotion || !isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header with Gradient */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderGradient}>
              <View style={styles.modalHeaderTitleRow}>
                {dealType && (
                  <Ionicons 
                    name={getDealIconName(dealType) as any} 
                    size={24} 
                    color="#ffffff" 
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text style={styles.modalHeaderTitle} numberOfLines={2}>
                  {title || "Edit Deal"}
                </Text>
              </View>
              <View style={styles.modalHeaderDiscountContainer}>
                <Text style={styles.modalHeaderDiscount}>
                  {getDealTypeLabel(dealType)}
                </Text>
              </View>
              {description && (
                <Text style={styles.modalHeaderDescription} numberOfLines={2}>
                  {description}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView style={styles.modalFormContent} showsVerticalScrollIndicator={false}>
            <View style={styles.contentContainer}>
              {/* Title Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Promotion Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter promotion title"
                  value={title}
                  onChangeText={setTitle}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Description Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Enter promotion description (optional)"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Date Fields */}
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Start Date *</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#277874" />
                    <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                  </TouchableOpacity>
                  {showStartDatePicker && (
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={handleStartDateChange}
                      minimumDate={new Date()}
                    />
                  )}
                </View>

                <View style={styles.column}>
                  <Text style={styles.label}>End Date *</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#277874" />
                    <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                  </TouchableOpacity>
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
              </View>

              {/* Deal Type Form */}
              <View style={styles.dealTypeFormWrapper}>
                <View style={styles.dealTypeFormContainer} collapsable={false}>
                  <PromotionDealTypeForm
                    selectedDealType={dealType}
                    onDealTypeChange={setDealType}
                    formData={formData}
                    onFieldChange={handleFieldChange}
                  />
                </View>
              </View>

              {/* Product Selection */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Products in Deal *</Text>
                {dealType === "BUNDLE" && (
                  <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={16} color="#277874" />
                    <Text style={styles.infoText}>Bundle deals require at least 2 products</Text>
                  </View>
                )}
                
                {/* Selected Products */}
                {selectedProductIds.length > 0 && (
                  <View style={styles.productsSection}>
                    <Text style={styles.sectionSubtitle}>Products in Deal ({selectedProductIds.length})</Text>
                    {selectedProducts.map((product) => (
                      <View key={product.id} style={styles.productItem}>
                        <View style={styles.productInfo}>
                          <Ionicons name="cube-outline" size={20} color="#277874" style={styles.productIcon} />
                          <View style={styles.productDetails}>
                            <Text style={styles.productName} numberOfLines={1}>
                              {product.name}
                            </Text>
                            <Text style={styles.productPrice}>₱{Number(product.price).toFixed(2)}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemoveProduct(product.id)}
                        >
                          <Ionicons name="close-circle" size={24} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                
                {/* Available Products */}
                {availableProducts.length > 0 && (
                  <View style={styles.productsSection}>
                    <Text style={styles.sectionSubtitle}>
                      Available Products ({availableProducts.length})
                    </Text>
                    {availableProducts.map((product) => (
                      <TouchableOpacity
                        key={product.id}
                        style={styles.productItem}
                        onPress={() => handleAddProduct(product.id)}
                      >
                        <View style={styles.productInfo}>
                          <Ionicons name="cube-outline" size={20} color="#9CA3AF" style={styles.productIcon} />
                          <View style={styles.productDetails}>
                            <Text style={styles.productName} numberOfLines={1}>
                              {product.name}
                            </Text>
                            <Text style={styles.productPrice}>₱{Number(product.price).toFixed(2)}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.addButton}
                          onPress={() => handleAddProduct(product.id)}
                        >
                          <Ionicons name="add-circle" size={24} color="#10B981" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                {availableProducts.length === 0 && selectedProductIds.length > 0 && (
                  <View style={styles.emptyProductsBox}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    <Text style={styles.emptyProductsText}>All products are included in this deal</Text>
                  </View>
                )}
                
                {storeProducts.length === 0 && (
                  <View style={styles.emptyProductsBox}>
                    <Ionicons name="cube-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.emptyProductsText}>No products available. Add products to your store first.</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                  disabled={isUpdating}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.updateButton]}
                  onPress={handleUpdate}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Text style={styles.updateButtonText}>Updating...</Text>
                  ) : (
                    <Text style={styles.updateButtonText}>Update Deal</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    position: "relative",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  modalHeaderGradient: {
    backgroundColor: "#FFBE5D",
    paddingVertical: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  modalHeaderTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
  },
  modalHeaderDiscountContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 6,
  },
  modalHeaderDiscount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#277874",
  },
  modalHeaderDescription: {
    fontSize: 14,
    fontWeight: "400",
    color: "#ffffff",
    marginTop: 12,
    opacity: 0.95,
    lineHeight: 20,
  },
  modalCloseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modalCloseText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#277874",
  },
  modalFormContent: {
    maxHeight: 500,
  },
  contentContainer: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  dealTypeFormWrapper: {
    width: "100%",
    marginTop: 8,
    marginBottom: 8,
    alignItems: "stretch",
  },
  dealTypeFormContainer: {
    width: "100%",
    alignSelf: "stretch",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#374151",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  column: {
    flex: 1,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  updateButton: {
    backgroundColor: "#277874",
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
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
  productsSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  productInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  productIcon: {
    marginRight: 12,
  },
  productDetails: {
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
  addButton: {
    padding: 4,
  },
  removeButton: {
    padding: 4,
  },
  emptyProductsBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 16,
    gap: 12,
    marginTop: 12,
  },
  emptyProductsText: {
    flex: 1,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
});
