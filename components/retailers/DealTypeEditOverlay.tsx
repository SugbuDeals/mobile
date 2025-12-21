/**
 * DealTypeEditOverlay Component
 * Overlay modal for editing deal types on the retailer dashboard
 */

import { Modal } from "@/components/Modal";
import PromotionDealTypeForm from "@/components/retailers/promotions/PromotionDealTypeForm";
import { useStore } from "@/features/store";
import type { Promotion } from "@/features/store/promotions/types";
import type { DealType, UpdatePromotionDto } from "@/services/api/types/swagger";
import { validatePromotionData } from "@/utils/dealTypes";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
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
    action: { updatePromotion },
    state: { loading },
  } = useStore();

  const [dealType, setDealType] = useState<DealType>("PERCENTAGE_DISCOUNT");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Deal-specific form data
  const [formData, setFormData] = useState<Partial<UpdatePromotionDto>>({});

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

    // Build update data
    const updateData: UpdatePromotionDto = {
      ...formData,
      title: title.trim(),
      dealType: dealType,
      description: description.trim() || undefined,
      startsAt: startDate.toISOString(),
      endsAt: endDate.toISOString(),
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

  if (!promotion) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Deal Type"
      size="large"
      loading={isUpdating}
      loadingText="Updating deal type..."
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
        <PromotionDealTypeForm
          selectedDealType={dealType}
          onDealTypeChange={setDealType}
          formData={formData}
          onFieldChange={handleFieldChange}
        />

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
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 600,
  },
  fieldContainer: {
    marginBottom: 20,
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
});
