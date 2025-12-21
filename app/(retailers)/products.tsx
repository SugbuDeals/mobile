import { Modal as CustomModal } from "@/components/Modal";
import { PaginationControls } from "@/components/PaginationControls";
import { SearchBar } from "@/components/SearchBar";
import { useLogin } from "@/features/auth";
import { useCatalog } from "@/features/catalog";
import { useStore } from "@/features/store";
import { selectIsDeletingProduct } from "@/features/store/products/slice";
import type { Product } from "@/features/store/products/types";
import { useModal } from "@/hooks/useModal";
import { useStableThunk } from "@/hooks/useStableCallback";
import { useAppSelector } from "@/store/hooks";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

// Helper function to get icon name based on category name
const getCategoryIcon = (categoryName: string): keyof typeof Ionicons.glyphMap => {
  const name = categoryName.toLowerCase();
  if (name.includes("gadget") || name.includes("electronics") || name.includes("tech")) {
    return "phone-portrait-outline";
  }
  if (name.includes("cloth") || name.includes("apparel") || name.includes("fashion")) {
    return "shirt-outline";
  }
  if (name.includes("food") || name.includes("grocery")) {
    return "restaurant-outline";
  }
  if (name.includes("book") || name.includes("stationery")) {
    return "library-outline";
  }
  if (name.includes("sport") || name.includes("fitness")) {
    return "barbell-outline";
  }
  if (name.includes("beauty") || name.includes("cosmetic")) {
    return "sparkles-outline";
  }
  if (name.includes("home") || name.includes("furniture")) {
    return "home-outline";
  }
  if (name.includes("toy") || name.includes("game")) {
    return "game-controller-outline";
  }
  if (name.includes("health") || name.includes("medical")) {
    return "medical-outline";
  }
  if (name.includes("car") || name.includes("auto") || name.includes("vehicle")) {
    return "car-outline";
  }
  // Default icon
  return "pricetags-outline";
};

