/**
 * Enhanced Promotions Screen with All 6 Deal Types
 * Features: Create, edit, and manage promotions with comprehensive deal type support
 */

import PromotionDealTypeForm from "@/components/retailers/promotions/PromotionDealTypeForm";
import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import type { CreatePromotionDto, DealType } from "@/services/api/types/swagger";
import { formatDealDetails, getDealTypeLabel, validatePromotionData } from "@/utils/dealTypes";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
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

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "upcoming" | "expired">("all");
  const [sortBy, setSortBy] = useState<"date" | "title" | "type">("date");
  
  // View mode and detail modal state
  const [viewMode, setViewMode] = useState<"detailed" | "compact">("detailed");
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Open promotion details
  const openPromotionDetails = (promo: any) => {
    setSelectedPromotion(promo);
    setShowDetailsModal(true);
  };

  // Close promotion details
  const closePromotionDetails = () => {
    setShowDetailsModal(false);
    setSelectedPromotion(null);
  };

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
    return (activePromotions || []).filter((promotion) => {
      // Check if promotion has products from this store
      // First check promotionProducts array (for multi-product promotions)
      if (promotion.promotionProducts && Array.isArray(promotion.promotionProducts) && promotion.promotionProducts.length > 0) {
        return promotion.promotionProducts.some((pp: any) => 
          pp.productId && storeProductIds.has(pp.productId)
        );
      }
      // Fallback to single productId for backward compatibility
      return promotion.productId !== null && promotion.productId !== undefined && storeProductIds.has(promotion.productId as number);
    });
  }, [activePromotions, retailerProducts, storeId]);

  // Helper to check promotion status
  const getPromotionStatus = (promo: any): "active" | "upcoming" | "expired" => {
    const now = new Date();
    const start = promo.startsAt ? new Date(promo.startsAt) : null;
    const end = promo.endsAt ? new Date(promo.endsAt) : null;

    if (start && start > now) return "upcoming";
    if (end && end < now) return "expired";
    return "active";
  };

  // Filtered and sorted promotions
  const filteredPromotions = React.useMemo(() => {
    let filtered = storeActivePromotions;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((promo) => {
        const product = retailerProducts.find((p) => p.id === promo.productId);
        return (
          promo.title.toLowerCase().includes(query) ||
          (product && product.name.toLowerCase().includes(query)) ||
          (promo.description && promo.description.toLowerCase().includes(query))
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((promo) => getPromotionStatus(promo) === statusFilter);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "date") {
        const dateA = a.startsAt ? new Date(a.startsAt).getTime() : 0;
        const dateB = b.startsAt ? new Date(b.startsAt).getTime() : 0;
        return dateB - dateA; // Most recent first
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "type") {
        return a.dealType.localeCompare(b.dealType);
      }
      return 0;
    });

    return filtered;
  }, [storeActivePromotions, searchQuery, statusFilter, sortBy, retailerProducts]);

  // Get all product IDs that are in active promotions (for filtering/display)
  const promotedProductIds = React.useMemo(() => {
    const productIds = new Set<number>();
    
    storeActivePromotions.forEach((promotion) => {
      // If promotion has promotionProducts array, add all product IDs
      if (promotion.promotionProducts && Array.isArray(promotion.promotionProducts) && promotion.promotionProducts.length > 0) {
        promotion.promotionProducts.forEach((pp: any) => {
          if (pp.productId) {
            productIds.add(pp.productId);
          }
        });
      }
      // Also add the single productId if present (for backward compatibility)
      if (promotion.productId !== null && promotion.productId !== undefined) {
        productIds.add(promotion.productId as number);
      }
    });
    
    return productIds;
  }, [storeActivePromotions]);

  // Get product IDs that are in voucher promotions (for voucher-specific filtering)
  const voucherProductIds = React.useMemo(() => {
    const productIds = new Set<number>();
    
    const voucherPromotions = storeActivePromotions.filter((p) => p.dealType === "VOUCHER");
    voucherPromotions.forEach((promotion) => {
      if (promotion.promotionProducts && Array.isArray(promotion.promotionProducts) && promotion.promotionProducts.length > 0) {
        promotion.promotionProducts.forEach((pp: any) => {
          if (pp.productId) {
            productIds.add(pp.productId);
          }
        });
      }
      if (promotion.productId !== null && promotion.productId !== undefined) {
        productIds.add(promotion.productId as number);
      }
    });
    
    return productIds;
  }, [storeActivePromotions]);

  // Get available products (not in active promotions)
  // When creating a voucher, exclude products already in voucher promotions
  const availableProducts = React.useMemo(() => {
    if (dealType === "VOUCHER") {
      // For vouchers, exclude products already in voucher promotions
      return retailerProducts.filter((p) => !voucherProductIds.has(p.id));
    }
    // For other deal types, exclude products in any active promotion
    return retailerProducts.filter((p) => !promotedProductIds.has(p.id));
  }, [retailerProducts, promotedProductIds, voucherProductIds, dealType]);

  // Handle field changes
  const handleFieldChange = (field: keyof CreatePromotionDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Set default voucher quantity when VOUCHER deal type is selected
  useEffect(() => {
    if (dealType === "VOUCHER" && !formData.voucherQuantity) {
      setFormData((prev) => ({ ...prev, voucherQuantity: 100 }));
    }
  }, [dealType]);

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
      // Set default voucher quantity if VOUCHER type and not specified (handle null, undefined, or 0)
      ...(dealType === "VOUCHER" && (!formData.voucherQuantity || formData.voucherQuantity <= 0) ? { voucherQuantity: 100 } : {}),
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
            {dealType === "VOUCHER" && voucherProductIds.size > 0 && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={16} color="#F59E0B" />
                <Text style={styles.infoText}>
                  {voucherProductIds.size} product{voucherProductIds.size !== 1 ? "s are" : " is"} already in a voucher promotion and cannot be selected
                </Text>
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
                        <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
                          {product.name}
                        </Text>
                        <Text style={styles.productPrice} numberOfLines={1}>₱{product.price}</Text>
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
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>Active Promotions</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{filteredPromotions.length}</Text>
                  </View>
                </View>
                
                {/* View Mode Toggle */}
                <View style={styles.viewToggle}>
                  <TouchableOpacity
                    style={[styles.viewButton, viewMode === "detailed" && styles.viewButtonActive]}
                    onPress={() => setViewMode("detailed")}
                  >
                    <Ionicons
                      name="list"
                      size={18}
                      color={viewMode === "detailed" ? "#ffffff" : "#6B7280"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.viewButton, viewMode === "compact" && styles.viewButtonActive]}
                    onPress={() => setViewMode("compact")}
                  >
                    <Ionicons
                      name="reorder-three"
                      size={18}
                      color={viewMode === "compact" ? "#ffffff" : "#6B7280"}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search promotions or products..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#9CA3AF"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterChipsContainer}
                contentContainerStyle={styles.filterChipsContent}
              >
                <TouchableOpacity
                  style={[styles.filterChip, statusFilter === "all" && styles.filterChipActive]}
                  onPress={() => setStatusFilter("all")}
                >
                  <Text style={[styles.filterChipText, statusFilter === "all" && styles.filterChipTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterChip, statusFilter === "active" && styles.filterChipActive]}
                  onPress={() => setStatusFilter("active")}
                >
                  <Ionicons
                    name="flame"
                    size={14}
                    color={statusFilter === "active" ? "#ffffff" : "#10B981"}
                  />
                  <Text style={[styles.filterChipText, statusFilter === "active" && styles.filterChipTextActive]}>
                    Active
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterChip, statusFilter === "upcoming" && styles.filterChipActive]}
                  onPress={() => setStatusFilter("upcoming")}
                >
                  <Ionicons
                    name="time"
                    size={14}
                    color={statusFilter === "upcoming" ? "#ffffff" : "#3B82F6"}
                  />
                  <Text style={[styles.filterChipText, statusFilter === "upcoming" && styles.filterChipTextActive]}>
                    Upcoming
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterChip, statusFilter === "expired" && styles.filterChipActive]}
                  onPress={() => setStatusFilter("expired")}
                >
                  <Ionicons
                    name="close-circle"
                    size={14}
                    color={statusFilter === "expired" ? "#ffffff" : "#EF4444"}
                  />
                  <Text style={[styles.filterChipText, statusFilter === "expired" && styles.filterChipTextActive]}>
                    Expired
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Sort Options */}
              <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>Sort by:</Text>
                <View style={styles.sortButtons}>
                  <TouchableOpacity
                    style={[styles.sortButton, sortBy === "date" && styles.sortButtonActive]}
                    onPress={() => setSortBy("date")}
                  >
                    <Ionicons
                      name="calendar"
                      size={14}
                      color={sortBy === "date" ? "#ffffff" : "#6B7280"}
                    />
                    <Text style={[styles.sortButtonText, sortBy === "date" && styles.sortButtonTextActive]}>
                      Date
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sortButton, sortBy === "title" && styles.sortButtonActive]}
                    onPress={() => setSortBy("title")}
                  >
                    <Ionicons
                      name="text"
                      size={14}
                      color={sortBy === "title" ? "#ffffff" : "#6B7280"}
                    />
                    <Text style={[styles.sortButtonText, sortBy === "title" && styles.sortButtonTextActive]}>
                      Title
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sortButton, sortBy === "type" && styles.sortButtonActive]}
                    onPress={() => setSortBy("type")}
                  >
                    <Ionicons
                      name="pricetag"
                      size={14}
                      color={sortBy === "type" ? "#ffffff" : "#6B7280"}
                    />
                    <Text style={[styles.sortButtonText, sortBy === "type" && styles.sortButtonTextActive]}>
                      Type
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Results Summary */}
              {(searchQuery || statusFilter !== "all") && (
                <View style={styles.resultsSummary}>
                  <Text style={styles.resultsSummaryText}>
                    {filteredPromotions.length} of {storeActivePromotions.length} promotions
                  </Text>
                  {(searchQuery || statusFilter !== "all") && (
                    <TouchableOpacity
                      onPress={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      }}
                      style={styles.clearFiltersButton}
                    >
                      <Text style={styles.clearFiltersText}>Clear filters</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {filteredPromotions.length === 0 && (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="search-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyStateTitle}>No promotions found</Text>
                  <Text style={styles.emptyStateText}>
                    {searchQuery
                      ? "Try adjusting your search or filters"
                      : statusFilter !== "all"
                      ? `No ${statusFilter} promotions`
                      : "Create your first promotion above"}
                  </Text>
                </View>
              )}

              {filteredPromotions.map((promo) => {
                const product = retailerProducts.find((p) => p.id === promo.productId);
                if (!product) return null;

                const status = getPromotionStatus(promo);
                const statusConfig = {
                  active: { color: "#10B981", bg: "#D1FAE5", icon: "flame" as const },
                  upcoming: { color: "#3B82F6", bg: "#DBEAFE", icon: "time" as const },
                  expired: { color: "#EF4444", bg: "#FEE2E2", icon: "close-circle" as const },
                };

                // Compact View Mode
                if (viewMode === "compact") {
                  return (
                    <TouchableOpacity
                      key={promo.id}
                      style={styles.compactCard}
                      onPress={() => openPromotionDetails(promo)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.compactCardContent}>
                        <View style={styles.compactCardLeft}>
                          <View style={[styles.compactStatusIndicator, { backgroundColor: statusConfig[status].color }]} />
                          <View style={styles.compactCardInfo}>
                            <Text style={styles.compactCardTitle} numberOfLines={1}>
                              {promo.title}
                            </Text>
                            <Text style={styles.compactCardSubtitle} numberOfLines={1}>
                              <Ionicons name="cube" size={11} color="#9CA3AF" /> {product.name}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.compactCardRight}>
                          <View style={[styles.compactStatusBadge, { backgroundColor: statusConfig[status].bg }]}>
                            <Ionicons name={statusConfig[status].icon} size={12} color={statusConfig[status].color} />
                            <Text style={[styles.compactStatusText, { color: statusConfig[status].color }]}>
                              {status}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }

                // Detailed View Mode (Original)
                return (
                  <View key={promo.id} style={styles.promotionCard}>
                    <View style={styles.promotionHeader}>
                      <View style={styles.promotionIcon}>
                        <Ionicons name="flame" size={20} color="#FFBE5D" />
                      </View>
                      <View style={styles.promotionInfo}>
                        <Text style={styles.promotionTitle} numberOfLines={1} ellipsizeMode="tail">
                          {promo.title}
                        </Text>
                        <Text style={styles.promotionProduct} numberOfLines={1} ellipsizeMode="tail">
                          <Ionicons name="cube" size={12} color="#6B7280" /> {product.name}
                        </Text>
                      </View>
                      <View style={[styles.detailedStatusBadge, { backgroundColor: statusConfig[status].bg }]}>
                        <Ionicons name={statusConfig[status].icon} size={12} color={statusConfig[status].color} />
                      </View>
                    </View>

                    <View style={styles.promotionDetails}>
                      <View style={styles.dealTypeBadge}>
                        <Text style={styles.dealTypeText} numberOfLines={1} ellipsizeMode="tail">
                          {getDealTypeLabel(promo.dealType)}
                        </Text>
                      </View>
                      <View style={styles.dealDetailsBadge}>
                        <Text style={styles.dealDetailsText} numberOfLines={1} ellipsizeMode="tail">
                          {formatDealDetails(promo)}
                        </Text>
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

      {/* Promotion Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closePromotionDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalIcon}>
                  <Ionicons name="ticket" size={24} color="#FFBE5D" />
                </View>
                <Text style={styles.modalHeaderTitle}>Promotion Details</Text>
              </View>
              <TouchableOpacity onPress={closePromotionDetails} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedPromotion && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {(() => {
                  const product = retailerProducts.find((p) => p.id === selectedPromotion.productId);
                  const status = getPromotionStatus(selectedPromotion);
                  const statusConfig = {
                    active: { color: "#10B981", bg: "#D1FAE5", icon: "flame" as const, label: "Active" },
                    upcoming: { color: "#3B82F6", bg: "#DBEAFE", icon: "time" as const, label: "Upcoming" },
                    expired: { color: "#EF4444", bg: "#FEE2E2", icon: "close-circle" as const, label: "Expired" },
                  };

                  return (
                    <>
                      {/* Status Badge */}
                      <View style={[styles.modalStatusBadge, { backgroundColor: statusConfig[status].bg }]}>
                        <Ionicons name={statusConfig[status].icon} size={16} color={statusConfig[status].color} />
                        <Text style={[styles.modalStatusText, { color: statusConfig[status].color }]}>
                          {statusConfig[status].label}
                        </Text>
                      </View>

                      {/* Title */}
                      <Text style={styles.modalTitle} numberOfLines={2} ellipsizeMode="tail">
                        {selectedPromotion.title}
                      </Text>

                      {/* Product Info */}
                      {product && (
                        <View style={styles.modalInfoCard}>
                          <View style={styles.modalInfoRow}>
                            <Ionicons name="cube" size={16} color="#277874" />
                            <Text style={styles.modalInfoLabel}>Product</Text>
                          </View>
                          <Text style={styles.modalInfoValue} numberOfLines={2} ellipsizeMode="tail">
                            {product.name}
                          </Text>
                        </View>
                      )}

                      {/* Deal Type */}
                      <View style={styles.modalInfoCard}>
                        <View style={styles.modalInfoRow}>
                          <Ionicons name="pricetag" size={16} color="#277874" />
                          <Text style={styles.modalInfoLabel}>Deal Type</Text>
                        </View>
                          <Text style={styles.modalInfoValue} numberOfLines={1} ellipsizeMode="tail">
                            {getDealTypeLabel(selectedPromotion.dealType)}
                          </Text>
                      </View>

                      {/* Deal Details */}
                      <View style={styles.modalInfoCard}>
                        <View style={styles.modalInfoRow}>
                          <Ionicons name="flash" size={16} color="#277874" />
                          <Text style={styles.modalInfoLabel}>Deal Details</Text>
                        </View>
                          <Text style={styles.modalInfoValue} numberOfLines={2} ellipsizeMode="tail">
                            {formatDealDetails(selectedPromotion)}
                          </Text>
                      </View>

                      {/* Date Range */}
                      {selectedPromotion.startsAt && selectedPromotion.endsAt && (
                        <View style={styles.modalInfoCard}>
                          <View style={styles.modalInfoRow}>
                            <Ionicons name="calendar" size={16} color="#277874" />
                            <Text style={styles.modalInfoLabel}>Duration</Text>
                          </View>
                          <Text style={styles.modalInfoValue}>
                            {formatDate(new Date(selectedPromotion.startsAt))} - {formatDate(new Date(selectedPromotion.endsAt))}
                          </Text>
                        </View>
                      )}

                      {/* Description */}
                      {selectedPromotion.description && (
                        <View style={styles.modalInfoCard}>
                          <View style={styles.modalInfoRow}>
                            <Ionicons name="document-text" size={16} color="#277874" />
                            <Text style={styles.modalInfoLabel}>Description</Text>
                          </View>
                          <Text style={styles.modalInfoValue}>{selectedPromotion.description}</Text>
                        </View>
                      )}

                      {/* Action Buttons */}
                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          style={styles.modalDeleteButton}
                          onPress={() => {
                            closePromotionDetails();
                            setTimeout(() => {
                              handleDeletePromotion(selectedPromotion.id, selectedPromotion.title);
                            }, 300);
                          }}
                        >
                          <Ionicons name="trash-outline" size={18} color="#ffffff" />
                          <Text style={styles.modalDeleteButtonText}>Delete Promotion</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.modalCloseButtonBottom}
                          onPress={closePromotionDetails}
                        >
                          <Text style={styles.modalCloseButtonText}>Close</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  );
                })()}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  // Search and Filter styles
  searchContainer: {
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
  },
  filterChipsContainer: {
    marginBottom: 12,
  },
  filterChipsContent: {
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: "#277874",
    borderColor: "#277874",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterChipTextActive: {
    color: "#ffffff",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  sortButtons: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: "#277874",
    borderColor: "#277874",
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  sortButtonTextActive: {
    color: "#ffffff",
  },
  resultsSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F0FDFA",
    borderRadius: 8,
    marginBottom: 12,
  },
  resultsSummaryText: {
    fontSize: 13,
    color: "#0F766E",
    fontWeight: "600",
  },
  clearFiltersButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    color: "#277874",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  // View Toggle styles
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 2,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewButtonActive: {
    backgroundColor: "#277874",
  },
  // Compact Card styles
  compactCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  compactCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  compactCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  compactStatusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  compactCardInfo: {
    flex: 1,
  },
  compactCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  compactCardSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  compactCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compactStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  compactStatusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  detailedStatusBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 16,
  },
  modalStatusText: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
    lineHeight: 32,
  },
  modalInfoCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  modalInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  modalInfoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#277874",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalInfoValue: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 22,
  },
  modalActions: {
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  modalDeleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  modalDeleteButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  modalCloseButtonBottom: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 14,
  },
  modalCloseButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
});

