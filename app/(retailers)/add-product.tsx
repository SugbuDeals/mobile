import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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

export default function AddProduct() {
  const { state: { user } } = useLogin();
  const { action: { createProduct }, state: { loading, error } } = useStore();
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    
  }, [user]);

  const handleAddProduct = async () => {
    // Double-check store setup before proceeding
    

    // Validate required fields
    if (!productName.trim()) {
      Alert.alert("Error", "Product name is required");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Product description is required");
      return;
    }
    if (!price.trim() || isNaN(Number(price))) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }
    if (!stock.trim() || isNaN(Number(stock)) || Number(stock) < 0) {
      Alert.alert("Error", "Please enter a valid stock quantity");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const productData = {
        name: productName.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock),
        isActive,
        storeId: user?.store?.id || 1, // Use user's store ID or fallback
      };

      console.log("Creating product with data:", productData);
      await createProduct(productData);
      
      Alert.alert("Success", "Product created successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (err) {
      console.error("Error creating product:", err);
      Alert.alert("Error", "Failed to create product. Please try again.");
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
            <Text style={styles.label}>Product Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter product name"
              value={productName}
              onChangeText={setProductName}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder="Enter product description"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Price & Stock */}
          <View style={styles.inputGroup}>
            <View style={styles.rowContainer}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Price</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter price"
                  value={price}
                  onChangeText={setPrice}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Stock Quantity</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter quantity"
                  value={stock}
                  onChangeText={setStock}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>
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
            <View style={styles.comingSoonArea}>
              <Ionicons name="image-outline" size={40} color="#9CA3AF" />
              <Text style={styles.comingSoonText}>Image Upload</Text>
              <Text style={styles.comingSoonSubtext}>Coming Soon</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeText}>Feature in Development</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.addButton, isSubmitting && styles.addButtonDisabled]} 
              onPress={handleAddProduct}
              disabled={isSubmitting}
            >
              <Text style={styles.addButtonText}>
                {isSubmitting ? "CREATING..." : "ADD"}
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
  uploadArea: {
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    fontSize: 16,
    color: "#6B7280",
    marginVertical: 12,
    textAlign: "center",
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
  imagePreview: {
    marginTop: 16,
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
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
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
