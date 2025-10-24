import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
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

// Mock data for recent users
const recentUsers = [
  {
    id: "1",
    name: "Mike Chen",
    email: "mike.chen@email.com",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    timeAgo: "2m ago",
  },
  {
    id: "2",
    name: "Emma Davis",
    email: "emma.davis@email.com",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    timeAgo: "5m ago",
  },
  {
    id: "3",
    name: "Alex Rodriguez",
    email: "alex.rodriguez@email.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    timeAgo: "10m ago",
  },
];

export default function AdminDashboard() {
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  const handleTestAI = () => {
    if (aiQuery.trim()) {
      setAiResponse("AI response will appear here...");
    }
  };

  return (
    <View style={styles.container}>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Key Metrics Cards */}
        <View style={styles.metricsSection}>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Total Users</Text>
                <View style={[styles.metricIcon, { backgroundColor: "#10B981" }]}>
                  <Ionicons name="people" size={20} color="#ffffff" />
                </View>
              </View>
              <Text style={styles.metricValue}>2,847</Text>
              <Text style={styles.metricChange}>+12% vs last month</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>AI Deal Found</Text>
                <View style={[styles.metricIcon, { backgroundColor: "#10B981" }]}>
                  <Ionicons name="pricetag" size={20} color="#ffffff" />
                </View>
              </View>
              <Text style={styles.metricValue}>45,231</Text>
              <Text style={styles.metricChange}>+8% vs last month</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Total Income</Text>
                <View style={[styles.metricIcon, { backgroundColor: "#10B981" }]}>
                  <Ionicons name="cash" size={20} color="#ffffff" />
                </View>
              </View>
              <Text style={styles.metricValue}>$2.4M</Text>
              <Text style={styles.metricChange}>+15% this month</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>AI Queries</Text>
                <View style={[styles.metricIcon, { backgroundColor: "#3B82F6" }]}>
                  <Ionicons name="hardware-chip" size={20} color="#ffffff" />
                </View>
              </View>
              <Text style={styles.metricValue}>8,942</Text>
              <Text style={styles.metricChange}>+5% vs last month</Text>
            </View>
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
            />
            
            <View style={styles.aiButtons}>
              <TouchableOpacity style={styles.testButton} onPress={handleTestAI}>
                <Text style={styles.testButtonText}>Test AI</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.historyButton}>
                <Ionicons name="refresh" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.aiResponseText}>
              {aiResponse || "AI response will appear here..."}
            </Text>
          </View>
        </View>

        {/* Recent Users Section */}
        <View style={styles.usersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Users</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.usersList}>
            {recentUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
                <Text style={styles.userTime}>{user.timeAgo}</Text>
              </View>
            ))}
          </View>
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
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    color: "#1f2937",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  metricChange: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "500",
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
    color: "#1f2937",
  },
  viewAllText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "500",
  },
  aiTestCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    backgroundColor: "#F59E0B",
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.85,
    justifyContent: "center",
    alignItems: "center",
  },
  testButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  historyButton: {
    flex: 0.15,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  aiResponseText: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    color: "#6b7280",
  },
  userTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
});
