import TextField from "@/components/TextField";
import { useLogin } from "@/features/auth";
import { useCatalog } from "@/features/catalog";
import { useStore } from "@/features/store";
import { uploadFile } from "@/utils/fileUpload";
import { extractCustomCategory, appendCustomCategory } from "@/utils/categoryHelpers";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";


export default function EditProduct() {
  const { productId } = useLocalSearchParams();
  const { state: { user, accessToken } } = useLogin();
  const { action: { updateProduct, findProducts }, state: { loading, error, products, userStore } } = useStore();
  const { action: { loadCategories }, state: { categories } } = useCatalog();
  
  // Initialize state with empty values
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [isOthersCategory, setIsOthersCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");

  // Request image picker permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Sorry, we need camera roll permissions to upload images!');
        }
      }
    })();
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Fetch product data when component mounts
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      
      try {
        // First try to find the product in the current products list
        if (userStore?.id && products.length === 0) {
          await findProducts({ storeId: userStore.id });
        } else if (user && user.id && !userStore?.id && products.length === 0) {
          // Fallback: if userStore is not available yet, try using user ID directly
          console.log("Edit product - userStore not available, using user ID as fallback");
          await findProducts({ storeId: Number(user.id) });
        }
        
        // Find the product in the current products list from Redux store
        const productToEdit = products.find(product => product.id.toString() === productId);
        
        if (productToEdit) {
          setCurrentProduct(productToEdit);
          setProductName(productToEdit.name);
          
          // Extract custom category from description if present
          const { cleanDescription, customCategory } = extractCustomCategory(productToEdit.description);
          setDescription(cleanDescription);
          
          setPrice(productToEdit.price?.toString() || "");
          setStock(productToEdit.stock?.toString() || "");
          setIsActive(productToEdit.isActive !== false);
          const categoryId = productToEdit.categoryId ?? null;
          
          // Check if product has custom category
          if (customCategory) {
            setIsOthersCategory(true);
            setCustomCategoryName(customCategory);
            setSelectedCategoryId(null);
          } else {
            setIsOthersCategory(false);
            setCustomCategoryName("");
            setSelectedCategoryId(typeof categoryId === "number" ? categoryId : categoryId ? Number(categoryId) : null);
          }
          
          // Set existing image URL if available
          if (productToEdit.imageUrl) {
            setImageUrl(productToEdit.imageUrl);
          }
        } else if (products.length > 0) {
          // Only show error if we have products but the specific one wasn't found
          Alert.alert("Error", "Product not found");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        Alert.alert("Error", "Failed to load product data");
      }
    };

    fetchProduct();
  }, [productId, userStore?.id, user]); // Added user to dependencies for fallback

  // Separate effect to sync form with updated product data (only when products change)
  useEffect(() => {
    if (productId && products.length > 0) {
      const updatedProduct = products.find(product => product.id.toString() === productId);
      if (updatedProduct && currentProduct && updatedProduct.id === currentProduct.id) {
        // Only update form if the product data has actually changed
        const hasChanged = 
          updatedProduct.name !== productName ||
          updatedProduct.description !== description ||
          updatedProduct.price?.toString() !== price ||
          updatedProduct.stock?.toString() !== stock ||
          updatedProduct.isActive !== isActive ||
          updatedProduct.imageUrl !== imageUrl;
        
        if (hasChanged) {
          setCurrentProduct(updatedProduct);
          setProductName(updatedProduct.name);
          setDescription(updatedProduct.description || "");
          setPrice(updatedProduct.price?.toString() || "");
          setStock(updatedProduct.stock?.toString() || "");
          setIsActive(updatedProduct.isActive !== false);
          const categoryId = updatedProduct.categoryId ?? null;
          setSelectedCategoryId(typeof categoryId === "number" ? categoryId : categoryId ? Number(categoryId) : null);
          if (updatedProduct.imageUrl) {
            setImageUrl(updatedProduct.imageUrl);
          }
        }
      }
    }
  }, [products]); // This effect only runs when products array changes

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        // Keep existing imageUrl if available until new one is uploaded
        
        // Upload image immediately
        await handleImageUpload(uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleImageUpload = async (uri: string) => {
    if (!accessToken) {
      Alert.alert("Error", "Please log in to upload images.");
      return;
    }

    setUploadingImage(true);
    try {
      const result = await uploadFile(uri, accessToken);
      setImageUrl(result.url || result.filename);
      Alert.alert("Success", "Image uploaded successfully!");
    } catch (error) {
      console.error("Image upload error:", error);
      Alert.alert("Upload Error", error instanceof Error ? error.message : "Failed to upload image. Please try again.");
      setImageUri(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageUri(null);
    setImageUrl(null);
  };

  const handleSaveProduct = async () => {
    if (!productId || !currentProduct) {
      Alert.alert("Error", "Product data not loaded");
      return;
    }

    // Validate required fields
    if (!productName.trim()) {
      Alert.alert("Error", "Product name is required");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Product description is required");
      return;
    }
    
    // Validate price: must be positive number, not negative or zero
    const priceValue = Number(price);
    if (!price.trim() || isNaN(priceValue)) {
      Alert.alert("Error", "Please enter a valid numeric price");
      return;
    }
    if (priceValue <= 0) {
      Alert.alert("Error", "Price must be greater than zero. Negative prices are not allowed.");
      return;
    }
    if (priceValue < 0) {
      Alert.alert("Error", "Price cannot be negative. Please enter a positive value.");
      return;
    }
    
    // Validate stock: must be non-negative integer
    const stockValue = Number(stock);
    if (!stock.trim() || isNaN(stockValue)) {
      Alert.alert("Error", "Please enter a valid numeric stock quantity");
      return;
    }
    if (stockValue < 0) {
      Alert.alert("Error", "Stock quantity cannot be negative. Please enter 0 or a positive number.");
      return;
    }
    if (!Number.isInteger(stockValue)) {
      Alert.alert("Error", "Stock quantity must be a whole number (integer).");
      return;
    }

    // Validate custom category name if "Others" is selected
    if (isOthersCategory && !customCategoryName.trim()) {
      Alert.alert("Error", "Please enter a custom category name or select a category from the list.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // If there's a new image but it hasn't been uploaded yet, upload it first
      if (imageUri && !imageUrl && accessToken) {
        setUploadingImage(true);
        try {
          const result = await uploadFile(imageUri, accessToken);
          setImageUrl(result.url || result.filename);
        } catch (error) {
          console.error("Image upload error:", error);
          Alert.alert("Upload Error", "Failed to upload image. Updating product without new image.");
        } finally {
          setUploadingImage(false);
        }
      }

      // If custom category is used, append it to description in a structured way
      let finalDescription = description.trim();
      if (isOthersCategory && customCategoryName.trim()) {
        finalDescription = appendCustomCategory(description.trim(), customCategoryName.trim());
      }

      const updateData: any = {
        id: Number(productId),
        name: productName.trim(),
        description: finalDescription,
        price: Number(price),
        stock: Number(stock),
        ...(imageUrl && { imageUrl }), // Include imageUrl if available
        categoryId: selectedCategoryId ?? null,
      };

      console.log("Updating product with data:", updateData);
      await updateProduct(updateData);
      
      Alert.alert("Success", "Product updated successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (err) {
      console.error("Error updating product:", err);
      Alert.alert("Error", "Failed to update product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
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
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="cart" size={24} color="#ffffff" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Edit</Text>
              <Text style={styles.headerSubtitle}>Change Product Details</Text>
            </View>
          </View>
          
          <View style={styles.notificationIcon}>
            <Ionicons name="notifications" size={20} color="#ffffff" />
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          {/* Product Name */}
          <TextField
            label="Product Name"
            placeholder="Enter product name"
            value={productName}
            onChangeText={setProductName}
          />

          {/* Description */}
          <TextField
            label="Description"
            placeholder="Enter product description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80 }}
          />

          {/* Price & Stock */}
          <View style={styles.rowContainer}>
            <View style={styles.halfInput}>
              <TextField
                label="Price"
                placeholder="Enter price"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfInput}>
              <TextField
                label="Stock Quantity"
                placeholder="Enter quantity"
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowCategoryList((value) => !value)}
            >
              <Ionicons name="pricetags" size={18} color="#6B7280" />
              <Text style={{ marginLeft: 8, color: "#374151", fontSize: 16 }}>
                {isOthersCategory && customCategoryName
                  ? `Others: ${customCategoryName}`
                  : selectedCategoryId
                  ? categories.find((c) => String(c.id) === String(selectedCategoryId))?.name || "Select category"
                  : "Select category"}
              </Text>
            </TouchableOpacity>
            {showCategoryList && (
              <View style={{ marginTop: 8, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, backgroundColor: "#F9FAFB" }}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => {
                      setSelectedCategoryId(cat.id);
                      setIsOthersCategory(false);
                      setCustomCategoryName("");
                      setShowCategoryList(false);
                    }}
                    style={{ paddingVertical: 10, paddingHorizontal: 12 }}
                  >
                    <Text style={{ fontSize: 16, color: "#374151" }}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => {
                    setIsOthersCategory(true);
                    setSelectedCategoryId(null);
                    setShowCategoryList(false);
                  }}
                  style={{ 
                    paddingVertical: 10, 
                    paddingHorizontal: 12,
                    borderTopWidth: categories.length > 0 ? 1 : 0,
                    borderTopColor: "#E5E7EB",
                    backgroundColor: isOthersCategory ? "#EFF6FF" : "transparent"
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 16, color: "#374151", fontWeight: isOthersCategory ? "600" : "400" }}>
                      Others
                    </Text>
                    {isOthersCategory && (
                      <Ionicons name="checkmark-circle" size={18} color="#277874" style={{ marginLeft: 8 }} />
                    )}
                  </View>
                </TouchableOpacity>
                {categories.length === 0 && (
                  <View style={{ paddingVertical: 12, paddingHorizontal: 12 }}>
                    <Text style={{ fontSize: 14, color: "#6B7280" }}>No categories available</Text>
                  </View>
                )}
              </View>
            )}
            {isOthersCategory && (
              <View style={{ marginTop: 8 }}>
                <TextField
                  label="Custom Category Name"
                  placeholder="Enter category name (e.g., Sports Equipment, Pet Supplies)"
                  value={customCategoryName}
                  onChangeText={setCustomCategoryName}
                />
              </View>
            )}
          </View>

          {/* Active Status (read-only - managed by administrators) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Status</Text>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>
                {isActive ? "Active" : "Disabled by administrator"}
              </Text>
              <View style={[styles.toggle, isActive && styles.toggleActive]}>
                <View style={[styles.toggleThumb, isActive && styles.toggleThumbActive]} />
              </View>
            </View>
            {!isActive && (
              <Text style={styles.helperText}>
                This product has been disabled by the administrators because there is a problem
                with it. While disabled, customers cannot see or purchase this product. Please
                review the product details or contact support to resolve the issue.
              </Text>
            )}
          </View>

          {/* Product Image */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Image</Text>
            {imageUri || imageUrl ? (
              <View style={styles.imagePreview}>
                <Image 
                  source={{ uri: imageUri || imageUrl || undefined }} 
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  style={styles.editImageButton}
                  onPress={pickImage}
                  disabled={uploadingImage}
                >
                  <Ionicons name="camera" size={18} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={removeImage}
                  disabled={uploadingImage}
                >
                  <Ionicons name="trash" size={18} color="#ffffff" />
                </TouchableOpacity>
                {uploadingImage && (
                  <View style={styles.uploadingOverlay}>
                    <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
                )}
            </View>
            ) : (
              <TouchableOpacity 
                style={styles.uploadArea}
                onPress={pickImage}
                disabled={uploadingImage}
              >
                <Ionicons name="image-outline" size={40} color="#FFBE5D" />
                <Text style={styles.uploadText}>Tap to upload image</Text>
                <Text style={styles.uploadSubtext}>PNG, JPG or WEBP (Max 2MB)</Text>
                {uploadingImage && (
                  <Text style={styles.uploadingText}>Uploading...</Text>
                )}
              </TouchableOpacity>
            )}
          </View>


          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.saveButton, (isSubmitting || uploadingImage) && styles.saveButtonDisabled]} 
              onPress={handleSaveProduct}
              disabled={isSubmitting || uploadingImage}
            >
              <Text style={styles.saveButtonText}>
                {isSubmitting ? "SAVING..." : uploadingImage ? "UPLOADING..." : "SAVE"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    zIndex: 1000,
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
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  formCard: {
    backgroundColor: "#ffffff",
    marginTop: 20,
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
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#374151",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowContainer: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  stockInfo: {
    marginTop: 8,
  },
  stockInStock: {
    fontSize: 14,
    color: "#10B981",
    marginBottom: 4,
  },
  stockLow: {
    fontSize: 14,
    color: "#EF4444",
  },
  stockOut: {
    fontSize: 14,
    color: "#EF4444",
  },
  uploadArea: {
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#FFBE5D",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFBE5D",
    marginTop: 12,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: "#6B7280",
  },
  imagePreview: {
    marginTop: 8,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    resizeMode: "cover",
  },
  editImageButton: {
    position: "absolute",
    top: 8,
    right: 48,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(239, 68, 68, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtons: {
    marginTop: 5,
    flexDirection: "row",
    gap: 12,
  },
  saveButton: {
    backgroundColor: "#FFBE5D",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    flex: 1,
    shadowColor: "#FFBE5D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  cancelButton: {
    backgroundColor: "#277874",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    flex: 1,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: "#10B981",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  helperText: {
    fontSize: 12,
    color: "#B91C1C",
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  comingSoonArea: {
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
    marginBottom: 4,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  comingSoonBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  comingSoonBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#92400E",
  },
});