import { logout } from "@/features/auth/slice";
import { useAppDispatch } from "@/store/hooks";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_STORAGE_KEY = "@admin_settings";

interface AdminSettingsData {
  aiResponse: string;
  searchRadius: string;
  minDiscount: string;
  maxResults: string;
}

// ===== MAIN COMPONENT =====
export default function AdminSettings() {
  const dispatch = useAppDispatch();
  
  // State management for all form inputs
  const [aiResponse, setAiResponse] = useState("");
  const [searchRadius, setSearchRadius] = useState("25");
  const [minDiscount, setMinDiscount] = useState("10");
  const [maxResults, setMaxResults] = useState("50");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<AdminSettingsData | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Track changes
  useEffect(() => {
    if (originalSettings) {
      const current = { aiResponse, searchRadius, minDiscount, maxResults };
      const changed = JSON.stringify(current) !== JSON.stringify(originalSettings);
      setHasChanges(changed);
    }
  }, [aiResponse, searchRadius, minDiscount, maxResults, originalSettings]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const saved = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const settings: AdminSettingsData = JSON.parse(saved);
        setAiResponse(settings.aiResponse || "");
        setSearchRadius(settings.searchRadius || "25");
        setMinDiscount(settings.minDiscount || "10");
        setMaxResults(settings.maxResults || "50");
        setOriginalSettings(settings);
      } else {
        // Set defaults
        const defaults = {
          aiResponse: "",
          searchRadius: "25",
          minDiscount: "10",
          maxResults: "50",
        };
        setOriginalSettings(defaults);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      Alert.alert("Error", "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  // Event handlers
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validate numeric inputs
      const radius = parseFloat(searchRadius);
      const discount = parseFloat(minDiscount);
      const results = parseFloat(maxResults);
      
      if (isNaN(radius) || radius <= 0) {
        Alert.alert("Validation Error", "Search radius must be a positive number");
        return;
      }
      
      if (isNaN(discount) || discount < 0 || discount > 100) {
        Alert.alert("Validation Error", "Minimum discount must be between 0 and 100");
        return;
      }
      
      if (isNaN(results) || results <= 0) {
        Alert.alert("Validation Error", "Max results must be a positive number");
        return;
      }

      const settings: AdminSettingsData = {
        aiResponse: aiResponse.trim(),
        searchRadius: searchRadius.trim(),
        minDiscount: minDiscount.trim(),
        maxResults: maxResults.trim(),
      };

      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      setOriginalSettings(settings);
      setHasChanges(false);
      Alert.alert("Success", "Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      Alert.alert("Error", "Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              if (originalSettings) {
                setAiResponse(originalSettings.aiResponse);
                setSearchRadius(originalSettings.searchRadius);
                setMinDiscount(originalSettings.minDiscount);
                setMaxResults(originalSettings.maxResults);
                setHasChanges(false);
              }
            },
          },
        ]
      );
    }
  };
  
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            // Dispatch logout action to clear Redux state
            dispatch(logout());
            // Navigate back to login screen
            router.replace("/auth/login");
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#277874" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

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
          isSaving={isSaving}
          hasChanges={hasChanges}
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
  onCancel,
  isSaving,
  hasChanges
}: {
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  hasChanges: boolean;
}) => (
  <View style={styles.buttonContainer}>
    <TouchableOpacity 
      style={[
        styles.saveButton, 
        (!hasChanges || isSaving) && styles.saveButtonDisabled
      ]} 
      onPress={onSave}
      disabled={!hasChanges || isSaving}
    >
      {isSaving ? (
        <>
          <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>Saving...</Text>
        </>
      ) : (
        <Text style={styles.saveButtonText}>Save Changes</Text>
      )}
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[
        styles.cancelButton,
        !hasChanges && styles.cancelButtonDisabled
      ]} 
      onPress={onCancel}
      disabled={!hasChanges}
    >
      <Text style={[
        styles.cancelButtonText,
        !hasChanges && styles.cancelButtonTextDisabled
      ]}>Cancel</Text>
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
    shadowColor: "#277874", // Shadow for depth
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
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
    color: "#277874", // Teal text
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
    borderColor: "#277874", // Teal border
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
    borderColor: "#277874", // Teal border
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1, // Take available space
    alignItems: "center", // Center content
  },
  cancelButtonText: {
    color: "#277874", // Teal text
    fontSize: 16,
    fontWeight: "600", // Semi-bold
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonTextDisabled: {
    color: "#9CA3AF",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
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
