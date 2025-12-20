import { useLogin } from "@/features/auth";
import { logout } from "@/features/auth/slice";
import { fetchUserById } from "@/features/auth/thunk";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getFileUrl, uploadFile } from "@/utils/fileUpload";
import { getNotificationPreference, setNotificationPreference } from "@/utils/notificationPreferences";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import Toggle from "../../components/Toggle";

export default function Profile() {
  const dispatch = useAppDispatch();
  const { user, accessToken } = useAppSelector((state) => state.auth);
  const {
    action: { deleteUser },
  } = useLogin();

  const defaultName = user?.name || "";
  const defaultEmail = user?.email || "";

  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const currentImageUrl = user?.imageUrl ?? undefined;
  const normalizedInitialUrl =
    typeof currentImageUrl === "string" && currentImageUrl.length
      ? currentImageUrl.startsWith("http")
        ? currentImageUrl
        : getFileUrl(currentImageUrl)
      : undefined;
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    normalizedInitialUrl
  );
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user && user.id) {
      dispatch(fetchUserById(Number(user.id)));
    }
  }, [dispatch, user]);

  // Load notification preference on mount
  useEffect(() => {
    getNotificationPreference().then(setNotificationsEnabled);
  }, []);

  // Handle notification preference change
  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await setNotificationPreference(value);
  };

  const handleSave = async () => {
    try {
      if (!user || !user.id) return;
      const id = Number(user.id);
      await dispatch(
        require("@/features/auth/thunk").updateUser({
          id,
          data: {
            name,
            email,
            ...(typeof imageUrl === "string" && imageUrl.length
              ? { imageUrl }
              : {}),
          },
        })
      ).unwrap();
      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
    } catch (e) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const pickProfileImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please allow access to your photos."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      // Immediately show local preview
      setImageUrl(result.assets[0].uri);
      if (!accessToken) {
        Alert.alert("Error", "You must be logged in to upload an image.");
        return;
      }
      setUploadingImage(true);
      const upload = await uploadFile(result.assets[0].uri, accessToken);
      const uploadedUrl =
        upload.url ||
        (upload.filename ? getFileUrl(upload.filename) : undefined);
      if (uploadedUrl) {
        setImageUrl(uploadedUrl);
      }
      Alert.alert(
        "Success",
        "Profile photo uploaded. Remember to Save Changes."
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload image";
      Alert.alert("Upload Error", errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values from auth state
    setName(defaultName);
    setEmail(defaultEmail);
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          // Clear auth state immediately
          dispatch(logout());
          // Use setTimeout to ensure state update is processed before navigation
          setTimeout(() => {
            router.replace("/auth/login");
          }, 0);
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your data, bookmarks, and preferences.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            // Show confirmation dialog
            Alert.alert(
              "Final Confirmation",
              "This is your last chance. Are you absolutely sure you want to delete your account?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete Forever",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      if (!user || !user.id) return;
                      const id = Number(user.id);
                      await deleteUser(id).unwrap();
                      Alert.alert(
                        "Account Deleted",
                        "Your account has been permanently deleted."
                      );
                      router.replace("/auth/login");
                    } catch (error: unknown) {
                      const errorMessage = error instanceof Error 
                        ? error.message 
                        : "Failed to delete account. Please try again.";
                      Alert.alert("Error", errorMessage);
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

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="image-outline" size={18} color="#277874" />
            <Text style={styles.cardTitle}>Profile Photo</Text>
          </View>
          <View style={styles.profilePictureRow}>
            <View style={styles.profilePicture}>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.profilePictureImage}
                />
              ) : (
                <Ionicons name="person" size={72} color="#277874" />
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.editPhotoButton,
                !isEditing && styles.editPhotoButtonDisabled,
              ]}
              onPress={() => {
                if (!isEditing) {
                  Alert.alert(
                    "Edit required",
                    "Tap Edit Profile first to change your photo."
                  );
                  return;
                }
                pickProfileImage();
              }}
              disabled={uploadingImage || !isEditing}
            >
              <Ionicons
                name={uploadingImage ? "time" : "add"}
                size={16}
                color="#ffffff"
              />
              <Text style={styles.editPhotoButtonText}>
                {uploadingImage ? "Uploading..." : "Update"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={18} color="#277874" />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>

          <View style={styles.formContainer}>
            <TextField
              placeholder="e.g. Juan Dela Cruz"
              value={name}
              onChangeText={setName}
              iconComponent={
                <Ionicons name="person-outline" size={18} color="#277874" />
              }
              editable={isEditing}
            />

            <TextField
              placeholder="e.g. juandelacruz@email.com"
              value={email}
              onChangeText={setEmail}
              iconComponent={
                <Ionicons name="mail-outline" size={18} color="#277874" />
              }
              editable={isEditing}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inlineActions}>
            {!isEditing ? (
              <Button
                variant="success"
                style={styles.inlineActionButton}
                onPress={handleEditProfile}
              >
                <Text style={styles.buttonTextLight}>Edit Details</Text>
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  style={styles.inlineActionButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.buttonTextDark}>Cancel</Text>
                </Button>
                <Button
                  variant="success"
                  style={styles.inlineActionButton}
                  onPress={handleSave}
                >
                  <Text style={styles.buttonTextLight}>Save</Text>
                </Button>
              </>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="notifications-outline" size={18} color="#277874" />
            <Text style={styles.cardTitle}>Settings</Text>
          </View>
          <View style={styles.notificationContainer}>
            <Toggle
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              label="Receive Notifications"
              icon={
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color="#277874"
                />
              }
            />
            <Text style={styles.notificationHint}>
              Get notified about nearby promotions when you're close to stores
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flag-outline" size={18} color="#277874" />
            <Text style={styles.cardTitle}>Reports</Text>
          </View>
          <TouchableOpacity
            style={styles.subscriptionButton}
            onPress={() => router.push("/(consumers)/my-reports")}
          >
            <View style={styles.subscriptionButtonContent}>
              <View>
                <Text style={styles.subscriptionButtonTitle}>My Reports</Text>
                <Text style={styles.subscriptionButtonSubtitle}>
                  View and track your submitted reports
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#277874" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="star-outline" size={18} color="#277874" />
            <Text style={styles.cardTitle}>Subscription</Text>
          </View>
          <TouchableOpacity
            style={styles.subscriptionButton}
            onPress={() => router.push("/(consumers)/subscription")}
          >
            <View style={styles.subscriptionButtonContent}>
              <View>
                <Text style={styles.subscriptionButtonTitle}>Manage Subscription</Text>
                <Text style={styles.subscriptionButtonSubtitle}>
                  Upgrade to PRO for extended features
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#277874" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.dangerCard}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <View style={styles.buttonContainer}>
            <Button
              variant="danger"
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.buttonTextLight}>Logout Account</Text>
            </Button>
            <Button
              variant="danger"
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.buttonTextLight}>Delete Account</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dangerCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  formContainer: {
    gap: 16,
  },
  profilePictureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f9ff",
    borderWidth: 3,
    borderColor: "#277874",
    justifyContent: "center",
    alignItems: "center",
  },
  profilePictureImage: {
    width: 114,
    height: 114,
    borderRadius: 57,
  },
  editPhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#277874",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  editPhotoButtonDisabled: {
    opacity: 0.5,
  },
  editPhotoButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  inlineActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  inlineActionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
  },
  notificationContainer: {
    marginTop: 8,
    paddingVertical: 4,
  },
  notificationHint: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
    lineHeight: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  buttonTextLight: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextDark: {
    color: "#277874",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#f97316",
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: "#ea580c",
  },
  deleteButton: {
    backgroundColor: "#991b1b",
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: "#7f1d1d",
  },
  subscriptionButton: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  subscriptionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  subscriptionButtonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  subscriptionButtonSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
});
