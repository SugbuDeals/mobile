import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Settings() {
  const [storeName, setStoreName] = useState("QuickMart");
  const [storeDescription, setStoreDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeCategory, setStoreCategory] = useState("");
  const [fullName, setFullName] = useState("Juan Dela Cruz");
  const [email, setEmail] = useState("juandelacruz@email.com");
  const [isEditing, setIsEditing] = useState(false);

  const handleLogout = () => {
    console.log("Logout");
    // Handle logout logic here
    router.replace("/auth/login");
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    console.log("Saving all changes:", {
      storeName,
      storeDescription,
      contactEmail,
      storeAddress,
      storeCategory,
      fullName,
      email,
    });
    // Handle save logic here
    setIsEditing(false);
  };

  const handleImageUpload = () => {
    console.log("Upload store logo/banner");
    // Handle image upload logic here
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
              <Text style={styles.headerTitle}>Settings</Text>
              <Text style={styles.headerSubtitle}>
                Configure your store settings
              </Text>
            </View>
          </View>

          <View style={styles.notificationIcon}>
            <Ionicons name="notifications" size={20} color="#ffffff" />
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Store Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="storefront" size={20} color="#FFBE5D" />
            <Text style={styles.sectionTitle}>Store Preferences</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Name</Text>
            <TextInput
              style={[styles.textInput, !isEditing && styles.disabledInput]}
              placeholder="Enter your store name"
              value={storeName}
              onChangeText={setStoreName}
              placeholderTextColor="#9CA3AF"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Description</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                !isEditing && styles.disabledInput,
              ]}
              placeholder="Tell customers about your store"
              value={storeDescription}
              onChangeText={setStoreDescription}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Email</Text>
            <TextInput
              style={[styles.textInput, !isEditing && styles.disabledInput]}
              placeholder="Email address"
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              editable={isEditing}
            />
            <Text style={styles.helperText}>
              We will use this for important updates.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Address</Text>
            <View
              style={[
                styles.addressContainer,
                !isEditing && styles.disabledInput,
              ]}
            >
              <TextInput
                style={styles.addressInput}
                placeholder="Address"
                value={storeAddress}
                onChangeText={setStoreAddress}
                placeholderTextColor="#9CA3AF"
                editable={isEditing}
              />
              <TouchableOpacity style={styles.mapButton} disabled={!isEditing}>
                <Text
                  style={[
                    styles.mapButtonText,
                    !isEditing && styles.disabledText,
                  ]}
                >
                  Click here
                </Text>
                <Ionicons
                  name="location"
                  size={16}
                  color={isEditing ? "#FFBE5D" : "#9CA3AF"}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Logo / Banner</Text>
            <TouchableOpacity
              style={[
                styles.uploadArea,
                !isEditing && styles.disabledUploadArea,
              ]}
              onPress={isEditing ? handleImageUpload : undefined}
              disabled={!isEditing}
            >
              <View style={styles.uploadContent}>
                <View style={styles.uploadIcon}>
                  <Ionicons
                    name="image"
                    size={24}
                    color={isEditing ? "#9CA3AF" : "#D1D5DB"}
                  />
                </View>
                <View style={styles.uploadTextContainer}>
                  <Ionicons
                    name="cloud-upload"
                    size={20}
                    color={isEditing ? "#9CA3AF" : "#D1D5DB"}
                  />
                  <Text
                    style={[
                      styles.uploadText,
                      !isEditing && styles.disabledText,
                    ]}
                  >
                    PNG, JPG, or SVG format
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Category</Text>
            <View
              style={[
                styles.inputContainer,
                !isEditing && styles.disabledInput,
              ]}
            >
              <TextInput
                style={styles.textInput}
                placeholder="Select category"
                value={storeCategory}
                onChangeText={setStoreCategory}
                placeholderTextColor="#9CA3AF"
                editable={isEditing}
              />
              <Ionicons
                name="chevron-down"
                size={20}
                color={isEditing ? "#9CA3AF" : "#D1D5DB"}
              />
            </View>
          </View>
        </View>

        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileInputGroup}>
            <View style={styles.inputWithIcon}>
              <Ionicons
                name="person"
                size={20}
                color="#9CA3AF"
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.profileInput,
                  !isEditing && styles.disabledInput,
                ]}
                placeholder="e.g. Juan Dela Cruz"
                value={fullName}
                onChangeText={setFullName}
                placeholderTextColor="#9CA3AF"
                editable={isEditing}
              />
            </View>

            <View style={styles.inputWithIcon}>
              <Ionicons
                name="mail"
                size={20}
                color="#9CA3AF"
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.profileInput,
                  !isEditing && styles.disabledInput,
                ]}
                placeholder="e.g. juandelacruz@email.com"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                editable={isEditing}
              />
            </View>

            {!isEditing ? (
              <TouchableOpacity
                style={styles.editAccountButton}
                onPress={handleEdit}
              >
                <Text style={styles.editAccountButtonText}>Edit Account</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={styles.cancelEditButton}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.cancelEditButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveEditButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveEditButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout Account</Text>
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
  section: {
    backgroundColor: "#ffffff",
    marginTop: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFBE5D",
    marginLeft: 8,
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
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addressInput: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  mapButtonText: {
    fontSize: 14,
    color: "#FFBE5D",
    marginRight: 4,
  },
  uploadArea: {
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
  },
  uploadContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  uploadIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  uploadTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  uploadText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
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
  profileSection: {
    backgroundColor: "#F5F5DC",
    marginTop: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInputGroup: {
    gap: 12,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#10B981",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  profileInput: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
  },
  disabledInput: {
    backgroundColor: "#F3F4F6",
    color: "#6B7280",
  },
  disabledText: {
    color: "#6B7280",
  },
  disabledUploadArea: {
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
  },
  editAccountButton: {
    backgroundColor: "#277874",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  editAccountButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  editButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelEditButton: {
    backgroundColor: "#277874",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    flex: 1,
  },
  cancelEditButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  saveEditButton: {
    backgroundColor: "#f59e0b",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    flex: 1,
  },
  saveEditButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
