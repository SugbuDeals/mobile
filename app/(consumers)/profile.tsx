import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import Toggle from "../../components/Toggle";

export default function Profile() {
  const [name, setName] = useState("Juan Dela Cruz");
  const [email, setEmail] = useState("juandelacruz@email.com");
  const [phone, setPhone] = useState("(63) 912 345 6789");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // Here you would typically save the data to your backend
    Alert.alert("Success", "Profile updated successfully!");
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form to original values
    setName("Juan Dela Cruz");
    setEmail("juandelacruz@email.com");
    setPhone("(63) 912 345 6789");
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => {
          // Handle logout logic here
          console.log("User logged out");
        }}
      ]
    );
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Profile Picture Section */}
        <View style={styles.profilePictureContainer}>
          <View style={styles.profilePicture}>
            <Ionicons name="person" size={80} color="#277874" />
          </View>
          <TouchableOpacity style={styles.editPhotoButton} onPress={handleEditProfile}>
            <Ionicons name="add" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* User Information Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.formContainer}>
            <TextField
              placeholder="e.g. Juan Dela Cruz"
              value={name}
              onChangeText={setName}
              iconComponent={<Ionicons name="person-outline" size={18} color="#277874" />}
              editable={isEditing}
            />
            
            <TextField
              placeholder="e.g. juandelacruz@email.com"
              value={email}
              onChangeText={setEmail}
              iconComponent={<Ionicons name="mail-outline" size={18} color="#277874" />}
              editable={isEditing}
              keyboardType="email-address"
            />
            
            <TextField
              placeholder="(63) 912 345 6789"
              value={phone}
              onChangeText={setPhone}
              iconComponent={<Ionicons name="call-outline" size={18} color="#277874" />}
              editable={isEditing}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Notification Settings Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.notificationContainer}>
            <Toggle
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              label="Receive Notifications"
              icon={<Ionicons name="notifications-outline" size={18} color="#277874" />}
            />
          </View>
        </View>

        {/* Action Buttons Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <View style={styles.buttonContainer}>
            {!isEditing && (
              <Button
                variant="success"
                style={styles.editButton}
                onPress={handleEditProfile}
              >
                <Text style={styles.buttonText}>Edit Profile</Text>
              </Button>
            )}

            {isEditing && (
              <View style={styles.editButtonsContainer}>
                <Button
                  variant="outline"
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </Button>
                
                <Button
                  variant="success"
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.buttonText}>Save Changes</Text>
                </Button>
              </View>
            )}

            <Button
              variant="danger"
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>Logout Account</Text>
            </Button>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profilePictureContainer: {
    alignItems: "center",
    marginBottom: 40,
    position: "relative",
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
  editPhotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#277874",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
    marginLeft: 4,
  },
  formContainer: {
    gap: 16,
  },
  notificationContainer: {
    marginTop: 8,
  },
  buttonContainer: {
    gap: 16,
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  editButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#277874",
    borderRadius: 12,
    paddingVertical: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#f59e0b",
    borderRadius: 12,
    paddingVertical: 16,
  },
  editButton: {
    backgroundColor: "#277874",
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  outlineButtonText: {
    color: "#277874",
    fontSize: 16,
    fontWeight: "600",
  },
});