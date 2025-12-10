import { useLogin } from "@/features/auth";
import { useCatalog } from "@/features/catalog";
import { useStore } from "@/features/store";
import type { Promotion } from "@/features/store/promotions/types";
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
  View
} from "react-native";

export default function Promotions() {
  const { state: { user, accessToken } } = useLogin();
  const {
    action: { findProducts, createPromotion, findActivePromotions, updatePromotion, findUserStore, createProduct, updateProduct, deleteProduct, deletePromotion },
    state: { products, activePromotions, userStore, loading: productsLoading, error },
  } = useStore();
  const { action: { loadCategories }, state: { categories } } = useCatalog();
  const [promotionTitle, setPromotionTitle] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedProducts, setSelectedProducts] = useState<{[productId: string]: {discount: string, type: 'percentage' | 'fixed'}}>({});
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; description: string; startsAt: Date | null; endsAt: Date | null; active: boolean }>({ title: "", description: "", startsAt: null, endsAt: null, active: true });
  const [showEditStartPicker, setShowEditStartPicker] = useState(false);
  const [showEditEndPicker, setShowEditEndPicker] = useState(false);
  
  // Product CRUD state for promotion edit
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productEditForm, setProductEditForm] = useState<{ name: string; description: string; price: string; stock: string; categoryId: number | null }>({ name: "", description: "", price: "", stock: "", categoryId: null });
  const [showAddProductToPromotion, setShowAddProductToPromotion] = useState(false);
  const [newProductForm, setNewProductForm] = useState<{ name: string; description: string; price: string; stock: string; discount: string; discountType: 'percentage' | 'fixed'; categoryId: number | null }>({ name: "", description: "", price: "", stock: "", discount: "", discountType: 'percentage', categoryId: null });
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [addingExistingProductId, setAddingExistingProductId] = useState<number | null>(null);
  const [existingProductDiscount, setExistingProductDiscount] = useState("");
  const [existingProductDiscountType, setExistingProductDiscountType] = useState<'percentage' | 'fixed'>('percentage');

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
    loadCategories();
  }, [storeId, loadCategories]);

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

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev[productId]) {
        const newState = {...prev};
        delete newState[productId];
        return newState;
      } else {
        return {
          ...prev,
          [productId]: {
            discount: '',
            type: 'percentage'
          }
        };
      }
    });
  };

  const updateProductDiscount = (productId: string, discount: string) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        discount
      }
    }));
  };

  const updateProductDiscountType = (productId: string, type: 'percentage' | 'fixed') => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        type
      }
    }));
  };

  // Get products that are not already in active promotions
  const getAvailableProducts = () => {
    const promotedProductIds = storeActivePromotions.map(promotion => promotion.productId);
    return retailerProducts.filter(product => !promotedProductIds.includes(product.id));
  };

  // Check if a product is already in an active promotion
  const isProductInActivePromotion = (productId: number) => {
    return storeActivePromotions.some(promotion => promotion.productId === productId);
  };

  const availableProducts = getAvailableProducts();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

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

  const makeGroupKey = (p: Promotion) => `${p.title || ''}|${p.startsAt || ''}|${p.endsAt || ''}`;

  const beginEdit = (groupSample: Promotion) => {
    const key = makeGroupKey(groupSample);
    setEditingKey(key);
    setEditForm({
      title: groupSample.title || "",
      description: groupSample.description || "",
      startsAt: groupSample.startsAt ? new Date(groupSample.startsAt) : null,
      endsAt: groupSample.endsAt ? new Date(groupSample.endsAt) : null,
      active: !!groupSample.active,
    });
    setEditingProductId(null);
    setShowAddProductToPromotion(false);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditingProductId(null);
    setShowAddProductToPromotion(false);
    setProductEditForm({ name: "", description: "", price: "", stock: "", categoryId: null });
    setNewProductForm({ name: "", description: "", price: "", stock: "", discount: "", discountType: 'percentage', categoryId: null });
    setAddingExistingProductId(null);
    setExistingProductDiscount("");
  };

  const handleEditStartChange = (_event: unknown, selectedDate?: Date) => {
    setShowEditStartPicker(false);
    if (selectedDate) setEditForm(prev => ({ ...prev, startsAt: selectedDate }));
  };

  const handleEditEndChange = (_event: unknown, selectedDate?: Date) => {
    setShowEditEndPicker(false);
    if (selectedDate) setEditForm(prev => ({ ...prev, endsAt: selectedDate }));
  };

  const saveEdit = async () => {
    if (!editingKey) return;

    if (!editForm.title.trim()) {
      alert("Please enter a promotion title");
      return;
    }
    if (!editForm.startsAt || !editForm.endsAt) {
      alert("Please select start and end dates");
      return;
    }
    const start = new Date(editForm.startsAt);
    const end = new Date(editForm.endsAt);
    if (end <= start) {
      alert("End date must be after start date");
      return;
    }
    try {
      // Update all promotions in the same group (same title/period)
      const groupPromos = activePromotions.filter((p: Promotion) => makeGroupKey(p) === editingKey);
      await Promise.all(
        groupPromos.map((p: Promotion) =>
          updatePromotion({
            id: p.id,
            title: editForm.title,
            description: editForm.description,
            startsAt: start.toISOString(),
            endsAt: end.toISOString(),
          })
        )
      );
      // Optionally refresh active list for safety
      if (storeId) {
        findActivePromotions(storeId);
      }
      setEditingKey(null);
      alert("Promotion updated successfully!");
    } catch (e) {
      alert("Failed to update promotion. Please try again.");
    }
  };

  const handleCreatePromotion = async () => {
    // Validate required fields
    if (!promotionTitle.trim()) {
      alert("Please enter a promotion title");
      return;
    }
    
    if (!startDate) {
      alert("Please select a start date");
      return;
    }
    
    if (!endDate) {
      alert("Please select an end date");
      return;
    }
    
    const selectedProductIds = Object.keys(selectedProducts);
    if (selectedProductIds.length === 0) {
      alert("Please select at least one product");
      return;
    }

    // Validate all product discounts
    for (const productId of selectedProductIds) {
      const productData = selectedProducts[productId];
      const product = retailerProducts.find(p => p.id.toString() === productId);
      
      if (!productData.discount.trim()) {
        alert(`Please enter a discount for all selected products`);
        return;
      }
      
      const discount = parseFloat(productData.discount);
      if (isNaN(discount)) {
        alert(`Please enter a valid discount amount for all products`);
        return;
      }
      
      if (productData.type === 'percentage') {
        // Percentage discount: must be between 0 and 100
        if (discount <= 0) {
          alert(`Percentage discount must be greater than 0%`);
          return;
        }
        if (discount > 100) {
          alert(`Percentage discount cannot exceed 100%`);
          return;
        }
      } else {
        // Fixed discount: must be positive and not exceed product price
        if (discount <= 0) {
          alert(`Fixed discount must be greater than $0`);
          return;
        }
        if (!product) {
          alert(`Product not found. Please refresh and try again.`);
          return;
        }
        const productPrice = typeof product.price === "string" ? parseFloat(product.price) : product.price;
        if (discount >= productPrice) {
          alert(`Fixed discount ($${discount.toFixed(2)}) cannot exceed or equal the product price ($${productPrice.toFixed(2)})`);
          return;
        }
        // Also check for unreasonably large fixed discounts (max $10,000)
        if (discount > 10000) {
          alert(`Fixed discount cannot exceed $10,000. Please enter a reasonable amount.`);
          return;
        }
      }
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    if (start < now) {
      alert("Start date must be in the future");
      return;
    }
    
    if (end <= start) {
      alert("End date must be after start date");
      return;
    }

    // Additional validation: ensure store exists and user is retailer
    if (!storeId) {
      alert("Store not found. Please complete your store setup first.");
      setIsCreating(false);
      return;
    }

    if (!userStore) {
      alert("Store information not available. Please refresh and try again.");
      setIsCreating(false);
      return;
    }

    // Verify user is a retailer
    const userRole = user?.role || user?.user_type;
    if (userRole !== 'RETAILER') {
      alert("Only retailers can create promotions. Please check your account type.");
      setIsCreating(false);
      return;
    }

    // Verify store ownership
    const userId = user?.id ? Number(user.id) : undefined;
    if (!userId || userStore.ownerId !== userId) {
      alert("You do not own this store. Cannot create promotions.");
      setIsCreating(false);
      return;
    }

    // Validate that all selected products belong to the user's store and are active
    const invalidProducts = selectedProductIds.filter(productId => {
      const product = retailerProducts.find(p => p.id.toString() === productId);
      if (!product) {
        console.log(`Product ${productId} not found in retailerProducts`);
        return true;
      }
      if (product.storeId !== storeId) {
        console.log(`Product ${productId} storeId (${product.storeId}) doesn't match userStore.id (${storeId})`);
        return true;
      }
      if (!product.isActive) {
        console.log(`Product ${productId} is not active`);
        return true;
      }
      return false;
    });

    if (invalidProducts.length > 0) {
      const inactiveProducts = invalidProducts.filter(productId => {
        const product = retailerProducts.find(p => p.id.toString() === productId);
        return product && !product.isActive;
      });
      
      if (inactiveProducts.length > 0) {
        alert("Some selected products are inactive. Please activate them first or select active products.");
      } else {
        alert("Some selected products do not belong to your store. Please refresh and try again.");
      }
      setIsCreating(false);
      return;
    }

    setIsCreating(true);

    try {
      // Log validation info for debugging
      console.log("Creating promotions with validation:");
      console.log("User ID:", user?.id);
      console.log("Store ID:", storeId);
      console.log("Store ownerId:", userStore.ownerId);
      console.log("Store verificationStatus:", userStore.verificationStatus);
      console.log("Selected products:", selectedProductIds);
      selectedProductIds.forEach(productId => {
        const product = retailerProducts.find(p => p.id.toString() === productId);
        console.log(`Product ${productId}:`, {
          id: product?.id,
          storeId: product?.storeId,
          name: product?.name,
          isActive: product?.isActive
        });
      });

      // Create promotion for each selected product with individual discounts
      const promises = selectedProductIds.map(productId => {
        const productData = selectedProducts[productId];
        const promotionPayload = {
          title: promotionTitle,
          type: productData.type,
          description: description || `${productData.type === 'percentage' ? `${productData.discount}%` : `$${productData.discount}`} off`,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          discount: parseFloat(productData.discount),
          productIds: [parseInt(productId)],
        };
        console.log(`Creating promotion for product ${productId}:`, promotionPayload);
        return createPromotion(promotionPayload).unwrap();
      });

      await Promise.all(promises);
      
      // Refresh products and active promotions to show the new promotion
      if (storeId) {
        await findProducts({ storeId });
        await findActivePromotions(storeId);
      }
      
      // Reset form
      setPromotionTitle("");
      setStartDate(new Date());
      setEndDate(new Date());
      setSelectedProducts({});
      setDescription("");
      
      alert("Promotion created successfully!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create promotion. Please try again.";
      alert(errorMessage);
      console.error("Error creating promotion:", error);
    } finally {
      setIsCreating(false);
    }
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
            <Text style={styles.headerSubtitle}>Create a Promotion</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          {/* Promotion Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Promotion Title</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="create" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Summer Sale on Office Supplies"
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
                placeholder="e.g. Special summer sale on office supplies"
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          {/* Promotion Period */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Promotion Period</Text>
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
            <Text style={styles.label}>Select Products</Text>
            {productsLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading products...</Text>
              </View>
            ) : retailerProducts.length > 0 ? (
              <View>
                {/* Available Products */}
                {availableProducts.length > 0 && (
                  <View>
                    <Text style={styles.sectionSubtitle}>Available Products ({availableProducts.length})</Text>
                    {availableProducts.map((product) => {
                      const isSelected = selectedProducts[product.id.toString()];
                      return (
                        <View key={product.id} style={styles.productCard}>
                          <TouchableOpacity
                            style={styles.productContent}
                            onPress={() => toggleProductSelection(product.id.toString())}
                          >
                            <View style={styles.checkboxContainer}>
                              <View style={[
                                styles.checkbox,
                                isSelected && styles.checkboxSelected
                              ]}>
                                {isSelected && (
                                  <Ionicons name="checkmark" size={12} color="#ffffff" />
                                )}
                              </View>
                            </View>
                            
                            <View style={styles.productImagePlaceholder}>
                              <Ionicons name="cube-outline" size={24} color="#9CA3AF" />
                            </View>
                            
                            <View style={styles.productInfo}>
                              <Text style={styles.productName}>{product.name}</Text>
                              <Text style={styles.productPrice}>${product.price}</Text>
                            </View>
                          </TouchableOpacity>
                          
                          {/* Individual Discount Input for Selected Products */}
                          {isSelected && (
                            <View style={styles.discountInputContainer}>
                              <Text style={styles.discountLabel}>Discount for this product:</Text>
                              <View style={styles.discountInputRow}>
                                <View style={styles.discountTypeSelector}>
                                  <TouchableOpacity
                                    style={[
                                      styles.discountTypeButton,
                                      isSelected.type === 'percentage' && styles.discountTypeButtonSelected
                                    ]}
                                    onPress={() => updateProductDiscountType(product.id.toString(), 'percentage')}
                                  >
                                    <Text style={[
                                      styles.discountTypeButtonText,
                                      isSelected.type === 'percentage' && styles.discountTypeButtonTextSelected
                                    ]}>
                                      %
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[
                                      styles.discountTypeButton,
                                      isSelected.type === 'fixed' && styles.discountTypeButtonSelected
                                    ]}
                                    onPress={() => updateProductDiscountType(product.id.toString(), 'fixed')}
                                  >
                                    <Text style={[
                                      styles.discountTypeButtonText,
                                      isSelected.type === 'fixed' && styles.discountTypeButtonTextSelected
                                    ]}>
                                      $
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                                <TextInput
                                  style={styles.discountInput}
                                  placeholder={isSelected.type === 'percentage' ? "20" : "5.00"}
                                  value={isSelected.discount}
                                  onChangeText={(text) => {
                                    // For percentage: allow 0-100 with optional decimal
                                    // For fixed: allow positive numbers with optional decimal
                                    if (isSelected.type === 'percentage') {
                                      // Allow numbers and one decimal point, max 100
                                      const cleaned = text.replace(/[^0-9.]/g, '');
                                      const parts = cleaned.split('.');
                                      const formatted = parts.length > 2 
                                        ? parts[0] + '.' + parts.slice(1).join('')
                                        : cleaned;
                                      // Prevent values over 100
                                      const num = parseFloat(formatted);
                                      if (!isNaN(num) && num > 100) {
                                        return; // Don't update if over 100
                                      }
                                      updateProductDiscount(product.id.toString(), formatted);
                                    } else {
                                      // For fixed: allow numbers and one decimal point
                                      const cleaned = text.replace(/[^0-9.]/g, '');
                                      const parts = cleaned.split('.');
                                      const formatted = parts.length > 2 
                                        ? parts[0] + '.' + parts.slice(1).join('')
                                        : cleaned;
                                      updateProductDiscount(product.id.toString(), formatted);
                                    }
                                  }}
                                  keyboardType="decimal-pad"
                                  placeholderTextColor="#9CA3AF"
                                />
                                <Text style={styles.discountHelperText}>
                                  {isSelected.type === 'percentage' 
                                    ? "Enter 0-100% (e.g., 20 for 20% off)"
                                    : `Enter amount less than product price ($${(typeof product.price === "string" ? parseFloat(product.price) : product.price).toFixed(2)}), max $10,000`}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Unavailable Products (Already in Promotions) */}
                {retailerProducts.filter(product => isProductInActivePromotion(product.id)).length > 0 && (
                  <View style={styles.unavailableSection}>
                    <Text style={styles.sectionSubtitle}>Currently in Active Promotions</Text>
                    {retailerProducts.filter(product => isProductInActivePromotion(product.id)).map((product) => (
                      <View key={product.id} style={[styles.productCard, styles.unavailableProductCard]}>
                        <View style={styles.productContent}>
                          <View style={styles.checkboxContainer}>
                            <View style={[styles.checkbox, styles.unavailableCheckbox]}>
                              <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
                            </View>
                          </View>
                          
                          <View style={styles.productImagePlaceholder}>
                            <Ionicons name="cube-outline" size={24} color="#9CA3AF" />
                          </View>
                          
                          <View style={styles.productInfo}>
                            <Text style={[styles.productName, styles.unavailableProductName]}>{product.name}</Text>
                            <Text style={[styles.productPrice, styles.unavailableProductPrice]}>${product.price}</Text>
                            <Text style={styles.unavailableText}>Already in active promotion</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* No Available Products */}
                {availableProducts.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No products available for promotion</Text>
                    <Text style={styles.emptySubtext}>All products are currently in active promotions</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No products available</Text>
                <Text style={styles.emptySubtext}>Add products to your store first to create promotions</Text>
              </View>
            )}
          </View>

          {/* Info Message */}
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Customer will be notified about this promotion based on their saved preferences and search history for included products.
            </Text>
            {Object.keys(selectedProducts).length > 0 && (
              <View style={styles.discountPreview}>
                <Text style={styles.discountPreviewTitle}>Discount Preview:</Text>
                {Object.entries(selectedProducts).map(([productId, productData]) => {
                  const product = retailerProducts.find(p => p.id.toString() === productId);
                  if (!product || !productData.discount) return null;
                  
                  const discount = parseFloat(productData.discount);
                  if (isNaN(discount)) return null;
                  
                  const productPrice = typeof product.price === "string" ? parseFloat(product.price) : product.price;
                  const discountedPrice = productData.type === 'percentage' 
                    ? productPrice * (1 - discount / 100)
                    : Math.max(0, productPrice - discount);
                  
                  return (
                    <View key={productId} style={styles.discountPreviewItem}>
                      <Text style={styles.discountPreviewProduct}>{product.name}</Text>
                      <View style={styles.discountPreviewPrice}>
                        <Text style={styles.discountPreviewOriginal}>${product.price}</Text>
                        <Text style={styles.discountPreviewNew}>${discountedPrice.toFixed(2)}</Text>
                        <Text style={styles.discountPreviewType}>
                          ({productData.type === 'percentage' ? `${discount}%` : `$${discount}`} off)
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Create Button */}
          <TouchableOpacity 
            style={[styles.createButton, isCreating && styles.createButtonDisabled]} 
            onPress={handleCreatePromotion}
            disabled={isCreating}
          >
            <Text style={styles.createButtonText}>
              {isCreating ? "Creating..." : "Create Promotion"}
            </Text>
          </TouchableOpacity>
        
          {/* Active Promotions - Edit Section */}
          {activePromotions?.length > 0 && (
            <View style={{ marginTop: 28 }}>
              <Text style={styles.sectionSubtitle}>Active Promotions</Text>
              {(() => {
                // Group promotions by title + dates
                const groups: { [key: string]: { promos: Promotion[]; sample: Promotion } } = {};
                for (const promo of activePromotions) {
                  const key = makeGroupKey(promo);
                  if (!groups[key]) groups[key] = { promos: [], sample: promo };
                  groups[key].promos.push(promo);
                }
                const entries = Object.entries(groups);
                return entries.map(([key, group]) => {
                  const isEditing = editingKey === key;
                  return (
                    <View key={key} style={styles.productCard}>
                      {!isEditing ? (
                        <View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.productName}>{group.sample.title}</Text>
                            <TouchableOpacity onPress={() => beginEdit(group.sample)}>
                              <Ionicons name="create-outline" size={20} color="#277874" />
                            </TouchableOpacity>
                          </View>
                          {group.sample.startsAt && group.sample.endsAt && (
                            <Text style={styles.productPrice}>Period: {formatDate(new Date(group.sample.startsAt))} - {formatDate(new Date(group.sample.endsAt))}</Text>
                          )}
                          <Text style={[styles.productPrice, { color: group.sample.active ? '#059669' : '#EF4444' }]}>Status: {group.sample.active ? 'Active' : 'Inactive'}</Text>
                          <View style={{ marginTop: 8 }}>
                            {group.promos.map((p) => {
                              const product = retailerProducts.find(pr => pr.id === p.productId);
                              return (
                                <Text key={p.id} style={styles.productPrice}>
                                  • {product ? product.name : `Product ${p.productId}`} — {p.type === 'percentage' ? `${p.discount}%` : `$${p.discount}`} off
                                </Text>
                              );
                            })}
                          </View>
                        </View>
                      ) : (
                        <View>
                          <View style={styles.inputGroup}>
                            <Text style={styles.label}>Title</Text>
                            <View style={styles.inputContainer}>
                              <Ionicons name="create" size={20} color="#9CA3AF" style={styles.inputIcon} />
                              <TextInput
                                style={styles.textInput}
                                value={editForm.title}
                                onChangeText={(t) => setEditForm(prev => ({ ...prev, title: t }))}
                                placeholder="Promotion title"
                                placeholderTextColor="#9CA3AF"
                              />
                            </View>
                          </View>

                          <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <View style={styles.inputContainer}>
                              <Ionicons name="document-text" size={20} color="#9CA3AF" style={styles.inputIcon} />
                              <TextInput
                                style={styles.textInput}
                                value={editForm.description}
                                onChangeText={(t) => setEditForm(prev => ({ ...prev, description: t }))}
                                placeholder="Description"
                                placeholderTextColor="#9CA3AF"
                                multiline
                              />
                            </View>
                          </View>

                          <View style={styles.inputGroup}>
                            <Text style={styles.label}>Promotion Period</Text>
                            <View style={styles.dateRow}>
                              <View style={styles.dateColumn}>
                                <Text style={styles.dateLabel}>Start Date</Text>
                                <TouchableOpacity 
                                  style={[styles.inputContainer, styles.dateInput]}
                                  onPress={() => setShowEditStartPicker(true)}
                                >
                                  <Ionicons name="calendar" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                  <Text style={styles.dateText}>{editForm.startsAt ? formatDate(editForm.startsAt) : 'Select'}</Text>
                                </TouchableOpacity>
                              </View>
                              <View style={styles.dateColumn}>
                                <Text style={styles.dateLabel}>End Date</Text>
                                <TouchableOpacity 
                                  style={[styles.inputContainer, styles.dateInput]}
                                  onPress={() => setShowEditEndPicker(true)}
                                >
                                  <Ionicons name="calendar" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                  <Text style={styles.dateText}>{editForm.endsAt ? formatDate(editForm.endsAt) : 'Select'}</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>

                          <View style={[styles.inputGroup, { marginTop: 4 }]}>
                            <Text style={styles.label}>Status</Text>
                            <Text style={{ fontSize: 14, color: editForm.active ? '#065F46' : '#B91C1C', fontWeight: "600" }}>
                              {editForm.active ? "Active (managed by administrators)" : "Disabled by administrators"}
                            </Text>
                            {!editForm.active && (
                              <Text style={{ fontSize: 12, color: "#B91C1C", marginTop: 4 }}>
                                This promotion was disabled by the administrators because something
                                was wrong with it. While disabled, customers cannot see this
                                promotion.
                              </Text>
                            )}
                          </View>

                          {/* Products in Promotion Section */}
                          <View style={[styles.inputGroup, { marginTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 16 }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <Text style={styles.label}>Products in Promotion</Text>
                              <TouchableOpacity 
                                style={[styles.createButton, { paddingVertical: 6, paddingHorizontal: 12 }]}
                                onPress={() => setShowAddProductToPromotion(!showAddProductToPromotion)}
                              >
                                <Ionicons name="add" size={16} color="#ffffff" style={{ marginRight: 4 }} />
                                <Text style={[styles.createButtonText, { fontSize: 12 }]}>Add Product</Text>
                              </TouchableOpacity>
                            </View>

                            {/* List of products in this promotion */}
                            {group.promos.map((p) => {
                              const product = retailerProducts.find(pr => pr.id === p.productId);
                              if (!product) return null;
                              
                              const isEditingProduct = editingProductId === product.id;
                              
                              return (
                                <View key={p.id} style={[styles.productCard, { marginBottom: 12, backgroundColor: '#F9FAFB' }]}>
                                  {!isEditingProduct ? (
                                    <View>
                                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <View style={{ flex: 1 }}>
                                          <Text style={[styles.productName, { marginBottom: 4 }]}>{product.name}</Text>
                                          <Text style={[styles.productPrice, { marginBottom: 2 }]}>{product.description}</Text>
                                          <Text style={styles.productPrice}>Price: ${product.price} | Stock: {product.stock}</Text>
                                          <Text style={[styles.productPrice, { color: '#10B981', fontWeight: '600', marginTop: 4 }]}>
                                            Discount: {p.type === 'percentage' ? `${p.discount}%` : `$${p.discount}`} off
                                          </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                          <TouchableOpacity onPress={() => {
                                            setEditingProductId(product.id);
                                            setProductEditForm({
                                              name: product.name,
                                              description: product.description || "",
                                              price: product.price.toString(),
                                              stock: product.stock.toString(),
                                              categoryId: product.categoryId || null
                                            });
                                          }}>
                                            <Ionicons name="create-outline" size={18} color="#277874" />
                                          </TouchableOpacity>
                                          <TouchableOpacity onPress={() => {
                                            Alert.alert(
                                              "Remove Product from Promotion",
                                              `Remove "${product.name}" from this promotion?`,
                                              [
                                                { text: "Cancel", style: "cancel" },
                                                {
                                                  text: "Remove",
                                                  style: "destructive",
                                                  onPress: async () => {
                                                    try {
                                                      await deletePromotion(p.id).unwrap();
                                                      if (storeId) {
                                                        await findActivePromotions(storeId);
                                                        await findProducts({ storeId });
                                                      }
                                                    } catch (error) {
                                                      Alert.alert("Error", "Failed to remove product from promotion");
                                                    }
                                                  }
                                                }
                                              ]
                                            );
                                          }}>
                                            <Ionicons name="remove-circle-outline" size={18} color="#F59E0B" />
                                          </TouchableOpacity>
                                          <TouchableOpacity onPress={() => {
                                            Alert.alert(
                                              "Delete Product",
                                              `Are you sure you want to permanently delete "${product.name}"? This will also remove it from this promotion.`,
                                              [
                                                { text: "Cancel", style: "cancel" },
                                                {
                                                  text: "Delete",
                                                  style: "destructive",
                                                  onPress: async () => {
                                                    try {
                                                      // Delete the promotion first
                                                      await deletePromotion(p.id).unwrap();
                                                      // Then delete the product
                                                      await deleteProduct(product.id).unwrap();
                                                      if (storeId) {
                                                        await findActivePromotions(storeId);
                                                        await findProducts({ storeId });
                                                      }
                                                      Alert.alert("Success", "Product deleted successfully");
                                                    } catch (error: any) {
                                                      Alert.alert("Error", error?.message || "Failed to delete product");
                                                    }
                                                  }
                                                }
                                              ]
                                            );
                                          }}>
                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                          </TouchableOpacity>
                                        </View>
                                      </View>
                                    </View>
                                  ) : (
                                    <View>
                                      <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Product Name</Text>
                                        <TextInput
                                          style={styles.textInput}
                                          value={productEditForm.name}
                                          onChangeText={(t) => setProductEditForm(prev => ({ ...prev, name: t }))}
                                          placeholder="Product name"
                                        />
                                      </View>
                                      <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Description</Text>
                                        <TextInput
                                          style={styles.textInput}
                                          value={productEditForm.description}
                                          onChangeText={(t) => setProductEditForm(prev => ({ ...prev, description: t }))}
                                          placeholder="Description"
                                          multiline
                                        />
                                      </View>
                                      <View style={{ flexDirection: 'row', gap: 10 }}>
                                        <View style={{ flex: 1 }}>
                                          <Text style={styles.label}>Price</Text>
                                          <TextInput
                                            style={styles.textInput}
                                            value={productEditForm.price}
                                            onChangeText={(t) => setProductEditForm(prev => ({ ...prev, price: t }))}
                                            placeholder="0.00"
                                            keyboardType="decimal-pad"
                                          />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                          <Text style={styles.label}>Stock</Text>
                                          <TextInput
                                            style={styles.textInput}
                                            value={productEditForm.stock}
                                            onChangeText={(t) => setProductEditForm(prev => ({ ...prev, stock: t }))}
                                            placeholder="0"
                                            keyboardType="numeric"
                                          />
                                        </View>
                                      </View>
                                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                                        <TouchableOpacity 
                                          style={[styles.createButton, { flex: 1 }]}
                                          onPress={async () => {
                                            if (!productEditForm.name.trim()) {
                                              Alert.alert("Error", "Product name is required");
                                              return;
                                            }
                                            const price = parseFloat(productEditForm.price);
                                            const stock = parseInt(productEditForm.stock, 10);
                                            if (isNaN(price) || price <= 0) {
                                              Alert.alert("Error", "Price must be a positive number");
                                              return;
                                            }
                                            if (isNaN(stock) || stock < 0) {
                                              Alert.alert("Error", "Stock must be a non-negative number");
                                              return;
                                            }
                                            try {
                                              await updateProduct({
                                                id: product.id,
                                                name: productEditForm.name.trim(),
                                                description: productEditForm.description.trim() || undefined,
                                                price: price,
                                                stock: stock,
                                                categoryId: productEditForm.categoryId || undefined,
                                              }).unwrap();
                                              if (storeId) {
                                                await findProducts({ storeId });
                                              }
                                              setEditingProductId(null);
                                              Alert.alert("Success", "Product updated successfully");
                                            } catch (error: any) {
                                              Alert.alert("Error", error?.message || "Failed to update product");
                                            }
                                          }}
                                        >
                                          <Text style={styles.createButtonText}>Save</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                          style={[styles.createButton, styles.createButtonDisabled, { flex: 1 }]}
                                          onPress={() => setEditingProductId(null)}
                                        >
                                          <Text style={styles.createButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  )}
                                </View>
                              );
                            })}

                            {/* Add Product to Promotion Form */}
                            {showAddProductToPromotion && (
                              <View style={[styles.productCard, { backgroundColor: '#F0FDF4', borderWidth: 2, borderColor: '#10B981', marginTop: 12 }]}>
                                <Text style={[styles.label, { marginBottom: 12 }]}>Add New Product to Promotion</Text>
                                
                                <View style={styles.inputGroup}>
                                  <Text style={styles.label}>Product Name *</Text>
                                  <TextInput
                                    style={styles.textInput}
                                    value={newProductForm.name}
                                    onChangeText={(t) => setNewProductForm(prev => ({ ...prev, name: t }))}
                                    placeholder="Product name"
                                  />
                                </View>

                                <View style={styles.inputGroup}>
                                  <Text style={styles.label}>Description *</Text>
                                  <TextInput
                                    style={styles.textInput}
                                    value={newProductForm.description}
                                    onChangeText={(t) => setNewProductForm(prev => ({ ...prev, description: t }))}
                                    placeholder="Description"
                                    multiline
                                  />
                                </View>

                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Price *</Text>
                                    <TextInput
                                      style={styles.textInput}
                                      value={newProductForm.price}
                                      onChangeText={(t) => setNewProductForm(prev => ({ ...prev, price: t }))}
                                      placeholder="0.00"
                                      keyboardType="decimal-pad"
                                    />
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Stock *</Text>
                                    <TextInput
                                      style={styles.textInput}
                                      value={newProductForm.stock}
                                      onChangeText={(t) => setNewProductForm(prev => ({ ...prev, stock: t }))}
                                      placeholder="0"
                                      keyboardType="numeric"
                                    />
                                  </View>
                                </View>

                                <View style={styles.inputGroup}>
                                  <Text style={styles.label}>Category</Text>
                                  <TouchableOpacity
                                    style={styles.inputContainer}
                                    onPress={() => setShowCategoryList(!showCategoryList)}
                                  >
                                    <Ionicons name="pricetags" size={18} color="#6B7280" />
                                    <Text style={{ marginLeft: 8, color: "#374151", fontSize: 14 }}>
                                      {newProductForm.categoryId
                                        ? categories.find((c) => c.id === newProductForm.categoryId)?.name || "Select category"
                                        : "Select category"}
                                    </Text>
                                  </TouchableOpacity>
                                  {showCategoryList && (
                                    <View style={{ marginTop: 8, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, backgroundColor: "#F9FAFB", maxHeight: 150 }}>
                                      <ScrollView>
                                        {categories.map((cat) => (
                                          <TouchableOpacity
                                            key={cat.id}
                                            onPress={() => {
                                              setNewProductForm(prev => ({ ...prev, categoryId: cat.id }));
                                              setShowCategoryList(false);
                                            }}
                                            style={{ paddingVertical: 10, paddingHorizontal: 12 }}
                                          >
                                            <Text style={{ fontSize: 14, color: "#374151" }}>{cat.name}</Text>
                                          </TouchableOpacity>
                                        ))}
                                      </ScrollView>
                                    </View>
                                  )}
                                </View>

                                <View style={styles.inputGroup}>
                                  <Text style={styles.label}>Discount *</Text>
                                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                    <View style={styles.discountTypeSelector}>
                                      <TouchableOpacity
                                        style={[
                                          styles.discountTypeButton,
                                          newProductForm.discountType === 'percentage' && styles.discountTypeButtonSelected
                                        ]}
                                        onPress={() => setNewProductForm(prev => ({ ...prev, discountType: 'percentage' }))}
                                      >
                                        <Text style={[
                                          styles.discountTypeButtonText,
                                          newProductForm.discountType === 'percentage' && styles.discountTypeButtonTextSelected
                                        ]}>%</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        style={[
                                          styles.discountTypeButton,
                                          newProductForm.discountType === 'fixed' && styles.discountTypeButtonSelected
                                        ]}
                                        onPress={() => setNewProductForm(prev => ({ ...prev, discountType: 'fixed' }))}
                                      >
                                        <Text style={[
                                          styles.discountTypeButtonText,
                                          newProductForm.discountType === 'fixed' && styles.discountTypeButtonTextSelected
                                        ]}>$</Text>
                                      </TouchableOpacity>
                                    </View>
                                    <TextInput
                                      style={[styles.discountInput, { flex: 1 }]}
                                      value={newProductForm.discount}
                                      onChangeText={(t) => setNewProductForm(prev => ({ ...prev, discount: t }))}
                                      placeholder={newProductForm.discountType === 'percentage' ? "20" : "5.00"}
                                      keyboardType="decimal-pad"
                                    />
                                  </View>
                                </View>

                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                                  <TouchableOpacity 
                                    style={[styles.createButton, { flex: 1 }]}
                                    onPress={async () => {
                                      if (!newProductForm.name.trim() || !newProductForm.description.trim() || !newProductForm.price || !newProductForm.stock || !newProductForm.discount) {
                                        Alert.alert("Error", "Please fill in all required fields");
                                        return;
                                      }
                                      const price = parseFloat(newProductForm.price);
                                      const stock = parseInt(newProductForm.stock, 10);
                                      const discount = parseFloat(newProductForm.discount);
                                      if (isNaN(price) || price <= 0) {
                                        Alert.alert("Error", "Price must be a positive number");
                                        return;
                                      }
                                      if (isNaN(stock) || stock < 0) {
                                        Alert.alert("Error", "Stock must be a non-negative number");
                                        return;
                                      }
                                      if (isNaN(discount) || discount <= 0) {
                                        Alert.alert("Error", "Discount must be a positive number");
                                        return;
                                      }
                                      if (newProductForm.discountType === 'percentage' && discount > 100) {
                                        Alert.alert("Error", "Percentage discount cannot exceed 100%");
                                        return;
                                      }
                                      if (newProductForm.discountType === 'fixed' && discount >= price) {
                                        Alert.alert("Error", "Fixed discount must be less than product price");
                                        return;
                                      }
                                      if (!storeId) {
                                        Alert.alert("Error", "Store not found");
                                        return;
                                      }
                                      try {
                                        // Create the product first
                                        const createdProduct = await createProduct({
                                          name: newProductForm.name.trim(),
                                          description: newProductForm.description.trim(),
                                          price: price,
                                          stock: stock,
                                          storeId: storeId,
                                          categoryId: newProductForm.categoryId || undefined,
                                        }).unwrap();
                                        
                                        // Then create the promotion for this product
                                        if (editForm.startsAt && editForm.endsAt) {
                                          await createPromotion({
                                            title: editForm.title,
                                            type: newProductForm.discountType,
                                            description: editForm.description || `${newProductForm.discountType === 'percentage' ? `${discount}%` : `$${discount}`} off`,
                                            startsAt: editForm.startsAt.toISOString(),
                                            endsAt: editForm.endsAt.toISOString(),
                                            discount: discount,
                                            productIds: [createdProduct.id],
                                          }).unwrap();
                                        }
                                        
                                        // Refresh data
                                        if (storeId) {
                                          await findProducts({ storeId });
                                          await findActivePromotions(storeId);
                                        }
                                        
                                        // Reset form
                                        setNewProductForm({ name: "", description: "", price: "", stock: "", discount: "", discountType: 'percentage', categoryId: null });
                                        setShowAddProductToPromotion(false);
                                        Alert.alert("Success", "Product created and added to promotion");
                                      } catch (error: any) {
                                        Alert.alert("Error", error?.message || "Failed to create product");
                                      }
                                    }}
                                  >
                                    <Text style={styles.createButtonText}>Create & Add</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity 
                                    style={[styles.createButton, styles.createButtonDisabled, { flex: 1 }]}
                                    onPress={() => {
                                      setShowAddProductToPromotion(false);
                                      setNewProductForm({ name: "", description: "", price: "", stock: "", discount: "", discountType: 'percentage', categoryId: null });
                                    }}
                                  >
                                    <Text style={styles.createButtonText}>Cancel</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            )}

                            {/* Add Existing Product to Promotion */}
                            {showAddProductToPromotion && availableProducts.length > 0 && (
                              <View style={[styles.productCard, { backgroundColor: '#FEF3C7', borderWidth: 2, borderColor: '#F59E0B', marginTop: 12 }]}>
                                <Text style={[styles.label, { marginBottom: 12 }]}>Or Add Existing Product</Text>
                                {availableProducts.slice(0, 5).map((product) => (
                                  <View key={product.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                                    {addingExistingProductId !== product.id ? (
                                      <TouchableOpacity
                                        onPress={() => {
                                          setAddingExistingProductId(product.id);
                                          setExistingProductDiscount("");
                                          setExistingProductDiscountType('percentage');
                                        }}
                                      >
                                        <Text style={styles.productName}>{product.name}</Text>
                                        <Text style={styles.productPrice}>${product.price}</Text>
                                      </TouchableOpacity>
                                    ) : (
                                      <View>
                                        <Text style={styles.productName}>{product.name}</Text>
                                        <View style={{ marginTop: 8 }}>
                                          <Text style={styles.label}>Discount</Text>
                                          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
                                            <View style={styles.discountTypeSelector}>
                                              <TouchableOpacity
                                                style={[
                                                  styles.discountTypeButton,
                                                  existingProductDiscountType === 'percentage' && styles.discountTypeButtonSelected
                                                ]}
                                                onPress={() => setExistingProductDiscountType('percentage')}
                                              >
                                                <Text style={[
                                                  styles.discountTypeButtonText,
                                                  existingProductDiscountType === 'percentage' && styles.discountTypeButtonTextSelected
                                                ]}>%</Text>
                                              </TouchableOpacity>
                                              <TouchableOpacity
                                                style={[
                                                  styles.discountTypeButton,
                                                  existingProductDiscountType === 'fixed' && styles.discountTypeButtonSelected
                                                ]}
                                                onPress={() => setExistingProductDiscountType('fixed')}
                                              >
                                                <Text style={[
                                                  styles.discountTypeButtonText,
                                                  existingProductDiscountType === 'fixed' && styles.discountTypeButtonTextSelected
                                                ]}>$</Text>
                                              </TouchableOpacity>
                                            </View>
                                            <TextInput
                                              style={[styles.discountInput, { flex: 1 }]}
                                              value={existingProductDiscount}
                                              onChangeText={setExistingProductDiscount}
                                              placeholder={existingProductDiscountType === 'percentage' ? "20" : "5.00"}
                                              keyboardType="decimal-pad"
                                            />
                                          </View>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                          <TouchableOpacity
                                            style={[styles.createButton, { flex: 1, paddingVertical: 6 }]}
                                            onPress={async () => {
                                              if (!existingProductDiscount) {
                                                Alert.alert("Error", "Please enter a discount");
                                                return;
                                              }
                                              const discountValue = parseFloat(existingProductDiscount);
                                              if (isNaN(discountValue) || discountValue <= 0) {
                                                Alert.alert("Error", "Please enter a valid discount");
                                                return;
                                              }
                                              if (existingProductDiscountType === 'percentage' && discountValue > 100) {
                                                Alert.alert("Error", "Percentage discount cannot exceed 100%");
                                                return;
                                              }
                                              if (existingProductDiscountType === 'fixed' && discountValue >= parseFloat(product.price.toString())) {
                                                Alert.alert("Error", "Fixed discount must be less than product price");
                                                return;
                                              }
                                              if (editForm.startsAt && editForm.endsAt) {
                                                try {
                                                  await createPromotion({
                                                    title: editForm.title,
                                                    type: existingProductDiscountType,
                                                    description: editForm.description || `${existingProductDiscountType === 'percentage' ? `${discountValue}%` : `$${discountValue}`} off`,
                                                    startsAt: editForm.startsAt.toISOString(),
                                                    endsAt: editForm.endsAt.toISOString(),
                                                    discount: discountValue,
                                                    productIds: [product.id],
                                                  }).unwrap();
                                                  if (storeId) {
                                                    await findActivePromotions(storeId);
                                                  }
                                                  setAddingExistingProductId(null);
                                                  setExistingProductDiscount("");
                                                  Alert.alert("Success", "Product added to promotion");
                                                } catch (error: any) {
                                                  Alert.alert("Error", error?.message || "Failed to add product to promotion");
                                                }
                                              }
                                            }}
                                          >
                                            <Text style={[styles.createButtonText, { fontSize: 12 }]}>Add</Text>
                                          </TouchableOpacity>
                                          <TouchableOpacity
                                            style={[styles.createButton, styles.createButtonDisabled, { flex: 1, paddingVertical: 6 }]}
                                            onPress={() => {
                                              setAddingExistingProductId(null);
                                              setExistingProductDiscount("");
                                            }}
                                          >
                                            <Text style={[styles.createButtonText, { fontSize: 12 }]}>Cancel</Text>
                                          </TouchableOpacity>
                                        </View>
                                      </View>
                                    )}
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>

                          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                            <TouchableOpacity style={[styles.createButton, { flex: 1 }]} onPress={saveEdit}>
                              <Text style={styles.createButtonText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.createButton, styles.createButtonDisabled, { flex: 1 }]} onPress={cancelEdit}>
                              <Text style={styles.createButtonText}>Cancel</Text>
                            </TouchableOpacity>
                          </View>

                          {showEditStartPicker && (
                            <DateTimePicker
                              value={editForm.startsAt || new Date()}
                              mode="date"
                              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                              onChange={handleEditStartChange}
                              minimumDate={new Date()}
                            />
                          )}
                          {showEditEndPicker && (
                            <DateTimePicker
                              value={editForm.endsAt || (editForm.startsAt || new Date())}
                              mode="date"
                              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                              onChange={handleEditEndChange}
                              minimumDate={editForm.startsAt || new Date()}
                            />
                          )}
                        </View>
                      )}
                    </View>
                  );
                });
              })()}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
          minimumDate={new Date()}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
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
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputIcon: {
    marginRight: 10,
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
  productCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  productContent: {
    flexDirection: "row",
    alignItems: "center",
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
    backgroundColor: "#FFBE5D",
    borderColor: "#FFBE5D",
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 10,
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
    color: "#6B7280",
  },
  infoCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
  },
  infoText: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  createButton: {
    backgroundColor: "#FFBE5D",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: "#FFBE5D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  createButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.1,
    elevation: 2,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 10,
  },
  typeButton: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  typeButtonSelected: {
    backgroundColor: "#FFBE5D",
    borderColor: "#FFBE5D",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  typeButtonTextSelected: {
    color: "#ffffff",
  },
  loadingContainer: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyContainer: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    marginBottom: 10,
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
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
    marginTop: 8,
  },
  unavailableSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  unavailableProductCard: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    opacity: 0.7,
  },
  unavailableCheckbox: {
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
  },
  unavailableProductName: {
    color: "#9CA3AF",
  },
  unavailableProductPrice: {
    color: "#9CA3AF",
  },
  unavailableText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "500",
    marginTop: 2,
  },
  discountPreview: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#10B981",
  },
  discountPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    marginBottom: 8,
  },
  discountPreviewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  discountPreviewProduct: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  discountPreviewPrice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  discountPreviewOriginal: {
    fontSize: 12,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  discountPreviewNew: {
    fontSize: 13,
    fontWeight: "600",
    color: "#10B981",
  },
  discountPreviewType: {
    fontSize: 11,
    color: "#6B7280",
    marginLeft: 4,
  },
  discountInputContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  discountLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  discountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  discountTypeSelector: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    overflow: "hidden",
  },
  discountTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
  },
  discountTypeButtonSelected: {
    backgroundColor: "#FFBE5D",
  },
  discountTypeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  discountTypeButtonTextSelected: {
    color: "#ffffff",
  },
  discountInput: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    color: "#374151",
  },
  discountHelperText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
    fontStyle: "italic",
  },
});