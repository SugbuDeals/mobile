import { useLogin } from "@/features/auth";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

// Metrics Cards Component
const MetricsCard = ({ label, value, icon, color, bgColor }: {
  label: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
}) => (
  <View style={styles.metricCard}>
    <View style={styles.metricHeader}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={[styles.metricIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
    </View>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
  </View>
);

// User Card Component
const UserCard = ({ user, onDelete, onEdit }: { 
  user: any; 
  onDelete: (id: number) => void;
  onEdit: (user: any) => void;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return { bg: "#D1FAE5", text: "#065F46" };
      case "Inactive": return { bg: "#FEF3C7", text: "#92400E" };
      case "Suspended": return { bg: "#FEE2E2", text: "#991B1B" };
      default: return { bg: "#F3F4F6", text: "#374151" };
    }
  };

  // Determine role from user data
  const userRole = user.role || user.user_type || "Unknown";
  const displayRole = userRole.replace("_", " ").replace(/^\w/, (c: string) => c.toUpperCase());
  // Determine status (you can map this based on your business logic)
  const status = "Active"; // You can add a status field to your user model
  const statusColors = getStatusColor(status);

  // Get user's avatar (you might need to adjust this based on your user model)
  const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=random`;

  return (
    <View style={styles.userCard}>
      <Image source={{ uri: avatarUrl }} style={styles.userAvatar} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name || user.fullname || user.email}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <Text style={styles.userRole}>{displayRole}</Text>
      </View>
      <View style={styles.userActions}>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.text }]}>{status}</Text>
        </View>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => onEdit(user)}
        >
          <Ionicons name="create-outline" size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => onDelete(user.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Filter Button Component
const FilterButton = ({ 
  label, 
  isSelected, 
  onPress 
}: { 
  label: string; 
  isSelected: boolean; 
  onPress: () => void; 
}) => (
  <TouchableOpacity
    style={[styles.filterButton, isSelected && styles.filterButtonSelected]}
    onPress={onPress}
  >
    <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function Users() {
  const { action, state } = useLogin();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserType, setSelectedUserType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("CONSUMER");
  const [isSaving, setIsSaving] = useState(false);
  
  // Add user modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState("CONSUMER");
  const [isAdding, setIsAdding] = useState(false);
  
  // Get current logged-in user ID
  const currentUserId = state.user?.id;

  const userTypes = ["All", "CONSUMER", "RETAILER", "ADMIN"];
  const statusFilters = ["All", "Active", "Inactive", "Suspended"];

  useEffect(() => {
    // Fetch users when component mounts
    action.fetchAllUsers();
  }, []);

  // Filter users based on search and filters
  const filteredUsers = (state.allUsers || []).filter((user) => {
    const matchesSearch = 
      searchQuery === "" ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullname?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = 
      selectedUserType === "All" ||
      user.role === selectedUserType ||
      user.user_type === selectedUserType;

    return matchesSearch && matchesType;
  });

  // Calculate metrics
  const totalUsers = filteredUsers.length;
  const activeUsers = filteredUsers.length; // You can add status field to user model
  const consumers = filteredUsers.filter(u => u.role === "CONSUMER" || u.user_type === "consumer").length;
  const retailers = filteredUsers.filter(u => u.role === "RETAILER" || u.user_type === "retailer").length;

  const handleDeleteUser = async (id: number) => {
    // Prevent users from deleting themselves
    if (id === currentUserId) {
      Alert.alert("Error", "You cannot delete your own account");
      return;
    }
    setUserToDelete(id);
    setShowConfirmModal(true);
  };

  const handleEditUser = (user: any) => {
    setUserToEdit(user);
    setEditName(user.name || user.fullname || "");
    setEditEmail(user.email || "");
    setEditRole(user.role || user.user_type || "CONSUMER");
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!userToEdit) return;
    
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert("Error", "Name and email are required");
      return;
    }

    setIsSaving(true);
    
    try {
      await action.updateUser(userToEdit.id, {
        name: editName.trim(),
        email: editEmail.trim(),
      });
      
      // Refresh users list
      await action.fetchAllUsers();
      
      setShowEditModal(false);
      setUserToEdit(null);
      Alert.alert("Success", "User updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (userToDelete !== null) {
      try {
        await action.deleteUserByAdmin(userToDelete);
        // Refresh the users list
        await action.fetchAllUsers();
        setShowConfirmModal(false);
        setUserToDelete(null);
      } catch (error) {
        Alert.alert("Error", "Failed to delete user");
      }
    }
  };

  const handleAddUser = () => {
    setShowAddModal(true);
  };

  const handleSaveAddUser = async () => {
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    setIsAdding(true);
    
    try {
      await action.register({
        name: addName.trim(),
        email: addEmail.trim(),
        password: addPassword,
        role: addRole,
      });
      
      // Refresh users list
      await action.fetchAllUsers();
      
      setShowAddModal(false);
      setAddName("");
      setAddEmail("");
      setAddPassword("");
      setAddRole("CONSUMER");
      Alert.alert("Success", "User created successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to create user");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Key Metrics Cards */}
        <View style={styles.metricsSection}>
          <View style={styles.metricsGrid}>
            <MetricsCard
              label="Total Users"
              value={totalUsers.toString()}
              icon="people"
              color="#1B6F5D"
              bgColor="#D1FAE5"
            />
            <MetricsCard
              label="Consumers"
              value={consumers.toString()}
              icon="person"
              color="#3B82F6"
              bgColor="#DBEAFE"
            />
            <MetricsCard
              label="Retailers"
              value={retailers.toString()}
              icon="storefront"
              color="#F59E0B"
              bgColor="#FEF3C7"
            />
            <MetricsCard
              label="Active Users"
              value={activeUsers.toString()}
              icon="checkmark-circle"
              color="#10B981"
              bgColor="#D1FAE5"
            />
          </View>
        </View>

        {/* User Management Section */}
        <View style={styles.userManagementSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>User Management</Text>
            <TouchableOpacity style={styles.addUserButton} onPress={handleAddUser}>
              <Ionicons name="add" size={16} color="#ffffff" />
              <Text style={styles.addUserText}>Add User</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Filter Buttons */}
          <View style={styles.filtersContainer}>
            <Text style={styles.filterLabel}>User Type:</Text>
            <View style={styles.filterRow}>
              {userTypes.map((type) => (
                <FilterButton
                  key={type}
                  label={type.replace("_", " ")}
                  isSelected={selectedUserType === type}
                  onPress={() => setSelectedUserType(type)}
                />
              ))}
            </View>
          </View>

          {/* Loading State */}
          {state.usersLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1B6F5D" />
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          )}

          {/* Error State */}
          {state.error && !state.usersLoading && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{state.error}</Text>
            </View>
          )}

          {/* User List */}
          {!state.usersLoading && filteredUsers.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          )}

          {!state.usersLoading && (
            <View style={styles.userList}>
              {filteredUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onDelete={handleDeleteUser}
                    onEdit={handleEditUser}
                  />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning-outline" size={64} color="#DC2626" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Delete User</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete this user? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowConfirmModal(false);
                  setUserToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDeleteUser}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Edit User</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalScroll}>
              <View style={styles.editFormGroup}>
                <Text style={styles.editFormLabel}>Name</Text>
                <TextInput
                  style={styles.editFormInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter name"
                  placeholderTextColor="#9CA3AF"
                />
            </View>
            
              <View style={styles.editFormGroup}>
                <Text style={styles.editFormLabel}>Email</Text>
                <TextInput
                  style={styles.editFormInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="Enter email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.editFormGroup}>
                <Text style={styles.editFormLabel}>Role</Text>
                <View style={styles.roleSelector}>
                  {["CONSUMER", "RETAILER", "ADMIN"].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleButton,
                        editRole === role && styles.roleButtonSelected
                      ]}
                      onPress={() => setEditRole(role)}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          editRole === role && styles.roleButtonTextSelected
                        ]}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
              ))}
            </View>
          </View>
            </ScrollView>

            <View style={styles.editModalButtons}>
              <TouchableOpacity
                style={[styles.editModalButton, styles.cancelEditButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelEditButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editModalButton, styles.saveButton]}
                onPress={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add User Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Add New User</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalScroll}>
              <View style={styles.editFormGroup}>
                <Text style={styles.editFormLabel}>Name</Text>
                <TextInput
                  style={styles.editFormInput}
                  value={addName}
                  onChangeText={setAddName}
                  placeholder="Enter name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.editFormGroup}>
                <Text style={styles.editFormLabel}>Email</Text>
                <TextInput
                  style={styles.editFormInput}
                  value={addEmail}
                  onChangeText={setAddEmail}
                  placeholder="Enter email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.editFormGroup}>
                <Text style={styles.editFormLabel}>Password</Text>
                <TextInput
                  style={styles.editFormInput}
                  value={addPassword}
                  onChangeText={setAddPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                />
              </View>

              <View style={styles.editFormGroup}>
                <Text style={styles.editFormLabel}>Role</Text>
                <View style={styles.roleSelector}>
                  {["CONSUMER", "RETAILER", "ADMIN"].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleButton,
                        addRole === role && styles.roleButtonSelected
                      ]}
                      onPress={() => setAddRole(role)}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          addRole === role && styles.roleButtonTextSelected
                        ]}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

            <View style={styles.editModalButtons}>
              <TouchableOpacity
                style={[styles.editModalButton, styles.cancelEditButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setAddName("");
                  setAddEmail("");
                  setAddPassword("");
                  setAddRole("CONSUMER");
                }}
              >
                <Text style={styles.cancelEditButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editModalButton, styles.saveButton]}
                onPress={handleSaveAddUser}
                disabled={isAdding}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Create User</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  
  // ===== METRICS SECTION =====
  metricsSection: {
    marginBottom: 24,
    marginTop: 20,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  metricCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
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
  metricLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  metricValue: {
    fontSize: 26,
    fontWeight: "900",
    color: "#277874",
    marginTop: 4,
  },

  // ===== USER MANAGEMENT SECTION =====
  userManagementSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#277874",
  },
  addUserButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFBE5D",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addUserText: {
    color: "#1f2937",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },

  // ===== SEARCH BAR =====
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },

  // ===== FILTERS =====
  filtersContainer: {
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f9f8",
    borderWidth: 1,
    borderColor: "#277874",
  },
  filterButtonSelected: {
    backgroundColor: "#277874",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#277874",
  },
  filterButtonTextSelected: {
    color: "#ffffff",
  },

  // ===== USER LIST =====
  userList: {
    gap: 12,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#277874",
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  userActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#e0f2f1",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#277874",
  },
  menuButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f0f9f8",
  },

  // ===== LOADING & ERROR STATES =====
  loadingContainer: {
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },

  // ===== MODAL =====
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: width - 80,
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#DC2626",
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  // ===== EDIT/ADD USER MODAL =====
  editModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    width: width - 40,
    maxHeight: "80%",
    overflow: "hidden",
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  editModalScroll: {
    maxHeight: 400,
  },
  editFormGroup: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  editFormLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  editFormInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  roleSelector: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  roleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  roleButtonSelected: {
    backgroundColor: "#277874",
    borderColor: "#277874",
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  roleButtonTextSelected: {
    color: "#ffffff",
  },
  editModalButtons: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  editModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelEditButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelEditButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#277874",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