export default function Products() {
  const { state: { user } } = useLogin();
  const { action: { findProducts, deleteProduct, updateProduct, createProduct }, state: { products, loading, userStore } } = useStore();
  const { action: { loadCategories }, state: { categories } } = useCatalog();
  const { isOpen: deleteModalVisible, data: productToDelete, open: openDeleteModal, close: closeDeleteModal } = useModal<Product>();
  const isDeleting = useAppSelector((state) => 
    productToDelete ? selectIsDeletingProduct(state, productToDelete.id) : false
  );
  const lastFetchedStoreIdRef = useRef<number | null>(null);
  const lastFetchedUserIdRef = useRef<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid" | "compact">("grid"); // Default to grid for visual browsing
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [updatingStockIds, setUpdatingStockIds] = useState<Set<number>>(new Set());
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showDeactivatedProducts, setShowDeactivatedProducts] = useState(false);
  
  // Check if user is admin
  const isAdmin = useMemo(() => {
    if (!user) return false;
    const userType = String(user.user_type ?? "").trim().toLowerCase();
    const role = String(user.role ?? "").trim().toLowerCase();
    return (
      userType === "admin" || 
      role === "admin" || 
      userType === "administrator" ||
      role === "administrator" ||
      String(user.user_type ?? "").toUpperCase() === "ADMIN" ||
      String(user.role ?? "").toUpperCase() === "ADMIN"
    );
  }, [user]);
  
  // New inventory tools state
  const [quickFilter] = useState<"all" | "lowStock" | "outOfStock" | "active" | "inactive">("all");
  const [sortBy] = useState<"name" | "price" | "stock" | "date">("name");
  const [sortOrder] = useState<"asc" | "desc">("asc");
  
  // Multi-select and bulk operations state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [bulkPriceAction, setBulkPriceAction] = useState<"increase" | "decrease" | "set" | null>(null);
  const [bulkPriceValue, setBulkPriceValue] = useState("");
  const [bulkPriceType, setBulkPriceType] = useState<"percentage" | "fixed">("percentage");
  const [isApplyingBulkUpdate, setIsApplyingBulkUpdate] = useState(false);
  
  // Bulk stock operations state
  const [showBulkStockModal, setShowBulkStockModal] = useState(false);
  const [bulkStockAction, setBulkStockAction] = useState<"add" | "subtract" | "set">("add");
  const [bulkStockValue, setBulkStockValue] = useState("");
  const [isApplyingBulkStock, setIsApplyingBulkStock] = useState(false);
  
  // Phase 3: Duplicate and advanced features
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [productToDuplicate, setProductToDuplicate] = useState<Product | null>(null);
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicatePrice, setDuplicatePrice] = useState("");
  const [duplicateStock, setDuplicateStock] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);
  
  // Batch category assignment
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [selectedCategoryForBulk, setSelectedCategoryForBulk] = useState<number | null>(null);

  // Stable thunk references
  const stableFindProducts = useStableThunk(findProducts);
  const categoriesLoadedRef = useRef(false);

  // Load categories on mount (only once)
  useEffect(() => {
    if (!categoriesLoadedRef.current && (!categories || categories.length === 0)) {
      categoriesLoadedRef.current = true;
      loadCategories();
    }
  }, [categories?.length, loadCategories]);

  // Get categories that have products in the store
  const availableCategories = useMemo(() => {
    if (!categories.length || !products.length) return [];
    
    // Get unique category IDs from products
    const productCategoryIds = new Set(
      products
        .map((p) => p.categoryId)
        .filter((id): id is number => id !== null && id !== undefined)
    );
    
    // Filter categories to only those that have products
    return categories.filter((cat) => productCategoryIds.has(cat.id));
  }, [categories, products]);

  // Inventory statistics
  const inventoryStats = useMemo(() => {
    const outOfStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
    const inStock = products.filter(p => p.stock > 10).length;
    return { outOfStock, lowStock, inStock };
  }, [products]);

  // Derived state: filtered products based on search query and category
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by active/inactive status - show only active products by default, or deactivated if viewing deactivated section
    if (showDeactivatedProducts) {
      filtered = filtered.filter(p => !p.isActive);
    } else {
      // By default, only show active products
      filtered = filtered.filter(p => p.isActive);
    }

    // Filter by low stock if enabled (legacy support)
    if (showLowStockOnly) {
      filtered = filtered.filter(p => p.stock <= 10);
    }

    // Apply quick filters
    if (quickFilter === "lowStock") {
      filtered = filtered.filter(p => p.stock > 0 && p.stock <= 10);
    } else if (quickFilter === "outOfStock") {
      filtered = filtered.filter(p => p.stock === 0);
    } else if (quickFilter === "active") {
      filtered = filtered.filter(p => p.isActive);
    } else if (quickFilter === "inactive") {
      filtered = filtered.filter(p => !p.isActive);
    }

    // Filter by category
    if (selectedCategoryId !== null) {
      filtered = filtered.filter(
        (product) => product.categoryId === selectedCategoryId
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "price":
          comparison = parseFloat(a.price) - parseFloat(b.price);
          break;
        case "stock":
          comparison = a.stock - b.stock;
          break;
        case "date":
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [products, searchQuery, selectedCategoryId, showLowStockOnly, quickFilter, sortBy, sortOrder, showDeactivatedProducts]);

  // Get count of deactivated products
  const deactivatedProductsCount = useMemo(() => {
    return products.filter(p => !p.isActive).length;
  }, [products]);

  useEffect(() => {
    const storeId = userStore?.id;
    const userId = user?.id ? Number(user.id) : null;

    // Skip if we've already fetched for this store
    if (storeId && lastFetchedStoreIdRef.current === storeId) {
      return;
    }
    // Skip if we've already fetched for this user (fallback case)
    if (userId && !storeId && lastFetchedUserIdRef.current === userId) {
      return;
    }

    if (storeId) {
      lastFetchedStoreIdRef.current = storeId;
      stableFindProducts({ storeId });
    } else if (userId) {
      lastFetchedUserIdRef.current = userId;
      stableFindProducts({ storeId: userId });
    }
  }, [userStore?.id, user?.id, stableFindProducts]);

  // Refresh products when component comes into focus (only if data is stale or missing)
  const lastFocusRef = useRef<number | null>(null);
  useFocusEffect(
    useCallback(() => {
      const storeId = userStore?.id;
      const userId = user?.id ? Number(user.id) : null;
      const currentId = storeId || userId;

      // Only refetch if store/user ID changed or if we don't have products yet
      if (currentId && (lastFocusRef.current !== currentId || !products || products.length === 0)) {
        lastFocusRef.current = currentId;
        if (storeId) {
          stableFindProducts({ storeId });
        } else if (userId) {
          stableFindProducts({ storeId: userId });
        }
      }
    }, [userStore?.id, user?.id, stableFindProducts, products?.length])
  );

  const getStockStatusColor = (stock: number) => {
    if (stock > 10) return "#10B981"; // In Stock
    if (stock > 0) return "#F59E0B"; // Low Stock
    return "#EF4444"; // Out of Stock
  };

  const getStockStatusText = (stock: number) => {
    if (stock > 10) return "In Stock";
    if (stock > 0) return "Low Stock";
    return "Out of Stock";
  };

  const handleEdit = (productId: string) => {
    router.push(`/(retailers)/edit-product?productId=${productId}`);
  };

  const handleDelete = (product: Product) => {
    openDeleteModal(product);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        await deleteProduct(Number(productToDelete.id));
        
        // Refresh the products list after successful deletion
        if (userStore?.id) {
          await findProducts({ storeId: userStore.id });
        }
        
        closeDeleteModal();
      } catch (error) {
        console.error("Error deleting product:", error);
        // Keep modal open on error so user can try again
      }
    }
  };

  const cancelDelete = () => {
    closeDeleteModal();
  };

  const handleAddProduct = () => {
    router.push("/(retailers)/add-product");
  };

  const toggleViewMode = () => {
    setViewMode((prev) => {
      if (prev === "grid") return "list";
      if (prev === "list") return "compact";
      return "grid";
    });
  };

  // Multi-select handlers
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedProductIds(new Set()); // Clear selection when toggling mode
  };

  const toggleProductSelection = (productId: number) => {
    setSelectedProductIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectAllProducts = () => {
    const allIds = new Set(filteredProducts.map(p => p.id));
    setSelectedProductIds(allIds);
  };

  const deselectAllProducts = () => {
    setSelectedProductIds(new Set());
  };

  const cancelMultiSelect = () => {
    setIsMultiSelectMode(false);
    setSelectedProductIds(new Set());
  };

  // Quick stock update handler
  const handleQuickStockUpdate = async (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    
    // Prevent redundant updates
    if (newStock === product.stock) return;
    
    // Add to updating set
    setUpdatingStockIds(prev => new Set(prev).add(product.id));
    
    try {
      await updateProduct({ 
        id: product.id, 
        stock: newStock 
      });
      
      // Refresh products list to show updated stock
      if (userStore?.id) {
        await findProducts({ storeId: userStore.id });
      }
    } catch (error: any) {
      Alert.alert(
        "Update Failed",
        error?.message || "Failed to update stock. Please try again."
      );
    } finally {
      // Remove from updating set
      setUpdatingStockIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  // Bulk price update handler
  const handleBulkPriceUpdate = async () => {
    if (!bulkPriceValue || selectedProductIds.size === 0) return;

    const value = parseFloat(bulkPriceValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid positive number.");
      return;
    }

    // Calculate new prices for preview
    const selectedProducts = products.filter(p => selectedProductIds.has(p.id));
    const updates = selectedProducts.map(product => {
      const currentPrice = parseFloat(product.price);
      let newPrice = currentPrice;

      if (bulkPriceType === "percentage") {
        if (bulkPriceAction === "increase") {
          newPrice = currentPrice * (1 + value / 100);
        } else if (bulkPriceAction === "decrease") {
          newPrice = currentPrice * (1 - value / 100);
        }
      } else {
        // fixed amount
        if (bulkPriceAction === "increase") {
          newPrice = currentPrice + value;
        } else if (bulkPriceAction === "decrease") {
          newPrice = Math.max(0, currentPrice - value);
        } else if (bulkPriceAction === "set") {
          newPrice = value;
        }
      }

      return {
        id: product.id,
        name: product.name,
        oldPrice: currentPrice,
        newPrice: Math.max(0, newPrice),
      };
    });

    // Show confirmation with preview
    const previewText = updates
      .slice(0, 3)
      .map(u => `${u.name}: ₱${u.oldPrice.toFixed(2)} → ₱${u.newPrice.toFixed(2)}`)
      .join("\n");
    const moreText = updates.length > 3 ? `\n...and ${updates.length - 3} more` : "";

    Alert.alert(
      "Confirm Bulk Price Update",
      `Update ${updates.length} product(s)?\n\n${previewText}${moreText}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Apply",
          onPress: async () => {
            setIsApplyingBulkUpdate(true);
            try {
              // Update all selected products
              await Promise.all(
                updates.map(update =>
                  updateProduct({
                    id: update.id,
                    price: update.newPrice,
                  })
                )
              );

              // Refresh products list
              if (userStore?.id) {
                await findProducts({ storeId: userStore.id });
              }

              Alert.alert("Success", `Updated ${updates.length} product(s) successfully!`);
              setShowBulkPriceModal(false);
              setBulkPriceValue("");
              setSelectedProductIds(new Set());
              setIsMultiSelectMode(false);
            } catch (error: any) {
              console.error("Error updating prices:", error);
              Alert.alert(
                "Update Failed",
                error?.message || "Failed to update prices. Please try again."
              );
            } finally {
              setIsApplyingBulkUpdate(false);
            }
          },
        },
      ]
    );
  };

  // Bulk Stock Update Handler
  const handleBulkStockUpdate = async () => {
    if (!bulkStockValue || selectedProductIds.size === 0) return;

    const value = parseInt(bulkStockValue, 10);
    if (isNaN(value) || value < 0) {
      Alert.alert("Invalid Input", "Please enter a valid non-negative number.");
      return;
    }

    const selectedProducts = products.filter(p => selectedProductIds.has(p.id));
    const updates = selectedProducts.map(product => {
      let newStock = product.stock;

      if (bulkStockAction === "add") {
        newStock = product.stock + value;
      } else if (bulkStockAction === "subtract") {
        newStock = Math.max(0, product.stock - value);
      } else if (bulkStockAction === "set") {
        newStock = value;
      }

      return {
        id: product.id,
        name: product.name,
        oldStock: product.stock,
        newStock,
      };
    });

    const previewText = updates
      .slice(0, 3)
      .map(u => `${u.name}: ${u.oldStock} → ${u.newStock}`)
      .join("\n");
    const moreText = updates.length > 3 ? `\n...and ${updates.length - 3} more` : "";

    Alert.alert(
      "Confirm Bulk Stock Update",
      `Update ${updates.length} product(s)?\n\n${previewText}${moreText}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Apply",
          onPress: async () => {
            setIsApplyingBulkStock(true);
            try {
              await Promise.all(
                updates.map(update =>
                  updateProduct({
                    id: update.id,
                    stock: update.newStock,
                  })
                )
              );

              if (userStore?.id) {
                await findProducts({ storeId: userStore.id });
              }

              Alert.alert("Success", `Updated ${updates.length} product(s) successfully!`);
              setShowBulkStockModal(false);
              setBulkStockValue("");
              setSelectedProductIds(new Set());
              setIsMultiSelectMode(false);
            } catch (error: any) {
              Alert.alert("Update Failed", error?.message || "Failed to update stock. Please try again.");
            } finally {
              setIsApplyingBulkStock(false);
            }
          },
        },
      ]
    );
  };

  // Bulk Activate/Deactivate Handler
  const handleBulkActivateDeactivate = async (activate: boolean) => {
    if (selectedProductIds.size === 0) return;

    // Prevent deactivation for non-admin users
    if (!activate && !isAdmin) {
      Alert.alert(
        "Permission Denied",
        "Only administrators can deactivate products. Please contact support if you need to deactivate a product."
      );
      return;
    }

    const selectedProducts = products.filter(p => selectedProductIds.has(p.id));
    const action = activate ? "activate" : "deactivate";

    Alert.alert(
      `Confirm Bulk ${activate ? "Activation" : "Deactivation"}`,
      `${action.charAt(0).toUpperCase() + action.slice(1)} ${selectedProducts.length} product(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: activate ? "Activate" : "Deactivate",
          onPress: async () => {
            try {
              await Promise.all(
                Array.from(selectedProductIds).map(id =>
                  updateProduct({
                    id,
                    isActive: activate,
                  })
                )
              );

              if (userStore?.id) {
                await findProducts({ storeId: userStore.id });
              }

              Alert.alert("Success", `${activate ? "Activated" : "Deactivated"} ${selectedProducts.length} product(s)!`);
              setSelectedProductIds(new Set());
              setIsMultiSelectMode(false);
            } catch (error: any) {
              Alert.alert("Update Failed", error?.message || `Failed to ${action} products.`);
            }
          },
        },
      ]
    );
  };

  // Phase 3: Duplicate product handler
  const handleDuplicateProduct = (product: Product) => {
    setProductToDuplicate(product);
    setDuplicateName(`${product.name} (Copy)`);
    setDuplicatePrice(product.price);
    setDuplicateStock(product.stock.toString());
    setShowDuplicateModal(true);
  };

  const confirmDuplicate = async () => {
    if (!productToDuplicate || !userStore?.id) return;

    const price = parseFloat(duplicatePrice);
    const stock = parseInt(duplicateStock, 10);

    if (!duplicateName.trim()) {
      Alert.alert("Error", "Product name is required");
      return;
    }

    if (isNaN(price) || price < 0) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }

    if (isNaN(stock) || stock < 0) {
      Alert.alert("Error", "Please enter a valid stock quantity");
      return;
    }

    setIsDuplicating(true);
    try {
      await createProduct({
        name: duplicateName.trim(),
        description: productToDuplicate.description,
        price,
        stock,
        storeId: userStore.id,
        categoryId: productToDuplicate.categoryId ?? undefined,
        imageUrl: productToDuplicate.imageUrl ?? undefined,
        isActive: true,
      });

      // Refresh products list
      await findProducts({ storeId: userStore.id });

      Alert.alert("Success", `"${duplicateName}" created successfully!`);
      setShowDuplicateModal(false);
      setProductToDuplicate(null);
    } catch (error: any) {
      Alert.alert(
        "Duplication Failed",
        error?.message || "Failed to duplicate product. Please try again."
      );
    } finally {
      setIsDuplicating(false);
    }
  };

  // Phase 3: Batch category assignment handler
  const handleBulkCategoryUpdate = async () => {
    if (selectedCategoryForBulk === null || selectedProductIds.size === 0) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    const categoryName = categories.find(c => c.id === selectedCategoryForBulk)?.name || "Unknown";
    
    Alert.alert(
      "Confirm Category Update",
      `Assign "${categoryName}" to ${selectedProductIds.size} product(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Apply",
          onPress: async () => {
            setIsApplyingBulkUpdate(true);
            try {
              // Update all selected products
              await Promise.all(
                Array.from(selectedProductIds).map(id =>
                  updateProduct({
                    id,
                    categoryId: selectedCategoryForBulk,
                  })
                )
              );

              // Refresh products list
              if (userStore?.id) {
                await findProducts({ storeId: userStore.id });
              }

              Alert.alert("Success", `Updated ${selectedProductIds.size} product(s) successfully!`);
              setShowBulkCategoryModal(false);
              setSelectedCategoryForBulk(null);
              setSelectedProductIds(new Set());
              setIsMultiSelectMode(false);
            } catch (error: any) {
              Alert.alert(
                "Update Failed",
                error?.message || "Failed to update categories. Please try again."
              );
            } finally {
              setIsApplyingBulkUpdate(false);
            }
          },
        },
      ]
    );
  };

  // Render product card for list view
  const renderListItem = ({ item: product }: { item: Product }) => {
    const isUpdating = updatingStockIds.has(product.id);
    const isSelected = selectedProductIds.has(product.id);
    
    return (
      <TouchableOpacity
        style={[styles.productCard, isSelected && styles.productCardSelected]}
        onPress={() => isMultiSelectMode && toggleProductSelection(product.id)}
        activeOpacity={isMultiSelectMode ? 0.7 : 1}
      >
        {isMultiSelectMode && (
          <View style={styles.checkboxContainer}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Ionicons name="checkmark" size={18} color="#ffffff" />}
            </View>
          </View>
        )}
        
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.productImage}
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="cube-outline" size={32} color="#9CA3AF" />
          </View>
        )}
        
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <View style={styles.productDetails}>
              <Text style={styles.productName} numberOfLines={2} ellipsizeMode="tail">
                {product.name}
              </Text>
              <Text style={styles.productCategory} numberOfLines={2} ellipsizeMode="tail">
                {product.description || 'No description'}
              </Text>
            </View>
          </View>
          
          <View style={styles.stockStatusRow}>
            <View style={[styles.stockTag, { backgroundColor: getStockStatusColor(product.stock) }]}>
              <Text style={styles.stockText} numberOfLines={1} ellipsizeMode="tail">
              {getStockStatusText(product.stock)}
            </Text>
            </View>
            
            {/* Quick Stock Update Buttons */}
            <View style={styles.quickStockControls}>
              <TouchableOpacity 
                style={[styles.stockButton, (isUpdating || product.stock === 0) && styles.stockButtonDisabled]}
                onPress={() => handleQuickStockUpdate(product, -1)}
                disabled={isUpdating || product.stock === 0}
              >
                <Ionicons name="remove" size={16} color={product.stock === 0 ? "#9CA3AF" : "#277874"} />
              </TouchableOpacity>
              
              {isUpdating ? (
                <ActivityIndicator size="small" color="#277874" />
              ) : (
                <Text style={styles.stockValue}>{product.stock}</Text>
              )}
              
              <TouchableOpacity 
                style={[styles.stockButton, isUpdating && styles.stockButtonDisabled]}
                onPress={() => handleQuickStockUpdate(product, 1)}
                disabled={isUpdating}
              >
                <Ionicons name="add" size={16} color="#277874" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.productFooter}>
            <Text style={styles.productPrice} numberOfLines={1}>₱{product.price}</Text>
            
            {!isMultiSelectMode && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.duplicateButton]}
                  onPress={() => handleDuplicateProduct(product)}
                >
                  <Ionicons name="copy" size={16} color="#ffffff" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleEdit(product.id.toString())}
                >
                  <Ionicons name="create" size={16} color="#ffffff" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleDelete(product)}
                >
                  <Ionicons name="trash" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render product card for grid view
  const renderGridItem = ({ item: product }: { item: Product }) => {
    const screenWidth = Dimensions.get("window").width;
    const cardWidth = (screenWidth - 60) / 2; // 2 columns with padding
    const isUpdating = updatingStockIds.has(product.id);
    const isSelected = selectedProductIds.has(product.id);
    
    return (
      <TouchableOpacity
        style={[styles.gridCard, { width: cardWidth }, isSelected && styles.gridCardSelected]}
        onPress={() => {
          if (isMultiSelectMode) {
            toggleProductSelection(product.id);
          } else {
            handleEdit(product.id.toString());
          }
        }}
        activeOpacity={0.8}
      >
        {isMultiSelectMode && (
          <View style={styles.gridCheckboxContainer}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#ffffff" />}
            </View>
          </View>
        )}
        
        <View style={styles.gridImageContainer}>
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.gridImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.gridImagePlaceholder}>
              <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
            </View>
          )}
          <View style={[styles.gridStockBadge, { backgroundColor: getStockStatusColor(product.stock) }]}>
            <Text style={styles.gridStockText} numberOfLines={1} ellipsizeMode="tail">
              {getStockStatusText(product.stock)}
            </Text>
          </View>
        </View>
        
        <View style={styles.gridContent}>
          <Text style={styles.gridProductName} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.gridProductPrice} numberOfLines={1}>₱{product.price}</Text>
          
          {!isMultiSelectMode && (
            <>
              {/* Quick Stock Controls */}
              <View style={styles.gridStockControls}>
                <TouchableOpacity 
                  style={[styles.gridStockButton, (isUpdating || product.stock === 0) && styles.stockButtonDisabled]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleQuickStockUpdate(product, -5);
                  }}
                  disabled={isUpdating || product.stock === 0}
                >
                  <Ionicons name="remove-circle" size={18} color={product.stock === 0 ? "#9CA3AF" : "#277874"} />
                </TouchableOpacity>
                
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#277874" />
                ) : (
                  <Text style={styles.gridStockValue} numberOfLines={1}>{product.stock}</Text>
                )}
                
                <TouchableOpacity 
                  style={[styles.gridStockButton, isUpdating && styles.stockButtonDisabled]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleQuickStockUpdate(product, 5);
                  }}
                  disabled={isUpdating}
                >
                  <Ionicons name="add-circle" size={18} color="#277874" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.gridActions}>
                <TouchableOpacity 
                  style={[styles.gridActionButton, styles.gridDuplicateButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDuplicateProduct(product);
                  }}
                >
                  <Ionicons name="copy" size={14} color="#ffffff" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.gridActionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEdit(product.id.toString());
                  }}
                >
                  <Ionicons name="create" size={14} color="#ffffff" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.gridActionButton, styles.gridDeleteButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(product);
                  }}
                >
                  <Ionicons name="trash" size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render compact view item
  const renderCompactItem = ({ item: product }: { item: Product }) => {
    const isSelected = selectedProductIds.has(product.id);
    const stockColor = getStockStatusColor(product.stock);
    
    return (
      <TouchableOpacity
        style={[styles.compactCard, isSelected && styles.compactCardSelected]}
        onPress={() => {
          if (isMultiSelectMode) {
            toggleProductSelection(product.id);
          } else {
            handleEdit(product.id.toString());
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.compactCardContent}>
          {/* Left: Checkbox + Image */}
          <View style={styles.compactLeft}>
            {isMultiSelectMode && (
              <View style={[styles.compactCheckbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={14} color="#ffffff" />}
              </View>
            )}
            {product.imageUrl ? (
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.compactImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.compactImagePlaceholder}>
                <Ionicons name="cube-outline" size={24} color="#9CA3AF" />
              </View>
            )}
          </View>

          {/* Center: Product Info */}
          <View style={styles.compactCenter}>
            <Text style={styles.compactProductName} numberOfLines={1} ellipsizeMode="tail">
              {product.name}
            </Text>
            <View style={styles.compactInfoRow}>
              <Text style={styles.compactPrice} numberOfLines={1}>₱{product.price}</Text>
              <Text style={styles.compactDivider}>•</Text>
              <View style={[styles.compactStockBadge, { backgroundColor: stockColor }]}>
                <Text style={styles.compactStockText} numberOfLines={1}>
                  {product.stock}
                </Text>
              </View>
            </View>
          </View>

          {/* Right: Actions */}
          <View style={styles.compactRight}>
            <TouchableOpacity
              style={styles.compactEditButton}
              onPress={() => handleEdit(product.id.toString())}
            >
              <Ionicons name="create-outline" size={18} color="#277874" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
              <View style={styles.emptyContainer}>
                <Ionicons 
                  name={showDeactivatedProducts ? "ban-outline" : "cube-outline"} 
                  size={64} 
                  color="#9CA3AF" 
                />
                <Text style={styles.emptyText}>
                  {showDeactivatedProducts ? "No deactivated products" : "No products found"}
                </Text>
                <Text style={styles.emptySubtext}>
                  {showDeactivatedProducts 
                    ? "All your products are currently active" 
                    : "Try adjusting your search terms or add your first product to get started"}
                </Text>
              </View>
  );

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
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="cart" size={24} color="#ffffff" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Inventory</Text>
              <Text style={styles.headerSubtitle}>Manage your products</Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            {!isMultiSelectMode ? (
              <>
                <TouchableOpacity 
                  style={styles.viewModeButton} 
                  onPress={toggleViewMode}
                >
                  <Ionicons 
                    name={viewMode === "grid" ? "list" : viewMode === "list" ? "reorder-three" : "grid"} 
                    size={20} 
                    color="#ffffff" 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.viewModeButton} 
                  onPress={toggleMultiSelectMode}
                >
                  <Ionicons 
                    name="checkmark-circle-outline" 
                    size={20} 
                    color="#ffffff" 
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
                  <Ionicons name="add" size={24} color="#ffffff" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.selectionCounter}>
                  <Text style={styles.selectionCounterText}>
                    {selectedProductIds.size} selected
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.cancelSelectButton} 
                  onPress={cancelMultiSelect}
                >
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          items={products}
          placeholder="Search products..."
          filterFn={(product, query) => {
            if (!query.trim()) return true;
            const q = query.toLowerCase();
            return !!(product.name.toLowerCase().includes(q) || 
                   (product.description && product.description.toLowerCase().includes(q)));
          }}
          onSearchChange={(query) => {
            setSearchQuery(query);
          }}
        />
      </View>

      {/* Smart Inventory Alerts Banner */}
      {(inventoryStats.outOfStock > 0 || inventoryStats.lowStock > 0) && (
        <View style={styles.alertBanner}>
          <View style={styles.alertContent}>
            <View style={styles.alertIconContainer}>
              <Ionicons name="warning" size={20} color="#F59E0B" />
            </View>
            <View style={styles.alertTextContainer}>
              <Text style={styles.alertTitle} numberOfLines={1} ellipsizeMode="tail">
                Inventory Attention Needed
              </Text>
              <Text style={styles.alertSubtitle} numberOfLines={2} ellipsizeMode="tail">
                {inventoryStats.outOfStock > 0 && `${inventoryStats.outOfStock} out of stock`}
                {inventoryStats.outOfStock > 0 && inventoryStats.lowStock > 0 && ', '}
                {inventoryStats.lowStock > 0 && `${inventoryStats.lowStock} low stock`}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.alertButton}
            onPress={() => setShowLowStockOnly(!showLowStockOnly)}
          >
            <Text style={styles.alertButtonText} numberOfLines={1}>
              {showLowStockOnly ? 'Show All' : 'View'}
            </Text>
            <Ionicons 
              name={showLowStockOnly ? "close-circle" : "chevron-forward"} 
              size={16} 
              color="#277874" 
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Deactivated Products Banner */}
      {deactivatedProductsCount > 0 && (
        <View style={styles.deactivatedBanner}>
          <View style={styles.alertContent}>
            <View style={styles.deactivatedIconContainer}>
              <Ionicons name="ban" size={20} color="#EF4444" />
            </View>
            <View style={styles.alertTextContainer}>
              <Text style={styles.deactivatedTitle} numberOfLines={1} ellipsizeMode="tail">
                Deactivated Products
              </Text>
              <Text style={styles.deactivatedSubtitle} numberOfLines={2} ellipsizeMode="tail">
                {deactivatedProductsCount} product{deactivatedProductsCount !== 1 ? 's' : ''} {isAdmin ? 'deactivated' : 'deactivated by admin'} 
                {!isAdmin && ' due to policy violations'}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.alertButton}
            onPress={() => {
              setShowDeactivatedProducts(!showDeactivatedProducts);
              setShowLowStockOnly(false);
            }}
          >
            <Text style={styles.alertButtonText} numberOfLines={1}>
              {showDeactivatedProducts ? 'Show Active' : 'View'}
            </Text>
            <Ionicons 
              name={showDeactivatedProducts ? "close-circle" : "chevron-forward"} 
              size={16} 
              color="#277874" 
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Category Filter */}
      {availableCategories.length > 0 && (
        <View style={styles.categoryContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategoryId === null && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategoryId(null)}
            >
              <View style={[
                styles.categoryIconCircle,
                selectedCategoryId === null && styles.categoryIconCircleActive
              ]}>
                <Ionicons 
                  name="apps-outline" 
                  size={20} 
                  color={selectedCategoryId === null ? "#ffffff" : "#6B7280"} 
                />
              </View>
              <Text style={[
                styles.categoryText,
                selectedCategoryId === null && styles.categoryTextActive
              ]}>
                All
              </Text>
            </TouchableOpacity>

            {availableCategories.map((category, index) => (
              <TouchableOpacity
                key={`category-chip-${category.id}-${index}`}
                style={[
                  styles.categoryChip,
                  selectedCategoryId === category.id && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategoryId(
                  selectedCategoryId === category.id ? null : category.id
                )}
              >
                <View style={[
                  styles.categoryIconCircle,
                  selectedCategoryId === category.id && styles.categoryIconCircleActive
                ]}>
                  <Ionicons 
                    name={getCategoryIcon(category.name)} 
                    size={20} 
                    color={selectedCategoryId === category.id ? "#ffffff" : "#6B7280"} 
                  />
                </View>
                <Text style={[
                  styles.categoryText,
                  selectedCategoryId === category.id && styles.categoryTextActive
                ]} numberOfLines={1}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Product List/Grid/Compact */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : viewMode === "grid" ? (
        <FlatList
          key={`grid-${viewMode}`}
          data={filteredProducts}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
        />
      ) : viewMode === "compact" ? (
        <FlatList
          key={`compact-${viewMode}`}
          data={filteredProducts}
          renderItem={renderCompactItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={15}
          windowSize={7}
          initialNumToRender={15}
        />
      ) : (
        <PaginationControls
          key={`list-${viewMode}`}
          totalItems={filteredProducts.length}
          items={filteredProducts}
          initialPage={1}
          initialItemsPerPage={10}
          autoCalculateItemsPerPage={true}
          reservedHeight={345}
          itemHeight={164}
        >
          {(paginatedProducts) => (
            <FlatList
              key={`list-flatlist-${viewMode}`}
              data={paginatedProducts}
              renderItem={renderListItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={5}
              windowSize={5}
            />
        )}
      </PaginationControls>
      )}

      {/* Floating Action Button for Bulk Operations */}
      {isMultiSelectMode && selectedProductIds.size > 0 && (
        <View style={styles.fabContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fabScrollContent}
          >
            <TouchableOpacity 
              style={styles.selectAllButton}
              onPress={selectedProductIds.size === filteredProducts.length ? deselectAllProducts : selectAllProducts}
            >
              <Ionicons 
                name={selectedProductIds.size === filteredProducts.length ? "remove-circle" : "add-circle"} 
                size={18} 
                color="#277874" 
              />
              <Text style={styles.selectAllButtonText}>
                {selectedProductIds.size === filteredProducts.length ? "Deselect All" : "Select All"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.fabButton}
              onPress={() => setShowBulkPriceModal(true)}
            >
              <Ionicons name="pricetag" size={20} color="#ffffff" />
              <Text style={styles.fabButtonText}>Prices</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.fabButton, styles.fabStockButton]}
              onPress={() => setShowBulkStockModal(true)}
            >
              <Ionicons name="cube" size={20} color="#ffffff" />
              <Text style={styles.fabButtonText}>Stock</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.fabButton, styles.fabCategoryButton]}
              onPress={() => setShowBulkCategoryModal(true)}
            >
              <Ionicons name="folder" size={20} color="#ffffff" />
              <Text style={styles.fabButtonText}>Category</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.fabButton, styles.fabActivateButton]}
              onPress={() => handleBulkActivateDeactivate(true)}
            >
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.fabButtonText}>Activate</Text>
            </TouchableOpacity>
            
            {/* Only show deactivate button for admins */}
            {isAdmin && (
              <TouchableOpacity 
                style={[styles.fabButton, styles.fabDeactivateButton]}
                onPress={() => handleBulkActivateDeactivate(false)}
              >
                <Ionicons name="close-circle" size={20} color="#ffffff" />
                <Text style={styles.fabButtonText}>Deactivate</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* Bulk Price Update Modal */}
      <Modal
        visible={showBulkPriceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBulkPriceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bulkModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bulk Price Update</Text>
              <TouchableOpacity
                onPress={() => setShowBulkPriceModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.bulkModalScroll}>
              <Text style={styles.bulkModalSubtitle} numberOfLines={1}>
                Update {selectedProductIds.size} selected product(s)
              </Text>

              {/* Action Type Selection */}
              <View style={styles.bulkOptionGroup}>
                <Text style={styles.bulkOptionLabel}>Action</Text>
                <View style={styles.bulkActionButtons}>
                  <TouchableOpacity
                    style={[styles.bulkActionButton, bulkPriceAction === "increase" && styles.bulkActionButtonActive]}
                    onPress={() => setBulkPriceAction("increase")}
                  >
                    <Ionicons 
                      name="arrow-up" 
                      size={16} 
                      color={bulkPriceAction === "increase" ? "#ffffff" : "#277874"} 
                    />
                    <Text style={[styles.bulkActionButtonText, bulkPriceAction === "increase" && styles.bulkActionButtonTextActive]}>
                      Increase
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.bulkActionButton, bulkPriceAction === "decrease" && styles.bulkActionButtonActive]}
                    onPress={() => setBulkPriceAction("decrease")}
                  >
                    <Ionicons 
                      name="arrow-down" 
                      size={16} 
                      color={bulkPriceAction === "decrease" ? "#ffffff" : "#EF4444"} 
                    />
                    <Text style={[styles.bulkActionButtonText, bulkPriceAction === "decrease" && styles.bulkActionButtonTextActive]}>
                      Decrease
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.bulkActionButton, bulkPriceAction === "set" && styles.bulkActionButtonActive]}
                    onPress={() => {
                      setBulkPriceAction("set");
                      setBulkPriceType("fixed");
                    }}
                  >
                    <Ionicons 
                      name="create" 
                      size={16} 
                      color={bulkPriceAction === "set" ? "#ffffff" : "#6B7280"} 
                    />
                    <Text style={[styles.bulkActionButtonText, bulkPriceAction === "set" && styles.bulkActionButtonTextActive]}>
                      Set To
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Type Selection (only for increase/decrease) */}
              {bulkPriceAction !== "set" && (
                <View style={styles.bulkOptionGroup}>
                  <Text style={styles.bulkOptionLabel}>Type</Text>
                  <View style={styles.bulkTypeButtons}>
                    <TouchableOpacity
                      style={[styles.bulkTypeButton, bulkPriceType === "percentage" && styles.bulkTypeButtonActive]}
                      onPress={() => setBulkPriceType("percentage")}
                    >
                      <Text style={[styles.bulkTypeButtonText, bulkPriceType === "percentage" && styles.bulkTypeButtonTextActive]}>
                        Percentage (%)
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.bulkTypeButton, bulkPriceType === "fixed" && styles.bulkTypeButtonActive]}
                      onPress={() => setBulkPriceType("fixed")}
                    >
                      <Text style={[styles.bulkTypeButtonText, bulkPriceType === "fixed" && styles.bulkTypeButtonTextActive]}>
                        Fixed Amount (₱)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Value Input */}
              <View style={styles.bulkOptionGroup}>
                <Text style={styles.bulkOptionLabel}>
                  {bulkPriceAction === "set" 
                    ? "New Price (₱)" 
                    : `${bulkPriceType === "percentage" ? "Percentage" : "Amount (₱)"}`}
                </Text>
                <TextInput
                  style={styles.bulkValueInput}
                  placeholder={bulkPriceAction === "set" ? "Enter new price" : "Enter value"}
                  value={bulkPriceValue}
                  onChangeText={setBulkPriceValue}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Example Preview */}
              {bulkPriceValue && bulkPriceAction && (
                <View style={styles.bulkPreviewCard}>
                  <Text style={styles.bulkPreviewTitle}>Example</Text>
                  <Text style={styles.bulkPreviewText}>
                    {(() => {
                      const examplePrice = 100;
                      const value = parseFloat(bulkPriceValue);
                      let newPrice = examplePrice;
                      
                      if (bulkPriceType === "percentage" && bulkPriceAction !== "set") {
                        if (bulkPriceAction === "increase") {
                          newPrice = examplePrice * (1 + value / 100);
                        } else {
                          newPrice = examplePrice * (1 - value / 100);
                        }
                      } else {
                        if (bulkPriceAction === "increase") {
                          newPrice = examplePrice + value;
                        } else if (bulkPriceAction === "decrease") {
                          newPrice = Math.max(0, examplePrice - value);
                        } else {
                          newPrice = value;
                        }
                      }
                      
                      return `₱${examplePrice.toFixed(2)} → ₱${newPrice.toFixed(2)}`;
                    })()}
                  </Text>
                </View>
              )}

              {/* Apply Button */}
              <TouchableOpacity
                style={[styles.bulkApplyButton, (!bulkPriceValue || !bulkPriceAction || isApplyingBulkUpdate) && styles.bulkApplyButtonDisabled]}
                onPress={handleBulkPriceUpdate}
                disabled={!bulkPriceValue || !bulkPriceAction || isApplyingBulkUpdate}
              >
                {isApplyingBulkUpdate ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                    <Text style={styles.bulkApplyButtonText}>
                      Apply to {selectedProductIds.size} Product(s)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bulk Stock Update Modal */}
      <Modal
        visible={showBulkStockModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBulkStockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bulkModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bulk Stock Update</Text>
              <TouchableOpacity
                onPress={() => setShowBulkStockModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.bulkModalScroll}>
              <Text style={styles.bulkModalSubtitle} numberOfLines={1}>
                Update stock for {selectedProductIds.size} selected product(s)
              </Text>

              {/* Action Type Selection */}
              <View style={styles.bulkOptionGroup}>
                <Text style={styles.bulkOptionLabel}>Action</Text>
                <View style={styles.bulkActionButtons}>
                  <TouchableOpacity
                    style={[styles.bulkActionButton, bulkStockAction === "add" && styles.bulkActionButtonActive]}
                    onPress={() => setBulkStockAction("add")}
                  >
                    <Ionicons 
                      name="add-circle" 
                      size={16} 
                      color={bulkStockAction === "add" ? "#ffffff" : "#10B981"} 
                    />
                    <Text style={[styles.bulkActionButtonText, bulkStockAction === "add" && styles.bulkActionButtonTextActive]}>
                      Add
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.bulkActionButton, bulkStockAction === "subtract" && styles.bulkActionButtonActive]}
                    onPress={() => setBulkStockAction("subtract")}
                  >
                    <Ionicons 
                      name="remove-circle" 
                      size={16} 
                      color={bulkStockAction === "subtract" ? "#ffffff" : "#EF4444"} 
                    />
                    <Text style={[styles.bulkActionButtonText, bulkStockAction === "subtract" && styles.bulkActionButtonTextActive]}>
                      Subtract
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.bulkActionButton, bulkStockAction === "set" && styles.bulkActionButtonActive]}
                    onPress={() => setBulkStockAction("set")}
                  >
                    <Ionicons 
                      name="create" 
                      size={16} 
                      color={bulkStockAction === "set" ? "#ffffff" : "#6B7280"} 
                    />
                    <Text style={[styles.bulkActionButtonText, bulkStockAction === "set" && styles.bulkActionButtonTextActive]}>
                      Set To
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Value Input */}
              <View style={styles.bulkOptionGroup}>
                <Text style={styles.bulkOptionLabel}>
                  {bulkStockAction === "set" 
                    ? "New Stock Quantity" 
                    : "Quantity"}
                </Text>
                <TextInput
                  style={styles.bulkValueInput}
                  placeholder={bulkStockAction === "set" ? "Enter new stock quantity" : "Enter quantity"}
                  value={bulkStockValue}
                  onChangeText={setBulkStockValue}
                  keyboardType="number-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Example Preview */}
              {bulkStockValue && bulkStockAction && (
                <View style={styles.bulkPreviewCard}>
                  <Text style={styles.bulkPreviewTitle}>Example</Text>
                  <Text style={styles.bulkPreviewText}>
                    {(() => {
                      const exampleStock = 50;
                      const value = parseInt(bulkStockValue, 10);
                      let newStock = exampleStock;
                      
                      if (bulkStockAction === "add") {
                        newStock = exampleStock + value;
                      } else if (bulkStockAction === "subtract") {
                        newStock = Math.max(0, exampleStock - value);
                      } else {
                        newStock = value;
                      }
                      
                      return `${exampleStock} → ${newStock}`;
                    })()}
                  </Text>
                </View>
              )}

              {/* Apply Button */}
              <TouchableOpacity
                style={[styles.bulkApplyButton, (!bulkStockValue || isApplyingBulkStock) && styles.bulkApplyButtonDisabled]}
                onPress={handleBulkStockUpdate}
                disabled={!bulkStockValue || isApplyingBulkStock}
              >
                {isApplyingBulkStock ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                    <Text style={styles.bulkApplyButtonText}>
                      Apply to {selectedProductIds.size} Product(s)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Duplicate Product Modal */}
      <Modal
        visible={showDuplicateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDuplicateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bulkModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Duplicate Product</Text>
              <TouchableOpacity
                onPress={() => setShowDuplicateModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.bulkModalScroll}>
              <Text style={styles.bulkModalSubtitle}>
                Create a copy of &quot;{productToDuplicate?.name}&quot;
              </Text>

              <View style={styles.bulkOptionGroup}>
                <Text style={styles.bulkOptionLabel}>Product Name</Text>
                <TextInput
                  style={styles.bulkValueInput}
                  placeholder="Enter product name"
                  value={duplicateName}
                  onChangeText={setDuplicateName}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.bulkOptionGroup}>
                <Text style={styles.bulkOptionLabel}>Price (₱)</Text>
                <TextInput
                  style={styles.bulkValueInput}
                  placeholder="Enter price"
                  value={duplicatePrice}
                  onChangeText={setDuplicatePrice}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.bulkOptionGroup}>
                <Text style={styles.bulkOptionLabel}>Stock Quantity</Text>
                <TextInput
                  style={styles.bulkValueInput}
                  placeholder="Enter stock quantity"
                  value={duplicateStock}
                  onChangeText={setDuplicateStock}
                  keyboardType="number-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.duplicateInfoCard}>
                <Ionicons name="information-circle" size={20} color="#0F766E" />
                <Text style={styles.duplicateInfoText}>
                  The duplicated product will keep the same description, category, and image as the original.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.bulkApplyButton, (!duplicateName.trim() || isDuplicating) && styles.bulkApplyButtonDisabled]}
                onPress={confirmDuplicate}
                disabled={!duplicateName.trim() || isDuplicating}
              >
                {isDuplicating ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="copy" size={20} color="#ffffff" />
                    <Text style={styles.bulkApplyButtonText}>Create Duplicate</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bulk Category Assignment Modal */}
      <Modal
        visible={showBulkCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBulkCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bulkModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Category</Text>
              <TouchableOpacity
                onPress={() => setShowBulkCategoryModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.bulkModalScroll}>
              <Text style={styles.bulkModalSubtitle}>
                Assign category to {selectedProductIds.size} selected product(s)
              </Text>

              <View style={styles.bulkOptionGroup}>
                <Text style={styles.bulkOptionLabel}>Select Category</Text>
                <ScrollView style={styles.categoryListContainer}>
                  {categories.map((category, index) => (
                    <TouchableOpacity
                      key={`category-list-${category.id}-${index}`}
                      style={[
                        styles.categoryListItem,
                        selectedCategoryForBulk === category.id && styles.categoryListItemSelected
                      ]}
                      onPress={() => setSelectedCategoryForBulk(category.id)}
                    >
                      <View style={styles.categoryListItemLeft}>
                        <Ionicons 
                          name={getCategoryIcon(category.name)} 
                          size={24} 
                          color={selectedCategoryForBulk === category.id ? "#ffffff" : "#277874"} 
                        />
                        <Text style={[
                          styles.categoryListItemText,
                          selectedCategoryForBulk === category.id && styles.categoryListItemTextSelected
                        ]}>
                          {category.name}
                        </Text>
                      </View>
                      {selectedCategoryForBulk === category.id && (
                        <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={[styles.bulkApplyButton, (selectedCategoryForBulk === null || isApplyingBulkUpdate) && styles.bulkApplyButtonDisabled]}
                onPress={handleBulkCategoryUpdate}
                disabled={selectedCategoryForBulk === null || isApplyingBulkUpdate}
              >
                {isApplyingBulkUpdate ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                    <Text style={styles.bulkApplyButtonText}>
                      Apply to {selectedProductIds.size} Product(s)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <CustomModal
        isOpen={deleteModalVisible}
        onClose={closeDeleteModal}
        variant="confirmation"
        size="small"
        title="Delete Product"
        message={productToDelete ? `Are you sure you want to delete "${productToDelete.name}"? This action cannot be undone.` : "Are you sure you want to delete this product? This action cannot be undone."}
        icon="trash-outline"
        iconColor="#EF4444"
        actions={[
          {
            label: "Cancel",
            onPress: cancelDelete,
            variant: "outline",
            loading: false,
          },
          {
            label: isDeleting ? "Deleting..." : "Delete",
            onPress: confirmDelete,
            variant: "danger",
            loading: isDeleting,
          },
        ]}
      />

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
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomRightRadius: 40,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFBE5D",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    backgroundColor: "#ffffff",
  },
  alertBanner: {
    backgroundColor: "#FEF3C7",
    borderBottomWidth: 1,
    borderBottomColor: "#F59E0B",
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alertContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  alertIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FDE68A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 12,
    color: "#B45309",
  },
  alertButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: "#277874",
  },
  alertButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#277874",
  },
  deactivatedBanner: {
    backgroundColor: "#FEE2E2",
    borderBottomWidth: 1,
    borderBottomColor: "#EF4444",
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deactivatedIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FECACA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  deactivatedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#991B1B",
    marginBottom: 2,
  },
  deactivatedSubtitle: {
    fontSize: 12,
    color: "#DC2626",
  },
  categoryContainer: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 12,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
    alignItems: "center",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    gap: 8,
    minWidth: 80,
    justifyContent: "center",
  },
  categoryChipActive: {
    backgroundColor: "#277874",
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryIconCircleActive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
    maxWidth: 100,
  },
  categoryTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    // Ensure consistent height
    minHeight: 164,
    position: "relative",
  },
  productImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    marginRight: 16,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: "#6B7280",
  },
  discountTag: {
    backgroundColor: "#FFBE5D",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  stockStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stockStatus: {
    marginBottom: 12,
  },
  stockTag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  stockText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
  },
  quickStockControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 8,
  },
  stockButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  stockButtonDisabled: {
    opacity: 0.5,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    minWidth: 30,
    textAlign: "center",
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#10B981",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFBE5D",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  activePageButton: {
    backgroundColor: "#FFBE5D",
  },
  pageButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  activePageButtonText: {
    color: "#ffffff",
  },
  loadingContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  emptyContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    marginBottom: 16,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  // Grid view styles
  gridCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridImageContainer: {
    width: "100%",
    height: 180,
    position: "relative",
    backgroundColor: "#F3F4F6",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  gridStockBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gridStockText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ffffff",
  },
  gridContent: {
    padding: 12,
  },
  gridProductName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    minHeight: 36,
  },
  gridProductPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 8,
  },
  gridStockControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingVertical: 6,
    marginBottom: 8,
    gap: 12,
  },
  gridStockButton: {
    padding: 2,
  },
  gridStockValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    minWidth: 30,
    textAlign: "center",
  },
  gridActions: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  gridActionButton: {
    flex: 1,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#FFBE5D",
    justifyContent: "center",
    alignItems: "center",
  },
  gridDeleteButton: {
    backgroundColor: "#EF4444",
  },
  // Multi-select styles
  selectionCounter: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  selectionCounterText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  cancelSelectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
  },
  gridCheckboxContainer: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#277874",
    borderColor: "#277874",
  },
  productCardSelected: {
    borderWidth: 2,
    borderColor: "#277874",
    backgroundColor: "#F0FDFA",
  },
  gridCardSelected: {
    borderWidth: 2,
    borderColor: "#277874",
    backgroundColor: "#F0FDFA",
  },
  // Floating Action Button styles
  fabContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  fabScrollContent: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 0,
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#277874",
  },
  selectAllButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#277874",
  },
  fabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#277874",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
    minWidth: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  // Bulk Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bulkModalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  modalCloseButton: {
    padding: 4,
  },
  bulkModalScroll: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  bulkModalSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 24,
  },
  bulkOptionGroup: {
    marginBottom: 24,
  },
  bulkOptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  bulkActionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  bulkActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  bulkActionButtonActive: {
    backgroundColor: "#277874",
    borderColor: "#277874",
  },
  bulkActionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  bulkActionButtonTextActive: {
    color: "#ffffff",
  },
  bulkTypeButtons: {
    flexDirection: "row",
    gap: 12,
  },
  bulkTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  bulkTypeButtonActive: {
    backgroundColor: "#E0F2F1",
    borderColor: "#277874",
  },
  bulkTypeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  bulkTypeButtonTextActive: {
    color: "#277874",
  },
  bulkValueInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#374151",
  },
  bulkPreviewCard: {
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#CCFBF1",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  bulkPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F766E",
    marginBottom: 8,
  },
  bulkPreviewText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#115E59",
  },
  bulkApplyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  bulkApplyButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
  },
  bulkApplyButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  // Phase 3: Duplicate and Category styles
  duplicateButton: {
    backgroundColor: "#8B5CF6", // Purple for duplicate
  },
  gridDuplicateButton: {
    backgroundColor: "#8B5CF6", // Purple for duplicate
  },
  // Compact View Styles
  compactCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  compactCardSelected: {
    borderColor: "#277874",
    borderWidth: 2,
    backgroundColor: "#F0FDFA",
  },
  compactCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  compactLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  compactCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  compactImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  compactImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  compactCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  compactProductName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  compactInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compactPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#277874",
  },
  compactDivider: {
    fontSize: 12,
    color: "#D1D5DB",
  },
  compactStockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 30,
    alignItems: "center",
  },
  compactStockText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  compactRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compactEditButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F0FDFA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CCFBF1",
  },
  duplicateInfoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#CCFBF1",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  duplicateInfoText: {
    flex: 1,
    fontSize: 14,
    color: "#0F766E",
    lineHeight: 20,
  },
  fabCategoryButton: {
    backgroundColor: "#F59E0B", // Amber for category
  },
  fabStockButton: {
    backgroundColor: "#10B981", // Green for stock
  },
  fabActivateButton: {
    backgroundColor: "#10B981", // Green for activate
  },
  fabDeactivateButton: {
    backgroundColor: "#EF4444", // Red for deactivate
  },
  categoryListContainer: {
    maxHeight: 300,
  },
  categoryListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  categoryListItemSelected: {
    backgroundColor: "#277874",
    borderColor: "#277874",
  },
  categoryListItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  categoryListItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  categoryListItemTextSelected: {
    color: "#ffffff",
  },
});