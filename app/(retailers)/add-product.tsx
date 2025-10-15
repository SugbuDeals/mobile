import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddProduct() {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [regularPrice, setRegularPrice] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [searchKeywords, setSearchKeywords] = useState("");
  const [selectedImage, setSelectedImage] = useState<any>(null);

  const handleAddProduct = () => {
    console.log("Adding product:", {
      productName,
      category,
      regularPrice,
      discountAmount,
      stockStatus,
      searchKeywords,
      selectedImage,
    });
    // Handle add product logic here
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  const handleImageUpload = () => {
    console.log("Upload image");
    // Handle image upload logic here
    // For demo, we'll use a placeholder image
    setSelectedImage(require("@/assets/images/index.png"));
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

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Select category"
                value={category}
                onChangeText={setCategory}
                placeholderTextColor="#9CA3AF"
              />
              <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
            </View>
          </View>

          {/* Regular Price & Discount Amount */}
          <View style={styles.inputGroup}>
            <View style={styles.rowContainer}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Regular Price</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter price"
                  value={regularPrice}
                  onChangeText={setRegularPrice}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Discount Amount</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="%"
                  value={discountAmount}
                  onChangeText={setDiscountAmount}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Stock Status */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Stock Status</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Select Stock Status"
                value={stockStatus}
                onChangeText={setStockStatus}
                placeholderTextColor="#9CA3AF"
              />
              <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
            </View>
            
            {/* Stock Information */}
            <View style={styles.stockInfo}>
              <Text style={styles.stockInStock}>In Stock (45 Units)</Text>
              <Text style={styles.stockLow}>Low stock - only 5 units remaining</Text>
            </View>
          </View>

          {/* Product Image */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Image</Text>
            <View style={styles.uploadArea}>
              <Ionicons name="cloud-upload" size={40} color="#9CA3AF" />
              <Text style={styles.uploadText}>Upload image for your promotion</Text>
              <TouchableOpacity style={styles.chooseFileButton} onPress={handleImageUpload}>
                <Text style={styles.chooseFileText}>Choose File</Text>
              </TouchableOpacity>
            </View>
            
            {/* Image Preview */}
            {selectedImage && (
              <View style={styles.imagePreview}>
                <Image source={selectedImage} style={styles.previewImage} />
                <TouchableOpacity style={styles.editImageButton}>
                  <Ionicons name="create" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Search Keywords */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Search Keywords</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter Keywords, separated by commas"
              value={searchKeywords}
              onChangeText={setSearchKeywords}
              placeholderTextColor="#9CA3AF"
              multiline
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
              <Text style={styles.addButtonText}>ADD</Text>
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
});
