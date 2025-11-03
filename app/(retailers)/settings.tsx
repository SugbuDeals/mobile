import { useLogin } from "@/features/auth";
import { logout } from "@/features/auth/slice";
import { useStore } from "@/features/store";
import { useAppDispatch } from "@/store/hooks";

import { uploadFile } from "@/utils/fileUpload";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert, Image, Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function Settings() {

  const { state: { user, accessToken }, action: { updateUser, deleteUser } } = useLogin();
  const { action: { updateStore }, state: { userStore } } = useStore();
  const dispatch = useAppDispatch();
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  // Get user information
  const defaultName = (user as any)?.fullname || (user as any)?.name || "";
  const defaultEmail = (user as any)?.email || "";
  const role = useMemo(() => {
    const r = (user as any)?.user_type || (user as any)?.role;
    if (typeof r === "string") return r.toString();
    return "";
  }, [user]);
  const createdAt = (user as any)?.createdAt ?? "";
  
  const [fullName, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [storeLogoUrl, setStoreLogoUrl] = useState<string | undefined>(undefined);

  // Store data is already loaded by useStoreManagement hook in the layout
  // No need to load it again here

  // Update form when store data is loaded
  React.useEffect(() => {
    console.log("Settings - userStore state:", userStore);
    if (userStore) {
      setStoreName(userStore.name || "");
      setStoreDescription(userStore.description || "");
      setStoreLogoUrl(userStore.imageUrl || undefined);
    }
  }, [userStore]);

  const handleEditStore = () => {
    setIsEditingStore(true);
  };

  const handleEditUser = () => {
    setIsEditingUser(true);
  };

  const handleCancelStoreEdit = () => {
    // Reset store fields to original values
    if (userStore) {
      setStoreName(userStore.name || "");
      setStoreDescription(userStore.description || "");
    }
    setIsEditingStore(false);
  };

  const handleCancelUserEdit = () => {
    // Reset form to original values from auth state
    setName(defaultName);
    setEmail(defaultEmail);
    setIsEditingUser(false);
  };

  const handleSaveStore = async () => {
    if (isSavingStore) return; // Prevent multiple saves
    
    // Validate required fields
    if (!storeName.trim()) {
      Alert.alert("Error", "Store name is required.");
      return;
    }
    
    if (!storeDescription.trim()) {
      Alert.alert("Error", "Store description is required.");
      return;
    }
    
    if (!userStore?.id || !user?.id) {
      Alert.alert("Error", "Unable to update store. Please try again later.");
      return;
    }
    
    setIsSavingStore(true);
    try {
      console.log("Saving store changes:", {
        storeName: storeName.trim(),
        storeDescription: storeDescription.trim(),
      });
      
      console.log("Current user:", user);
      console.log("Current userStore:", userStore);
      
      // Prepare update data - only include fields that have changed
      // Note: Don't include 'id' in the request body as it's passed in the URL
      const storeUpdateData: any = {};
      
      // Only include store fields that are different from current values
      if (storeName.trim() !== (userStore.name || "")) {
        storeUpdateData.name = storeName.trim();
      }
      if (storeDescription.trim() !== (userStore.description || "")) {
        storeUpdateData.description = storeDescription.trim();
      }
      if (typeof storeLogoUrl === 'string' && storeLogoUrl.length > 0 && storeLogoUrl !== (userStore.imageUrl || undefined)) {
        storeUpdateData.imageUrl = storeLogoUrl;
      }
      
      // Update store if there are store changes 
      const hasStoreChanges = storeUpdateData.name !== undefined || storeUpdateData.description !== undefined || storeUpdateData.imageUrl !== undefined;
      
      if (hasStoreChanges) {
        console.log("=== STORE UPDATE DEBUG ===");
        console.log("Final storeUpdateData:", JSON.stringify(storeUpdateData, null, 2));
        console.log("Store ID (from userStore):", userStore.id);
        console.log("User ID (from user):", user?.id);
        console.log("Store name:", storeUpdateData.name);
        console.log("Store description:", storeUpdateData.description);
        console.log("==========================");
        
        await updateStore({ id: userStore.id, ...storeUpdateData }).unwrap();
        console.log("Store updated successfully");
        
        // Show success message
        Alert.alert(
          "Success",
          "Store details updated successfully!",
          [{ text: "OK" }]
        );
        
        setIsEditingStore(false);
      } else {
        Alert.alert("Info", "No changes detected in store details.");
      }
    } catch (error: any) {
      console.error("Failed to save store changes:", error);
      
      // Show error message
      Alert.alert(
        "Error",
        error?.message || "Failed to update store details. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSavingStore(false);
    }
  };

  const pickStoreLogo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1,1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      if (!accessToken) { Alert.alert('Error', 'You must be logged in.'); return; }
      setUploadingLogo(true);
      const uploaded = await uploadFile(result.assets[0].uri, accessToken);
      setStoreLogoUrl(uploaded.url || uploaded.filename);
      Alert.alert('Success', 'Logo uploaded. Save Store to apply.');
    } catch (e: any) {
      Alert.alert('Upload Error', e?.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveUser = async () => {
    if (isSavingUser) return; // Prevent multiple saves
    
    setIsSavingUser(true);
    try {
      console.log("Saving user changes:", {
        fullName: fullName.trim(),
        email: email.trim(),
      });
      
      const userUpdateData: any = {};
      
      // Only include user fields that are different from current values
      if (fullName.trim() !== defaultName) {
        userUpdateData.name = fullName.trim();
      }
      if (email.trim() !== defaultEmail) {
        userUpdateData.email = email.trim();
      }
      
      // Update user if there are user changes
      if (Object.keys(userUpdateData).length > 0) {
        await updateUser(Number(user?.id), userUpdateData).unwrap();
        
        // Show success message
        Alert.alert(
          "Success",
          "User details updated successfully!",
          [{ text: "OK" }]
        );
        
        setIsEditingUser(false);
      } else {
        Alert.alert("Info", "No changes detected in user details.");
      }
    } catch (error: any) {
      console.error("Failed to save user changes:", error);
      
      // Show error message
      Alert.alert(
        "Error",
        error?.message || "Failed to update user details. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/auth/login");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your data, store, products, and preferences.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            // Show confirmation dialog
            Alert.alert(
              "Final Confirmation",
              "This is your last chance. Are you absolutely sure you want to delete your account? This will also delete your store and all products.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete Forever",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      if (!user || !(user as any).id) return;
                      const id = Number((user as any).id);
                      await deleteUser(id).unwrap();
                      Alert.alert("Account Deleted", "Your account has been permanently deleted.");
                      router.replace("/auth/login");
                    } catch (error: any) {
                      Alert.alert("Error", error?.message || "Failed to delete account. Please try again.");
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
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
              <Text style={styles.headerSubtitle}>Configure your store settings</Text>
            </View>
          </View>
          
          <View style={styles.notificationIcon}>
            <Ionicons name="notifications" size={20} color="#ffffff" />
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Retailer Account Information Section */}
        {/* Store Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="storefront" size={20} color="#FFBE5D" />
            <Text style={styles.sectionTitle}>Store Preferences</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Store Name</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            </View>
            <TextInput
              style={[styles.textInput, !isEditingStore && styles.disabledInput]}
              placeholder="Enter your store name"
              value={storeName}
              onChangeText={setStoreName}
              placeholderTextColor="#9CA3AF"
              editable={isEditingStore}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Store Description</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            </View>
            <TextInput
              style={[styles.textInput, styles.textArea, !isEditingStore && styles.disabledInput]}
              placeholder="Tell customers about your store"
              value={storeDescription}
              onChangeText={setStoreDescription}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              editable={isEditingStore}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Contact Email</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
              </View>
            </View>
            <View style={[styles.textInput, styles.disabledInput]}>
              <Text style={styles.disabledText}>Coming Soon</Text>
            </View>
            <Text style={styles.helperText}>We will use this for important updates.</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Store Address</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
              </View>
            </View>
            <View style={[styles.textInput, styles.disabledInput]}>
              <Text style={styles.disabledText}>Coming Soon</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Store Logo</Text>
            </View>
            <View style={styles.uploadArea}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {storeLogoUrl ? (
                  <Image source={{ uri: storeLogoUrl }} style={{ width: 56, height: 56, borderRadius: 12 }} />
                ) : (
                  <View style={styles.uploadIcon}>
                    <Ionicons name="image" size={24} color="#D1D5DB" />
                  </View>
                )}
                <TouchableOpacity onPress={pickStoreLogo} disabled={uploadingLogo}>
                  <Text style={{ color: uploadingLogo ? "#9CA3AF" : "#277874", fontWeight: "600" }}>
                    {uploadingLogo ? "Uploading..." : storeLogoUrl ? "Change Logo" : "Upload Logo"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Store Category</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
              </View>
            </View>
            <View style={[styles.textInput, styles.disabledInput]}>
              <Text style={styles.disabledText}>Coming Soon</Text>
            </View>
          </View>

          {/* Store Edit Buttons */}
          <View style={styles.inputGroup}>
            {!isEditingStore ? (
              <TouchableOpacity style={styles.editStoreButton} onPress={handleEditStore}>
                <Text style={styles.editStoreButtonText}>Edit Store Details</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editButtons}>
                <TouchableOpacity style={styles.cancelEditButton} onPress={handleCancelStoreEdit}>
                  <Text style={styles.cancelEditButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveEditButton, isSavingStore && styles.disabledButton]} 
                  onPress={handleSaveStore}
                  disabled={isSavingStore}
                >
                  <Text style={styles.saveEditButtonText}>
                    {isSavingStore ? "Saving..." : "Save Store"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color="#FFBE5D" />
            <Text style={styles.sectionTitle}>Account Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.textInput, !isEditingUser && styles.disabledInput]}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setName}
              placeholderTextColor="#9CA3AF"
              editable={isEditingUser}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.textInput, !isEditingUser && styles.disabledInput]}
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              editable={isEditingUser}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Role</Text>
            <View style={[styles.textInput, styles.disabledInput]}>
              <Text style={styles.disabledText}>{role || "Retailer"}</Text>
            </View>
          </View>

          {createdAt && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Member Since</Text>
              <View style={[styles.textInput, styles.disabledInput]}>
                <Text style={styles.disabledText}>
                  {new Date(createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}

          {/* User Edit Buttons */}
          <View style={styles.inputGroup}>
            {!isEditingUser ? (
              <TouchableOpacity style={styles.editUserButton} onPress={handleEditUser}>
                <Text style={styles.editUserButtonText}>Edit User Details</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editButtons}>
                <TouchableOpacity style={styles.cancelEditButton} onPress={handleCancelUserEdit}>
                  <Text style={styles.cancelEditButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveEditButton, isSavingUser && styles.disabledButton]} 
                  onPress={handleSaveUser}
                  disabled={isSavingUser}
                >
                  <Text style={styles.saveEditButtonText}>
                    {isSavingUser ? "Saving..." : "Save User"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Account Actions Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileInputGroup}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout Account</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
              <Text style={styles.deleteButtonText}>Delete Account</Text>
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
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  activeBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  comingSoonBadge: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
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
  editStoreButton: {
    backgroundColor: "#277874",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  editStoreButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  editUserButton: {
    backgroundColor: "#277874",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  editUserButtonText: {
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
  disabledButton: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
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
  deleteButton: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 2,
    borderColor: "#B91C1C",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});