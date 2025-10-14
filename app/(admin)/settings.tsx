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

// ===== MAIN COMPONENT =====
export default function AdminSettings() {
  // State management for all form inputs
  const [aiResponse, setAiResponse] = useState("");
  const [searchRadius, setSearchRadius] = useState("25");
  const [minDiscount, setMinDiscount] = useState("10");
  const [maxResults, setMaxResults] = useState("50");

  // Event handlers
  const handleSave = () => console.log("Settings saved");
  const handleCancel = () => console.log("Changes cancelled");
  const handleLogout = () => console.log("User logged out");

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <AIConfigurationCard 
          aiResponse={aiResponse}
          setAiResponse={setAiResponse}
          searchRadius={searchRadius}
          setSearchRadius={setSearchRadius}
        />
        
        <DealFinderSettingsCard
          minDiscount={minDiscount}
          setMinDiscount={setMinDiscount}
          maxResults={maxResults}
          setMaxResults={setMaxResults}
        />
        
        <ActionButtons 
          onSave={handleSave}
          onCancel={handleCancel}
        />
        
        <LogoutButton onLogout={handleLogout} />
      </ScrollView>
    </View>
  );
}

// ===== SUB-COMPONENTS =====

// AI Configuration Card Component
const AIConfigurationCard = ({ 
  aiResponse, 
  setAiResponse, 
  searchRadius, 
  setSearchRadius 
}: {
  aiResponse: string;
  setAiResponse: (value: string) => void;
  searchRadius: string;
  setSearchRadius: (value: string) => void;
}) => (
  <View style={styles.settingsCard}>
    <Text style={styles.sectionTitle}>AI Configuration</Text>
    
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Describe what A.i would response</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter AI response description..."
        value={aiResponse}
        onChangeText={setAiResponse}
        placeholderTextColor="#9CA3AF"
        multiline
      />
    </View>
    
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Deal Search Radius (miles)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="25"
        value={searchRadius}
        onChangeText={setSearchRadius}
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
      />
    </View>
  </View>
);

// Deal Finder Settings Card Component
const DealFinderSettingsCard = ({ 
  minDiscount, 
  setMinDiscount, 
  maxResults, 
  setMaxResults 
}: {
  minDiscount: string;
  setMinDiscount: (value: string) => void;
  maxResults: string;
  setMaxResults: (value: string) => void;
}) => (
  <View style={styles.settingsCard}>
    <View style={styles.sectionHeader}>
      <Ionicons name="search" size={20} color="#20B2AA" />
      <Text style={styles.sectionTitle}>Deal Finder Settings</Text>
    </View>
    
    <View style={styles.inputRow}>
      <View style={styles.inputGroupHalf}>
        <Text style={styles.inputLabel}>Minimum Discount %</Text>
        <TextInput
          style={styles.textInput}
          placeholder="10"
          value={minDiscount}
          onChangeText={setMinDiscount}
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>
      
      <View style={[styles.inputGroupHalf, { marginRight: 0 }]}>
        <Text style={styles.inputLabel}>Max Results per Search</Text>
        <TextInput
          style={styles.textInput}
          placeholder="50"
          value={maxResults}
          onChangeText={setMaxResults}
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>
    </View>
  </View>
);

// Action Buttons Component
const ActionButtons = ({ 
  onSave, 
  onCancel 
}: {
  onSave: () => void;
  onCancel: () => void;
}) => (
  <View style={styles.buttonContainer}>
    <TouchableOpacity style={styles.saveButton} onPress={onSave}>
      <Text style={styles.saveButtonText}>Save Changes</Text>
    </TouchableOpacity>
    
    <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
      <Text style={styles.cancelButtonText}>Cancel</Text>
    </TouchableOpacity>
  </View>
);

