import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
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
  const { state: { user } } = useLogin();
  const { action: { findProducts, createPromotion, findActivePromotions, updatePromotion }, state: { products, activePromotions, loading: productsLoading, error } } = useStore();
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

  useEffect(() => {
    // Check if store setup is completed when component mounts
   

    // Fetch products and active promotions for the current user's store
    if (user && (user as any).id) {
      findProducts({ storeId: Number((user as any).id) });
      findActivePromotions(Number((user as any).id)); // Fetch active promotions only for this store
    }
  }, [user]);

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
    const promotedProductIds = activePromotions.map(promotion => promotion.productId);
    return products.filter(product => !promotedProductIds.includes(product.id));
  };

  // Check if a product is already in an active promotion
  const isProductInActivePromotion = (productId: number) => {
    return activePromotions.some(promotion => promotion.productId === productId);
  };

  const availableProducts = getAvailableProducts();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const makeGroupKey = (p: any) => `${p.title || ''}|${p.startsAt || ''}|${p.endsAt || ''}`;

  const beginEdit = (groupSample: any) => {
    const key = makeGroupKey(groupSample);
    setEditingKey(key);
    setEditForm({
      title: groupSample.title || "",
      description: groupSample.description || "",
      startsAt: groupSample.startsAt ? new Date(groupSample.startsAt) : null,
      endsAt: groupSample.endsAt ? new Date(groupSample.endsAt) : null,
      active: !!groupSample.active,
    });
  };

  const cancelEdit = () => {
    setEditingKey(null);
  };

  const handleEditStartChange = (event: any, selectedDate?: Date) => {
    setShowEditStartPicker(false);
    if (selectedDate) setEditForm(prev => ({ ...prev, startsAt: selectedDate }));
  };

  const handleEditEndChange = (event: any, selectedDate?: Date) => {
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
      const groupPromos = activePromotions.filter((p: any) => makeGroupKey(p) === editingKey);
      await Promise.all(
        groupPromos.map((p: any) =>
          updatePromotion({
            id: p.id,
            title: editForm.title,
            description: editForm.description,
            startsAt: start.toISOString(),
            endsAt: end.toISOString(),
            active: editForm.active,
          })
        )
      );
      // Optionally refresh active list for safety
      if (user && (user as any).id) {
        findActivePromotions(Number((user as any).id));
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
      if (!productData.discount.trim()) {
        alert(`Please enter a discount for all selected products`);
        return;
      }
      
      const discount = parseFloat(productData.discount);
      if (isNaN(discount) || discount <= 0) {
        alert(`Please enter a valid discount amount for all products`);
        return;
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

    setIsCreating(true);

    try {
      // Create promotion for each selected product with individual discounts
      const promises = selectedProductIds.map(productId => {
        const productData = selectedProducts[productId];
        return createPromotion({
          title: promotionTitle,
          type: productData.type,
          description: description || `${productData.type === 'percentage' ? `${productData.discount}%` : `$${productData.discount}`} off`,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          discount: parseFloat(productData.discount),
          productId: parseInt(productId),
        });
      });

      await Promise.all(promises);
      
      // Refresh active promotions to show the new promotion in dashboard
      if (user && (user as any).id) {
        findActivePromotions(Number((user as any).id));
      }
      
      // Reset form
      setPromotionTitle("");
      setStartDate(new Date());
      setEndDate(new Date());
      setSelectedProducts({});
      setDescription("");
      
      alert("Promotion created successfully!");
    } catch (error) {
      console.error("Error creating promotion:", error);
      alert("Failed to create promotion. Please try again.");
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
            ) : products.length > 0 ? (
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
                                  onChangeText={(text) => updateProductDiscount(product.id.toString(), text)}
                                  keyboardType="numeric"
                                  placeholderTextColor="#9CA3AF"
                                />
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Unavailable Products (Already in Promotions) */}
                {products.filter(product => isProductInActivePromotion(product.id)).length > 0 && (
                  <View style={styles.unavailableSection}>
                    <Text style={styles.sectionSubtitle}>Currently in Active Promotions</Text>
                    {products.filter(product => isProductInActivePromotion(product.id)).map((product) => (
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
                  const product = products.find(p => p.id.toString() === productId);
                  if (!product || !productData.discount) return null;
                  
                  const discount = parseFloat(productData.discount);
                  if (isNaN(discount)) return null;
                  
                  const discountedPrice = productData.type === 'percentage' 
                    ? product.price * (1 - discount / 100)
                    : Math.max(0, product.price - discount);
                  
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
                const groups: { [key: string]: { promos: any[]; sample: any } } = {};
                for (const promo of activePromotions as any[]) {
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
                              const product = products.find(pr => pr.id === p.productId);
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

                          <View style={[styles.inputGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                            <Text style={styles.label}>Active</Text>
                            <TouchableOpacity onPress={() => setEditForm(prev => ({ ...prev, active: !prev.active }))}>
                              <Ionicons name={editForm.active ? 'toggle' : 'toggle-outline'} size={36} color={editForm.active ? '#10B981' : '#9CA3AF'} />
                            </TouchableOpacity>
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
});