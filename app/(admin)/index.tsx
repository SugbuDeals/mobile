import env from "@/config/env";
import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function AdminDashboard() {
  const { state: authState, action: authActions } = useLogin();
  const { action: storeActions, state: { promotions, loading: storeLoading } } = useStore();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  useEffect(() => {
    // Fetch all users
    if (authState.allUsers.length === 0) {
      authActions.fetchAllUsers();
    }
    
    // Fetch all promotions
    storeActions.findPromotions();
    
    // Set loading to false after a short delay
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Calculate today's date for filtering
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const getTodayStart = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };
  
  const getTodayEnd = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  };
  
  const isCreatedToday = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    return createdDate >= getTodayStart() && createdDate <= getTodayEnd();
  };

  // Filter users created today
  const recentUsersToday = authState.allUsers.filter(user => {
    const createdAt = user.createdAt || user.created_at;
    if (!createdAt) return false;
    return isCreatedToday(createdAt);
  });

  // Format time ago for recent users
  const getTimeAgo = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 1) return "Less than 1h ago";
    return `${diffHours}h ago`;
  };

  // Calculate metrics
  const totalUsers = authState.allUsers.length;
  const totalPromotions = promotions.length;
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  // Handle AI test submission
  const handleTestAI = async () => {
    if (!aiQuery.trim() || isLoadingAI) return;
    
    setIsLoadingAI(true);
    setAiResponse("Processing...");
    
    try {
      const response = await fetch(`${env.API_BASE_URL}/ai/recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authState.accessToken ? { Authorization: `Bearer ${authState.accessToken}` } : {}),
        },
        body: JSON.stringify({ query: aiQuery, count: 10 }),
      });
      
      const rawText = await response.text();
      let jsonData: any = {};
      
      try {
        jsonData = rawText ? JSON.parse(rawText) : {};
      } catch {
        jsonData = { content: rawText };
      }
      
      // Extract AI response text
      const aiText =
        jsonData?.content ||
        jsonData?.messages?.find((m: any) => m?.role === "assistant")?.content ||
        jsonData?.insight ||
        jsonData?.summary ||
        jsonData?.message ||
        "AI response received";
      
      setAiResponse(aiText);
    } catch (error) {
      setAiResponse("Error: Could not fetch AI recommendations. Please try again.");
      console.error("AI error:", error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (isLoading || authState.usersLoading || storeLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B6F5D" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Key Metrics Cards */}
        <View style={styles.metricsSection}>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Total Users</Text>
                <View style={[styles.metricIcon, { backgroundColor: "#D1FAE5" }]}>
                  <Ionicons name="people" size={20} color="#1B6F5D" />
                </View>
              </View>
              <Text style={styles.metricValue}>{formatNumber(totalUsers)}</Text>
              <Text style={styles.metricChange}>+12% vs last month</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>AI Deal Found</Text>
                <View style={[styles.metricIcon, { backgroundColor: "#DBEAFE" }]}>
                  <Ionicons name="pricetag" size={20} color="#3B82F6" />
                </View>
              </View>
              <Text style={styles.metricValue}>{formatNumber(totalPromotions)}</Text>
              <Text style={styles.metricChange}>+8% vs last month</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Total Income</Text>
                <View style={[styles.metricIcon, { backgroundColor: "#FEF3C7" }]}>
                  <Ionicons name="cash" size={20} color="#F59E0B" />
                </View>
              </View>
              <Text style={styles.metricValue}>N/A</Text>
              <Text style={styles.metricChange}>Tracking coming soon</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>AI Queries</Text>
                <View style={[styles.metricIcon, { backgroundColor: "#F3F4F6" }]}>
                  <Ionicons name="hardware-chip" size={20} color="#6B7280" />
                </View>
              </View>
              <Text style={styles.metricValue}>N/A</Text>
              <Text style={styles.metricChange}>Tracking coming soon</Text>
            </View>
          </View>
        </View>

        {/* Quick Views */}
        <View style={styles.quickViewsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Views</Text>
          </View>
          <View style={styles.quickGrid}>
            <TouchableOpacity style={styles.quickCard} onPress={() => router.push("/(admin)/view-product") }>
              <View style={[styles.quickIcon, { backgroundColor: "#e0f2f1" }]}>
                <Ionicons name="cube" size={20} color="#277874" />
              </View>
              <Text style={styles.quickTitle}>View Products</Text>
              <Text style={styles.quickSub}>Browse all products</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard} onPress={() => router.push("/(admin)/view-store") }>
              <View style={[styles.quickIcon, { backgroundColor: "#f0f9ff" }]}>
                <Ionicons name="storefront" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.quickTitle}>View Stores</Text>
              <Text style={styles.quickSub}>See registered stores</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard} onPress={() => router.push("/(admin)/view-promotion") }>
              <View style={[styles.quickIcon, { backgroundColor: "#fef3c7" }]}>
                <Ionicons name="pricetag" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.quickTitle}>View Promotions</Text>
              <Text style={styles.quickSub}>All active and archived</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Deal Finder Test Section */}
        <View style={styles.aiSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Deal Finder Test</Text>
            <Ionicons name="hardware-chip" size={20} color="#F59E0B" />
          </View>
          
          <View style={styles.aiTestCard}>
            <TextInput
              style={styles.aiInput}
              placeholder="Enter a deal search query to test the AI..."
              value={aiQuery}
              onChangeText={setAiQuery}
              placeholderTextColor="#9CA3AF"
              editable={!isLoadingAI}
            />
            
            <View style={styles.aiButtons}>
              <TouchableOpacity 
                style={[styles.testButton, isLoadingAI && styles.testButtonDisabled]} 
                onPress={handleTestAI}
                disabled={isLoadingAI || !aiQuery.trim()}
              >
                {isLoadingAI ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                <Text style={styles.testButtonText}>Test AI</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => {
                  setAiQuery("");
                  setAiResponse("");
                }}
              >
                <Ionicons name="refresh" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {aiResponse && (
              <View style={styles.aiResponseContainer}>
                <Text style={styles.aiResponseText}>{aiResponse}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Recent Users Section */}
        <View style={styles.usersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Users Today</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentUsersToday.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No new users today</Text>
            </View>
          ) : (
          <View style={styles.usersList}>
              {recentUsersToday.slice(0, 5).map((user) => {
                const createdAt = user.createdAt || user.created_at;
                const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.fullname || user.email || 'U')}&background=random`;
                
                return (
              <View key={user.id} style={styles.userCard}>
                    <Image source={{ uri: avatarUrl }} style={styles.userAvatar} />
                <View style={styles.userInfo}>
                      <Text style={styles.userName}>
                        {user.name || user.fullname || user.email || "Unknown"}
                      </Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
                    {createdAt && (
                      <Text style={styles.userTime}>{getTimeAgo(createdAt)}</Text>
                    )}
              </View>
                );
              })}
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
  },
  quickViewsSection: {
    marginBottom: 16,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
    marginBottom: 12,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2937",
  },
  quickSub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  metricsSection: {
    marginBottom: 10,
    marginTop: 20,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
    marginBottom: 12,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricIcon: {
    width: 35,
    height: 35,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  metricValue: {
    fontSize: 25,
    fontWeight: "900",
    color: "#277874",
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  metricChange: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "500",
    marginTop: 2,
  },
  aiSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#277874",
  },
  viewAllText: {
    fontSize: 14,
    color: "#FFBE5D",
    fontWeight: "500",
  },
  aiTestCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  aiInput: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1f2937",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  aiButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  testButton: {
    backgroundColor: "#FFBE5D",
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.85,
    justifyContent: "center",
    alignItems: "center",
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "600",
  },
  refreshButton: {
    flex: 0.15,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#f0f9f8",
    justifyContent: "center",
    alignItems: "center",
  },
  aiResponseContainer: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  aiResponseText: {
    fontSize: 14,
    color: "#1f2937",
    lineHeight: 20,
  },
  usersSection: {
    marginBottom: 24,
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#277874",
  },
  userTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  emptyState: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9ca3af",
  },
});