// Logout Button Component
const LogoutButton = ({ 
  onLogout 
}: {
  onLogout: () => void;
}) => (
  <View style={styles.logoutContainer}>
    <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
      <Ionicons name="log-out-outline" size={20} color="#DC2626" />
      <Text style={styles.logoutButtonText}>Logout</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  // ===== MAIN LAYOUT STYLES =====
  // Used by: Main AdminSettings component
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // Light gray background
  },
  content: {
    flex: 1,
    paddingHorizontal: 20, // Side padding for content
    paddingTop: 20, // Top padding
  },
  
  // ===== SETTINGS CARD STYLES =====
  // Used by: AIConfigurationCard, DealFinderSettingsCard
  settingsCard: {
    backgroundColor: "#ffffff", // White card background
    borderRadius: 16, // Rounded corners
    padding: 24, // Internal padding
    shadowColor: "#000", // Shadow for depth
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5, // Android shadow
    marginBottom: 20, // Space between cards
  },
  
  // ===== SECTION HEADER STYLES =====
  // Used by: DealFinderSettingsCard header with icon
  sectionHeader: {
    flexDirection: "row", // Horizontal layout
    alignItems: "center", // Center vertically
    marginBottom: 20, // Space below header
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold", // Bold text
    color: "#1F2937", // Dark gray text
    marginLeft: 8, // Space after icon
  },
  
  // ===== INPUT FORM STYLES =====
  // Used by: AIConfigurationCard, DealFinderSettingsCard
  inputGroup: {
    marginBottom: 24, // Space between input groups
  },
  inputGroupHalf: {
    flex: 1, // Take half width
    marginRight: 16, // Space between half-width inputs
  },
  inputRow: {
    flexDirection: "row", // Horizontal layout for half-width inputs
    justifyContent: "space-between", // Distribute space
    alignItems: "flex-start", // Align to top
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600", // Semi-bold
    color: "#374151", // Medium gray
    marginBottom: 8, // Space above input
  },
  textInput: {
    backgroundColor: "#ffffff", // White background
    borderWidth: 1,
    borderColor: "#E5E7EB", // Light gray border
    borderRadius: 8, // Rounded corners
    paddingHorizontal: 16, // Horizontal padding
    paddingVertical: 14, // Vertical padding
    fontSize: 16,
    color: "#1F2937", // Dark text
    minHeight: 52, // Minimum height
    textAlignVertical: "top", // Text starts at top for multiline
  },
  
  // ===== ACTION BUTTON STYLES =====
  // Used by: ActionButtons component (Save/Cancel)
  buttonContainer: {
    flexDirection: "row", // Horizontal layout
    justifyContent: "space-between", // Space between buttons
    marginTop: 0, // No top margin
    marginBottom: 20, // Bottom margin
  },
  saveButton: {
    backgroundColor: "#277874", // Teal background
    paddingHorizontal: 24, // Horizontal padding
    paddingVertical: 12, // Vertical padding
    borderRadius: 8, // Rounded corners
    flex: 1, // Take available space
    marginRight: 12, // Space before cancel button
    alignItems: "center", // Center content
  },
  saveButtonText: {
    color: "#ffffff", // White text
    fontSize: 16,
    fontWeight: "600", // Semi-bold
  },
  cancelButton: {
    backgroundColor: "#ffffff", // White background
    borderWidth: 1,
    borderColor: "#E5E7EB", // Light gray border
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1, // Take available space
    alignItems: "center", // Center content
  },
  cancelButtonText: {
    color: "#374151", // Dark gray text
    fontSize: 16,
    fontWeight: "600", // Semi-bold
  },
  
  // ===== LOGOUT BUTTON STYLES =====
  // Used by: LogoutButton component
  logoutContainer: {
    marginBottom: 20, // Bottom margin
  },
  logoutButton: {
    backgroundColor: "#ffffff", // White background
    borderWidth: 1,
    borderColor: "#FEE2E2", // Light red border
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row", // Horizontal layout for icon + text
    alignItems: "center", // Center vertically
    justifyContent: "center", // Center horizontally
  },
  logoutButtonText: {
    color: "#DC2626", // Red text
    fontSize: 16,
    fontWeight: "600", // Semi-bold
    marginLeft: 8, // Space after icon
  },
});
