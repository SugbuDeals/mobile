/**
 * Promotion Deal Type Form Component
 * Handles all 6 deal types with proper validation
 */

import type { CreatePromotionDto, DealType } from "@/services/api/types/swagger";
import { DEAL_TYPES } from "@/utils/dealTypes";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface PromotionDealTypeFormProps {
  selectedDealType: DealType;
  onDealTypeChange: (dealType: DealType) => void;
  formData: Partial<CreatePromotionDto>;
  onFieldChange: (field: keyof CreatePromotionDto, value: any) => void;
}

export default function PromotionDealTypeForm({
  selectedDealType,
  onDealTypeChange,
  formData,
  onFieldChange,
}: PromotionDealTypeFormProps) {
  const selectedDeal = DEAL_TYPES.find((d) => d.value === selectedDealType);

  return (
    <View style={styles.container}>
      {/* Deal Type Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Deal Type</Text>
        <Text style={styles.sectionSubtitle}>
          Choose the type of promotion you want to create
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dealTypeScroll}>
          {DEAL_TYPES.map((deal) => (
            <TouchableOpacity
              key={deal.value}
              style={[
                styles.dealTypeCard,
                selectedDealType === deal.value && styles.dealTypeCardSelected,
              ]}
              onPress={() => onDealTypeChange(deal.value)}
            >
              <Text
                style={[
                  styles.dealTypeLabel,
                  selectedDealType === deal.value && styles.dealTypeLabelSelected,
                ]}
              >
                {deal.label}
              </Text>
              <Text
                style={[
                  styles.dealTypeDescription,
                  selectedDealType === deal.value && styles.dealTypeDescriptionSelected,
                ]}
                numberOfLines={2}
              >
                {deal.description}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Deal-Specific Fields */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{selectedDeal?.label} Details</Text>
        
        {renderDealTypeFields(selectedDealType, formData, onFieldChange)}
      </View>
    </View>
  );
}

function renderDealTypeFields(
  dealType: DealType,
  formData: Partial<CreatePromotionDto>,
  onFieldChange: (field: keyof CreatePromotionDto, value: any) => void
) {
  switch (dealType) {
    case "PERCENTAGE_DISCOUNT":
      return (
        <View>
          <Text style={styles.label}>Percentage Off (0-100) *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="pricetag-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="25"
              value={formData.percentageOff?.toString() || ""}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                if (value >= 0 && value <= 100) {
                  onFieldChange("percentageOff", value);
                }
              }}
              keyboardType="decimal-pad"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.inputSuffix}>%</Text>
          </View>
          <Text style={styles.helperText}>
            Example: Enter "25" for 25% off
          </Text>
        </View>
      );

    case "FIXED_DISCOUNT":
      return (
        <View>
          <Text style={styles.label}>Fixed Amount Off (₱) *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="cash" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <Text style={styles.inputPrefix}>₱</Text>
            <TextInput
              style={styles.textInput}
              placeholder="10.00"
              value={formData.fixedAmountOff?.toString() || ""}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                if (value > 0) {
                  onFieldChange("fixedAmountOff", value);
                }
              }}
              keyboardType="decimal-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <Text style={styles.helperText}>
            Example: Enter "10" for ₱10 off
          </Text>
        </View>
      );

    case "BOGO":
      return (
        <View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Buy Quantity *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="cart" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="1"
                  value={formData.buyQuantity?.toString() || ""}
                  onChangeText={(text) => {
                    const value = parseInt(text, 10) || 0;
                    if (value > 0) {
                      onFieldChange("buyQuantity", value);
                    }
                  }}
                  keyboardType="number-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.column}>
              <Text style={styles.label}>Get Quantity *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="gift" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="1"
                  value={formData.getQuantity?.toString() || ""}
                  onChangeText={(text) => {
                    const value = parseInt(text, 10) || 0;
                    if (value > 0) {
                      onFieldChange("getQuantity", value);
                    }
                  }}
                  keyboardType="number-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </View>
          <Text style={styles.helperText}>
            Example: Buy 1, Get 1 free (BOGO)
          </Text>
        </View>
      );

    case "BUNDLE":
      return (
        <View>
          <Text style={styles.label}>Bundle Price (₱) *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="pricetags" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <Text style={styles.inputPrefix}>₱</Text>
            <TextInput
              style={styles.textInput}
              placeholder="50.00"
              value={formData.bundlePrice?.toString() || ""}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                if (value > 0) {
                  onFieldChange("bundlePrice", value);
                }
              }}
              keyboardType="decimal-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <Text style={styles.helperText}>
            Fixed price for buying all products together. Requires at least 2 products.
          </Text>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={16} color="#277874" />
            <Text style={styles.infoText}>
              Bundle deals require selecting at least 2 products
            </Text>
          </View>
        </View>
      );

    case "QUANTITY_DISCOUNT":
      return (
        <View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Min Quantity *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="layers" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="3"
                  value={formData.minQuantity?.toString() || ""}
                  onChangeText={(text) => {
                    const value = parseInt(text, 10) || 0;
                    if (value > 1) {
                      onFieldChange("minQuantity", value);
                    }
                  }}
                  keyboardType="number-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.column}>
              <Text style={styles.label}>Discount (%) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="pricetag-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="20"
                  value={formData.quantityDiscount?.toString() || ""}
                  onChangeText={(text) => {
                    const value = parseFloat(text) || 0;
                    if (value >= 0 && value <= 100) {
                      onFieldChange("quantityDiscount", value);
                    }
                  }}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.inputSuffix}>%</Text>
              </View>
            </View>
          </View>
          <Text style={styles.helperText}>
            Example: Buy 3 or more items and get 20% off
          </Text>
        </View>
      );

    case "VOUCHER":
      return (
        <View>
          <Text style={styles.label}>Voucher Value (₱) *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="ticket" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <Text style={styles.inputPrefix}>₱</Text>
            <TextInput
              style={styles.textInput}
              placeholder="50.00"
              value={formData.voucherValue?.toString() || ""}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                if (value > 0) {
                  onFieldChange("voucherValue", value);
                }
              }}
              keyboardType="decimal-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <Text style={styles.helperText}>
            Fixed monetary value like a gift card that can be applied to any product
          </Text>
        </View>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },
  dealTypeScroll: {
    marginHorizontal: -4,
  },
  dealTypeCard: {
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    minWidth: 160,
    maxWidth: 180,
  },
  dealTypeCardSelected: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FFBE5D",
  },
  dealTypeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  dealTypeLabelSelected: {
    color: "#D97706",
  },
  dealTypeDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  dealTypeDescriptionSelected: {
    color: "#92400E",
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
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputPrefix: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginRight: 4,
  },
  inputSuffix: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  column: {
    flex: 1,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2F1",
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#277874",
    fontWeight: "500",
  },
});


