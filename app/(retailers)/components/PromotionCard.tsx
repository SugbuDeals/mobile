import { useStore } from "@/features/store";
import { selectIsUpdatingPromotion } from "@/features/store/promotions/slice";
import { useModal } from "@/hooks/useModal";
import { useAppSelector } from "@/store/hooks";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PromotionCardProps {
  promotion: any;
  activePromotions: any[];
}

export function PromotionCard({ promotion, activePromotions }: PromotionCardProps) {
  // Early return if promotion is invalid
  if (!promotion || !promotion.id) {
    return null;
  }

  const { action: { updatePromotion, deletePromotion, findProducts, findProductById }, state: { products } } = useStore();
  const isUpdating = useAppSelector((state) => 
    selectIsUpdatingPromotion(state, promotion?.id)
  );
  const { isOpen: showProductDetails, open: openProductDetails, close: closeProductDetails } = useModal();
  const [promotionProducts, setPromotionProducts] = useState<any[]>([]);

  // Find all products associated with this promotion
  useEffect(() => {
    const productIds = promotion.productIds || [promotion.productId];
    
    if (productIds.length > 0 && products.length > 0) {
      const foundProducts = productIds.map((id: number) => 
        products.find(p => p.id === id)
      ).filter(Boolean);
      
      setPromotionProducts(foundProducts);
      
      // If some products are missing, try to fetch them
      const missingIds = productIds.filter((id: number) => !products.find(p => p.id === id));
      if (missingIds.length > 0) {
        missingIds.forEach((id: number) => findProductById(id));
      }
    }
  }, [promotion.productIds, promotion.productId, products, findProductById]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDaysLeft = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const calculateDiscountedPrice = (originalPrice: number, type: string, discount: number) => {
    if (type === 'percentage') {
      return originalPrice * (1 - discount / 100);
    } else if (type === 'fixed') {
      return Math.max(0, originalPrice - discount);
    }
    return originalPrice;
  };

  const handleToggleActive = async () => {
    Alert.alert(
      "Status managed by administrators",
      "Only administrators can activate or pause promotions. If your promotion was disabled, it is because something was wrong with it. While disabled, customers cannot see this promotion."
    );
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Promotion",
      "Are you sure you want to delete this promotion? This will remove it from all affected products.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete all related promotions
              const productIds: number[] = promotion.productIds || [promotion.productId];
              const promises = productIds.map((productId: number) => {
                // Find the original promotion for this product
                const originalPromotion = activePromotions.find(p => p.productId === productId);
                if (originalPromotion) {
                  return deletePromotion(originalPromotion.id);
                }
                return Promise.resolve();
              });
              
              await Promise.all(promises);
            } catch (error) {
              console.error("Error deleting promotion:", error);
              Alert.alert("Error", "Failed to delete promotion");
            }
          }
        }
      ]
    );
  };

  const daysLeft = calculateDaysLeft(promotion.endsAt);

  return (
    <TouchableOpacity style={styles.promotionCard} onPress={() => showProductDetails ? closeProductDetails() : openProductDetails()}>
      <View style={styles.promotionContent}>
        <View style={styles.promotionHeader}>
          <Text style={styles.promotionTitle}>{promotion.title}</Text>
        </View>
        
        <Text style={styles.promotionDescription}>{promotion.description}</Text>
        
        <View style={styles.promotionDates}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={14} color="#6b7280" />
            <Text style={styles.dateText}>Starts: {formatDate(promotion.startsAt)}</Text>
          </View>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={14} color="#6b7280" />
            <Text style={styles.dateText}>Ends: {formatDate(promotion.endsAt)}</Text>
          </View>
        </View>
        
        <View style={styles.promotionFooter}>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: promotion.active ? '#10B981' : '#EF4444' }]} />
              <Text style={styles.statusText}>
                {promotion.active ? 'Active' : 'Disabled by administrator'}
              </Text>
            </View>
          {daysLeft > 0 && (
            <Text style={styles.daysLeft}>
              {daysLeft} days left
            </Text>
          )}
        </View>

        {/* Product Details - shown when clicked */}
        {showProductDetails && (
          <View style={styles.productDetailsSection}>
            <View style={styles.productDetailsHeader}>
              <Ionicons name="cube-outline" size={20} color="#277874" />
              <Text style={styles.productDetailsTitle}>
                Affected Products ({promotionProducts.length})
              </Text>
            </View>
            <View style={styles.productDetailsContent}>
              {promotionProducts.length > 0 ? (
                promotionProducts.map((product, index) => {
                  // Find the specific discount for this product
                  const productDiscount = promotion.productDiscounts?.find((pd: { productId: number; discount: number; type: string }) => pd.productId === product.id) || 
                                        { discount: promotion.discount, type: promotion.type };
                  
                  return (
                    <View key={product.id} style={styles.productItem}>
                      <Text style={styles.productDetailsName}>{product.name}</Text>
                      <Text style={styles.productDetailsDescription}>{product.description}</Text>
                      <View style={styles.productDetailsFooter}>
                        <View style={styles.priceContainer}>
                          <Text style={styles.productDetailsPrice}>${product.price}</Text>
                          <Text style={styles.productDetailsDiscountedPrice}>
                            ${calculateDiscountedPrice(product.price, productDiscount.type, productDiscount.discount).toFixed(2)}
                          </Text>
                          <Text style={styles.productDiscountInfo}>
                            ({productDiscount.type === 'percentage' ? `${productDiscount.discount}%` : `$${productDiscount.discount}`} off)
                          </Text>
                        </View>
                        <Text style={styles.productDetailsStock}>Stock: {product.stock}</Text>
                      </View>
                      {index < promotionProducts.length - 1 && (
                        <View style={styles.productSeparator} />
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading product details...</Text>
                  <Text style={styles.loadingSubtext}>
                    Product IDs: {(promotion.productIds || [promotion.productId]).join(', ')}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Show discount summary when expanded */}
            <View style={styles.discountSummary}>
              <Text style={styles.discountSummaryText}>
                Individual discounts applied to selected products
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
          <View style={styles.promotionActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.toggleButton]}
            onPress={handleToggleActive}
          >
            <Ionicons 
              name="alert-circle" 
              size={16} 
              color="#ffffff" 
            />
            <Text style={styles.actionButtonText}>
              Status Managed by Admin
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
            disabled={isUpdating}
          >
            <Ionicons name="trash" size={16} color="#ffffff" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  promotionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: "100%",
    alignSelf: "center",
  },
  promotionContent: {
    flex: 1,
  },
  promotionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    flex: 1,
    marginRight: 12,
  },
  promotionDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 16,
  },
  promotionDates: {
    marginBottom: 16,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  dateText: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 8,
  },
  promotionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  daysLeft: {
    fontSize: 13,
    color: "#f59e0b",
    fontWeight: "600",
  },
  discountSummary: {
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#10B981",
  },
  discountSummaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },
  productDetailsSection: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  productDetailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  productDetailsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#277874",
    marginLeft: 8,
  },
  productDetailsContent: {
    flex: 1,
  },
  productDetailsName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  productDetailsDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  productDetailsFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  productDetailsPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  productDetailsDiscountedPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10B981",
  },
  productDiscountInfo: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    fontStyle: "italic",
  },
  productDetailsStock: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
  },
  loadingSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  productItem: {
    marginBottom: 12,
  },
  productSeparator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  promotionActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  toggleButton: {
    backgroundColor: "#277874",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default PromotionCard;

