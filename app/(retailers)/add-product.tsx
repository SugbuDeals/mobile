import SubscriptionOverlay from "@/components/SubscriptionOverlay";
import { useLogin } from "@/features/auth";
import { useCatalog } from "@/features/catalog";
import { useStore } from "@/features/store";
import { uploadFile } from "@/utils/fileUpload";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const MAX_PRODUCTS_FREE = 10;
const MAX_PRODUCTS_BASIC = 50;
const MAX_PRODUCTS_PREMIUM = 999; // Essentially unlimited

export default function AddProduct() {
  const { state: { user, accessToken } } = useLogin();
  const { action: { createProduct, findProducts, getActiveSubscription, joinSubscription }, state: { userStore, products, activeSubscription } } = useStore();
  const { action: { loadCategories }, state: { categories } } = useCatalog();
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({});
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [showSubscriptionOverlay, setShowSubscriptionOverlay] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Get product limit based on subscription
  const getMaxProducts = () => {
    if (!activeSubscription) return MAX_PRODUCTS_FREE;
    switch (activeSubscription.plan) {
      case "PREMIUM":
        return MAX_PRODUCTS_PREMIUM;
      case "BASIC":
        return MAX_PRODUCTS_BASIC;
      case "FREE":
      default:
        return MAX_PRODUCTS_FREE;
    }
  };

  const maxProducts = getMaxProducts();

  useEffect(() => {
    // Request image picker permissions
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Sorry, we need camera roll permissions to upload images!');
        }
      }
    })();
    loadCategories();
    
    // Fetch active subscription
    if (user && (user as any).id) {
      getActiveSubscription(Number((user as any).id));
    }
    
    // Fetch products to check limit
    if (userStore?.id) {
      findProducts({ storeId: userStore.id });
    } else if (user && (user as any).id) {
      findProducts({ storeId: Number((user as any).id) });
    }
  }, [user, userStore, findProducts, loadCategories, getActiveSubscription]);

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
        setImageUrl(null); // Clear previous upload URL
        
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

  const handleAddProduct = async () => {
    // Check product limit first
    if (products.length >= maxProducts) {
      setShowSubscriptionOverlay(true);
      return;
    }

    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate required fields
    const errors: {[key: string]: boolean} = {};
    let hasErrors = false;

    if (!productName.trim()) {
      errors.productName = true;
      hasErrors = true;
    }
    if (!description.trim()) {
      errors.description = true;
      hasErrors = true;
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      errors.price = true;
      hasErrors = true;
    }
    if (!stock.trim() || isNaN(Number(stock)) || Number(stock) < 0) {
      errors.stock = true;
      hasErrors = true;
    }

    if (hasErrors) {
      setValidationErrors(errors);
      Alert.alert("Validation Error", "Please fill in all required fields correctly.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Ensure store is available
      if (!userStore?.id) {
        Alert.alert("Store required", "Please create or select your store before adding products.");
        return;
      }

      // If there's an image but it hasn't been uploaded yet, upload it first
      if (imageUri && !imageUrl && accessToken) {
        setUploadingImage(true);
        try {
          const result = await uploadFile(imageUri, accessToken);
          setImageUrl(result.url || result.filename);
        } catch (error) {
          console.error("Image upload error:", error);
          Alert.alert("Upload Error", "Failed to upload image. Creating product without image.");
        } finally {
          setUploadingImage(false);
        }
      }

      const productData = {
        name: productName.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock),
        isActive,
        storeId: userStore.id, // Use user's store ID
        ...(typeof imageUrl === "string" && imageUrl.length > 0 ? { imageUrl } : {}), // Include imageUrl if available and valid
      };

      console.log("Creating product with data:", productData);
      await createProduct(productData).unwrap();
      
      // Refresh products list after creation
      if (userStore?.id) {
        await findProducts({ storeId: userStore.id });
      }
      
      Alert.alert(
        "Success!", 
        "Product has been added to your inventory successfully.", 
        [
          { 
            text: "View Inventory", 
            onPress: () => router.push("/(retailers)/products") 
          }
        ]
      );
    } catch (err) {
      console.error("Error creating product:", err);
      const message = (err && typeof err === "object" && 'message' in (err as any))
        ? (err as any).message
        : "Failed to create product. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleUpgrade = async () => {
    // For now, we'll use subscription ID 1 for BASIC plan
    // In a real app, you'd have a subscription selection screen
    // You can modify this to use a specific subscription ID based on the plan selected
    try {
      setIsUpgrading(true);
      // TODO: Replace with actual subscription ID from a subscription selection screen
      // For now, using a placeholder - you should fetch available subscriptions and let user choose
      const subscriptionId = 1; // This should come from a subscription selection UI
      
      await joinSubscription({ subscriptionId }).unwrap();
      
      // Refresh subscription status
      if (user && (user as any).id) {
        await getActiveSubscription(Number((user as any).id));
      }
      
      setShowSubscriptionOverlay(false);
      Alert.alert("Success", "Subscription upgraded successfully! You can now add more products.");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to upgrade subscription. Please try again.");
    } finally {
      setIsUpgrading(false);
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
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="cart" size={24} color="#ffffff" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Add</Text>
              <Text style={styles.headerSubtitle}>Add product to your inventory</Text>
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[
                styles.textInput,
                validationErrors.productName && styles.textInputError
              ]}
              placeholder="Enter product name"
              value={productName}
              onChangeText={(text) => {
                setProductName(text);
                if (validationErrors.productName) {
                  setValidationErrors(prev => ({ ...prev, productName: false }));
                }
              }}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[
                styles.textInput, 
                styles.multilineInput,
                validationErrors.description && styles.textInputError
              ]}
              placeholder="Enter product description"
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (validationErrors.description) {
                  setValidationErrors(prev => ({ ...prev, description: false }));
                }
              }}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Price & Stock */}
          <View style={styles.inputGroup}>
            <View style={styles.rowContainer}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Price <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[
                    styles.textInput,
                    validationErrors.price && styles.textInputError
                  ]}
                  placeholder="Enter price"
                  value={price}
                  onChangeText={(text) => {
                    setPrice(text);
                    if (validationErrors.price) {
                      setValidationErrors(prev => ({ ...prev, price: false }));
                    }
                  }}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Stock Quantity <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[
                    styles.textInput,
                    validationErrors.stock && styles.textInputError
                  ]}
                  placeholder="Enter quantity"
                  value={stock}
                  onChangeText={(text) => {
                    setStock(text);
                    if (validationErrors.stock) {
                      setValidationErrors(prev => ({ ...prev, stock: false }));
                    }
                  }}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

      {/* Category */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Category</Text>
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setShowCategoryList((v) => !v)}
        >
          <Ionicons name="pricetags" size={18} color="#6B7280" />
          <Text style={{ marginLeft: 8, color: "#374151", fontSize: 16 }}>
            {selectedCategoryId
              ? categories.find((c) => c.id === selectedCategoryId)?.name || "Select category"
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
                  setShowCategoryList(false);
                }}
                style={{ paddingVertical: 10, paddingHorizontal: 12 }}
              >
                <Text style={{ fontSize: 16, color: "#374151" }}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
            {categories.length === 0 && (
              <View style={{ paddingVertical: 12, paddingHorizontal: 12 }}>
                <Text style={{ fontSize: 14, color: "#6B7280" }}>No categories available</Text>
              </View>
            )}
          </View>
        )}
      </View>

          {/* Active Status */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Status</Text>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>
                {isActive ? "Active" : "Inactive"}
              </Text>
              <TouchableOpacity
                style={[styles.toggle, isActive && styles.toggleActive]}
                onPress={() => setIsActive(!isActive)}
              >
                <View style={[styles.toggleThumb, isActive && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
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
              style={[styles.addButton, (isSubmitting || uploadingImage) && styles.addButtonDisabled]} 
              onPress={handleAddProduct}
              disabled={isSubmitting || uploadingImage}
            >
              <Text style={styles.addButtonText}>
                {isSubmitting ? "CREATING..." : uploadingImage ? "UPLOADING..." : "ADD"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Subscription Overlay */}
      <SubscriptionOverlay
        visible={showSubscriptionOverlay}
        currentCount={products.length}
        maxCount={maxProducts}
        onDismiss={() => setShowSubscriptionOverlay(false)}
        onUpgrade={handleUpgrade}
        upgradePrice={activeSubscription?.plan === "FREE" ? "$100" : "$200"}
        validityDays={7}
        isLoading={isUpgrading}
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
  required: {
    color: "#EF4444",
    fontWeight: "bold",
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
  textInputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
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
  chooseFileButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#FFBE5D",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chooseFileText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFBE5D",
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
  addButton: {
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
  addButtonText: {
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
  addButtonDisabled: {
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