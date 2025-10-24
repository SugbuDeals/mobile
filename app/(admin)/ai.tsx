import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AITesting() {
  const [searchQuery, setSearchQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  const handleTestAI = () => {
    // Simulate AI response
    setAiResponse("AI is processing your request... This is a simulated response.");
  };

  const handleClear = () => {
    setSearchQuery("");
    setAiResponse("");
  };

  const recentTests = [
    {
      id: 1,
      query: "Best wireless earbuds under $50",
      dealCount: 15,
      status: "completed"
    },
    {
      id: 2,
      query: "Gaming laptops with RTX graphics",
      dealCount: 8,
      status: "completed"
    },
    {
      id: 3,
      query: "Smart home devices on sale",
      dealCount: 23,
      status: "completed"
    }
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI Deal Finder Test Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Deal Finder Test</Text>
            <Ionicons name="hardware-chip" size={20} color="#FFA500" />
          </View>
          
          <TextInput
            style={styles.inputField}
            placeholder="Enter a deal search query to test the AI..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
            multiline
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.testButton} onPress={handleTestAI}>
              <Text style={styles.testButtonText}>Test AI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.responseArea}>
            <Text style={styles.responseText}>
              {aiResponse || "AI response will appear here..."}
            </Text>
          </View>
        </View>

        {/* Recent AI Tests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent AI Tests</Text>
          
          <View style={styles.testsList}>
            {recentTests.map((test) => (
              <View key={test.id} style={styles.testCard}>
                <Text style={styles.testQuery}>{test.query}</Text>
                <View style={styles.testInfo}>
                  <View style={styles.dealCountBadge}>
                    <Text style={styles.dealCountText}>{test.dealCount} deals</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
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
    paddingTop: 20,
  },
  
  // ===== SECTIONS =====
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  
  // ===== AI DEAL FINDER TEST =====
  inputField: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
    minHeight: 100,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  testButton: {
    backgroundColor: "#FFA500",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  testButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  clearButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  clearButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "500",
  },
  responseArea: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  responseText: {
    fontSize: 16,
    color: "#9CA3AF",
    lineHeight: 24,
  },
  
  // ===== RECENT AI TESTS =====
  testsList: {
    gap: 12,
  },
  testCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  testQuery: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  testInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dealCountBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dealCountText: {
    fontSize: 12,
    color: "#065F46",
    fontWeight: "600",
  },
});
