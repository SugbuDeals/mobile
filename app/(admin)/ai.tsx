import env from "@/config/env";
import { useLogin } from "@/features/auth";
import { aiApi } from "@/services/api/endpoints/ai";
import type { ChatRequestDto, ChatResponseDto } from "@/services/api/endpoints/ai";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface QueryHistory {
  id: number;
  query: string;
  count?: number;
  response: string;
  productsCount?: number;
  storesCount?: number;
  promotionsCount?: number;
  intent?: string;
  timestamp: Date;
}

type RecommendationProduct = {
  id?: number;
  productId?: number;
  name?: string;
  title?: string;
  storeName?: string;
  storeId?: number;
  store?: { id?: number; name?: string };
  price?: number;
  discount?: number;
  imageUrl?: string;
  image?: string;
  description?: string;
  distance?: number;
};

export default function AITesting() {
  const { state: authState } = useLogin();
  
  // States for AI chat endpoint (same as consumer explore)
  const [query, setQuery] = useState("");
  const [count, setCount] = useState("10");
  const [response, setResponse] = useState<ChatResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<RecommendationProduct[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  
  // History state
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);

  // Handle AI Chat (same route as consumer explore)
  const handleAIChat = async () => {
    if (!query.trim() || loading) return;
    
    setLoading(true);
    setResponse(null);
    setProducts([]);
    setStores([]);
    setPromotions([]);
    
    try {
      const countValue = parseInt(count) || 10;
      const validatedCount = Math.max(1, Math.min(50, countValue));
      
      const requestBody: ChatRequestDto = {
        content: query.trim(),
        count: validatedCount,
      };
      
      const chatResponse: ChatResponseDto = await aiApi.chat(requestBody);
      
      setResponse(chatResponse);
      
      // Extract products, stores, and promotions from response
      const extractedProducts = (chatResponse.products || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        storeId: product.storeId,
        storeName: product.storeName,
        description: product.description,
        distance: product.distance,
      }));
      
      const extractedStores = chatResponse.stores || [];
      const extractedPromotions = chatResponse.promotions || [];
      
      setProducts(extractedProducts);
      setStores(extractedStores);
      setPromotions(extractedPromotions);
      
      // Add to history
      setQueryHistory(prev => [{
        id: Date.now(),
        query: query.trim(),
        count: validatedCount,
        response: chatResponse.content || "No response",
        productsCount: extractedProducts.length,
        storesCount: extractedStores.length,
        promotionsCount: extractedPromotions.length,
        intent: chatResponse.intent,
        timestamp: new Date()
      }, ...prev]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorText = `Error: ${errorMessage}`;
      
      setResponse({
        content: errorText,
        intent: undefined,
        products: [],
        stores: [],
        promotions: [],
      });
      
      // Add error to history
      setQueryHistory(prev => [{
        id: Date.now(),
        query: query.trim(),
        count: parseInt(count) || 10,
        response: errorText,
        timestamp: new Date()
      }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI Chat Section - Same as consumer explore */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleContainer}>
              <Ionicons name="chatbubbles" size={24} color="#3B82F6" />
              <Text style={styles.sectionTitle}>AI Chat</Text>
              <View style={styles.labelBadge}>
                <Text style={styles.labelText}>/ai/chat</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.description}>
            Chat with AI to get product recommendations, store suggestions, or promotions. Uses the same endpoint as the consumer explore page.
          </Text>
          
          <TextInput
            style={styles.inputField}
            placeholder="Enter your query (e.g., 'budget mechanical keyboard')..."
            value={query}
            onChangeText={setQuery}
            placeholderTextColor="#9CA3AF"
            multiline
          />
          
          <View style={styles.countInputContainer}>
            <Text style={styles.countLabel}>Count:</Text>
            <TextInput
              style={styles.countInput}
              placeholder="10"
              value={count}
              onChangeText={(text) => {
                // Only allow numbers and validate range (1-50)
                const num = parseInt(text);
                if (text === "" || (!isNaN(num) && num >= 1 && num <= 50)) {
                  setCount(text);
                }
              }}
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
            <Text style={styles.countHint}>Optional: 1-50 (default: 10)</Text>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonMain, loading && styles.actionButtonDisabled]} 
              onPress={handleAIChat}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Send Query</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => {
                setQuery("");
                setCount("10");
                setResponse(null);
                setProducts([]);
                setStores([]);
                setPromotions([]);
              }}
            >
              <Ionicons name="refresh" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {response && (
            <View style={styles.responseArea}>
              <View style={styles.responseHeader}>
                <Text style={styles.responseHeaderText}>AI Response</Text>
                {response.intent && (
                  <View style={styles.intentBadge}>
                    <Text style={styles.intentText}>{response.intent.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              
              {(products.length > 0 || stores.length > 0 || promotions.length > 0) && (
                <Text style={styles.responseMeta}>
                  {products.length} product{products.length !== 1 ? 's' : ''}, {stores.length} store{stores.length !== 1 ? 's' : ''}, {promotions.length} promotion{promotions.length !== 1 ? 's' : ''}
                </Text>
              )}
              
              <ScrollView 
                style={styles.responseScroll} 
                nestedScrollEnabled 
                showsVerticalScrollIndicator
              >
                <Text style={styles.responseText}>{response.content || "No response received"}</Text>
              </ScrollView>
              
              {/* Products List */}
              {products.length > 0 && (
                <View style={styles.productList}>
                  <Text style={styles.sectionSubtitle}>Products</Text>
                  {products.map((item, idx) => {
                    const displayName = item.name || item.title || `Product ${idx + 1}`;
                    const displayStore = item.storeName || item.store?.name || "Store";
                    const price =
                      typeof item.price === "number"
                        ? item.price
                        : item.price != null
                          ? Number(item.price)
                          : undefined;
                    const discount =
                      typeof item.discount === "number"
                        ? item.discount
                        : item.discount != null
                          ? Number(item.discount)
                          : undefined;
                    const distance =
                      typeof item.distance === "number"
                        ? item.distance
                        : item.distance != null
                          ? Number(item.distance)
                          : undefined;
                    const imageUrl = (() => {
                      const url = item.imageUrl || item.image;
                      if (!url) return null;
                      if (/^https?:\/\//i.test(url)) return url;
                      if (url.startsWith("/")) return `${env.API_BASE_URL}${url}`;
                      return `${env.API_BASE_URL}/files/${url}`;
                    })();
                    return (
                      <View key={item.id ?? item.productId ?? idx} style={styles.productCard}>
                        {imageUrl ? (
                          <Image source={{ uri: imageUrl }} style={styles.productImage} />
                        ) : (
                          <View style={styles.productPlaceholder} />
                        )}
                        <View style={styles.productInfo}>
                          <Text style={styles.productName} numberOfLines={2}>{displayName}</Text>
                          <Text style={styles.productStore}>{displayStore}</Text>
                          {distance !== undefined && (
                            <Text style={styles.productMeta}>{distance.toFixed(1)} km away</Text>
                          )}
                          {price !== undefined && (
                            <Text style={styles.productPrice}>₱ {price.toFixed(2)}</Text>
                          )}
                          {discount !== undefined && (
                            <Text style={styles.productDiscount}>{discount}% OFF</Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
              
              {/* Stores List */}
              {stores.length > 0 && (
                <View style={styles.productList}>
                  <Text style={styles.sectionSubtitle}>Stores</Text>
                  {stores.map((store, idx) => (
                    <View key={store.id ?? idx} style={styles.productCard}>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={2}>{store.name || `Store ${idx + 1}`}</Text>
                        {store.description && (
                          <Text style={styles.productStore} numberOfLines={2}>{store.description}</Text>
                        )}
                        {store.distance !== undefined && (
                          <Text style={styles.productMeta}>{store.distance.toFixed(1)} km away</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Promotions List */}
              {promotions.length > 0 && (
                <View style={styles.productList}>
                  <Text style={styles.sectionSubtitle}>Promotions</Text>
                  {promotions.map((promo, idx) => (
                    <View key={promo.id ?? idx} style={styles.productCard}>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={2}>{promo.title || `Promotion ${idx + 1}`}</Text>
                        {promo.description && (
                          <Text style={styles.productStore} numberOfLines={2}>{promo.description}</Text>
                        )}
                        {promo.discount !== undefined && (
                          <Text style={styles.productDiscount}>{promo.discount}% OFF</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Query History Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleContainer}>
              <Ionicons name="time" size={24} color="#6B7280" />
              <Text style={styles.sectionTitle}>Recent AI Queries</Text>
              {queryHistory.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setQueryHistory([])}
                  style={styles.clearHistoryIconButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {queryHistory.length === 0 ? (
            <View style={styles.emptyHistoryContainer}>
              <Ionicons name="document-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyHistoryText}>No queries yet. Test the AI endpoint to see history here.</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {queryHistory.slice(0, 10).map((item) => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <Ionicons name="chatbubbles" size={16} color="#3B82F6" />
                    {item.intent && (
                      <View style={styles.historyBadge}>
                        <Text style={styles.historyBadgeText}>{item.intent.toUpperCase()}</Text>
                      </View>
                    )}
                    <Text style={styles.historyTime}>
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                  
                  <Text style={styles.historyQuery} numberOfLines={2}>
                    {item.query}
                    {item.count && ` (count: ${item.count})`}
                  </Text>
                  
                  {(item.productsCount !== undefined || item.storesCount !== undefined || item.promotionsCount !== undefined) && (
                    <Text style={styles.historyMeta}>
                      {item.productsCount || 0} products, {item.storesCount || 0} stores, {item.promotionsCount || 0} promotions
                    </Text>
                  )}
                  
                  <Text style={styles.historyResponse} numberOfLines={3}>
                    {item.response.substring(0, 150)}...
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  // ===== SECTIONS =====
  section: {
    marginBottom: 32,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#277874",
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    marginTop: 8,
  },
  labelBadge: {
    backgroundColor: "#e0f2f1",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  labelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#277874",
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  
  // ===== INPUT FIELDS =====
  inputField: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  countInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  countLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  countInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    width: 80,
  },
  countHint: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 8,
    fontStyle: "italic",
  },
  
  // ===== ACTION BUTTONS =====
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  actionButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionButtonMain: {
    flex: 1,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  refreshButton: {
    width: 48,
    height: 48,
    backgroundColor: "#f0f9f8",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  
  // ===== RESPONSE AREA =====
  responseArea: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  responseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  responseHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  intentBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  intentText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1E40AF",
  },
  responseMeta: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 12,
  },
  responseScroll: {
    maxHeight: 260,
  },
  responseText: {
    fontSize: 14,
    color: "#1F2937",
    lineHeight: 20,
  },
  productList: {
    marginTop: 16,
    gap: 12,
  },
  productCard: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  productPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  productStore: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
  },
  productMeta: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#047857",
    marginTop: 6,
  },
  productDiscount: {
    fontSize: 12,
    color: "#B45309",
    fontWeight: "700",
  },
  
  // ===== HISTORY SECTION =====
  clearHistoryIconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  emptyHistoryContainer: {
    alignItems: "center",
    padding: 32,
  },
  emptyHistoryText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: "#f0f9f8",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#277874",
  },
  historyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  historyBadge: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#277874",
  },
  historyBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#374151",
  },
  historyTime: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: "auto",
  },
  historyQuery: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  historyMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
    fontStyle: "italic",
  },
  historyResponse: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },
});
