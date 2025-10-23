import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import Ionicons from "@expo/vector-icons/Ionicons";
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
  const { action: { findProducts }, state: { products, loading: productsLoading } } = useStore();
  const [promotionTitle, setPromotionTitle] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    // Check if store setup is completed when component mounts
   

    // Fetch products for the current user's store
    if (user && (user as any).id) {
      findProducts({ storeId: Number((user as any).id) });
    }
  }, [user]);

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleCreatePromotion = () => {
    // Double-check store setup before proceeding
   

    // Handle promotion creation logic here
    console.log("Creating promotion:", {
      title: promotionTitle,
      discount: discountAmount,
      startDate,
      endDate,
      selectedProducts,
    });
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

          {/* Discount Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Discount Amount</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cash" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 20% or $5.00"
                value={discountAmount}
                onChangeText={setDiscountAmount}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Promotion Period */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Promotion Period</Text>
            <View style={styles.dateRow}>
              <View style={[styles.inputContainer, styles.dateInput]}>
                <Ionicons name="calendar" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="mm/dd/yyyy"
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.inputContainer, styles.dateInput]}>
                <Ionicons name="calendar" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="mm/dd/yyyy"
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholderTextColor="#9CA3AF"
                />
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
              products.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => toggleProductSelection(product.id.toString())}
                >
                  <View style={styles.productContent}>
                    <View style={styles.checkboxContainer}>
                      <View style={[
                        styles.checkbox,
                        selectedProducts.includes(product.id.toString()) && styles.checkboxSelected
                      ]}>
                        {selectedProducts.includes(product.id.toString()) && (
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
                  </View>
                </TouchableOpacity>
              ))
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
          </View>

          {/* Create Button */}
          <TouchableOpacity style={styles.createButton} onPress={handleCreatePromotion}>
            <Text style={styles.createButtonText}>Create Promotion</Text>
          </TouchableOpacity>
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
  dateInput: {
    flex: 1,
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
});
