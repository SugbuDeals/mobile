import { useAdminTools } from "@/components/admin/AdminToolsProvider";
import { useLogin } from "@/features/auth";
import type { UserResponseDto } from "@/features/auth/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
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
const MetricsCard = ({ label, value, icon, color, bgColor, gradientColors }: {
  label: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
  gradientColors?: readonly [string, string, ...string[]];
}) => (
  <View style={styles.metricCard}>
    <View style={styles.metricHeader}>
      <Text style={styles.metricLabel}>{label}</Text>
      <LinearGradient
        colors={gradientColors || [bgColor, bgColor] as [string, string]}
        style={styles.metricIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color="#FFFFFF" />
      </LinearGradient>
    </View>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
  </View>
);

// User Card Component
const UserCard = ({ user, onDelete, onEdit }: { 
  user: UserResponseDto; 
  onDelete: (id: number) => void;
  onEdit: (user: UserResponseDto) => void;
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
  const userRole = user.role || "Unknown";
  const displayRole = userRole.replace("_", " ").replace(/^\w/, (c: string) => c.toUpperCase());
  // Determine status (you can map this based on your business logic)
  const status = "Active"; // You can add a status field to your user model
  const statusColors = getStatusColor(status);

  // Get user's avatar (you might need to adjust this based on your user model)
  const avatarUrl = user.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=random`;

  return (
    <View style={styles.userCard}>
      <View style={styles.userAvatarWrapper}>
        <Image source={{ uri: avatarUrl }} style={styles.userAvatar} />
        <View style={styles.userAvatarShadow} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name || user.email}</Text>
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
          <View style={styles.menuButtonIcon}>
            <Ionicons name="create-outline" size={18} color="#3B82F6" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => onDelete(user.id)}
        >
          <View style={[styles.menuButtonIcon, styles.deleteButtonIcon]}>
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
          </View>
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
    style={styles.filterButton}
    onPress={onPress}
  >
    {isSelected ? (
      <LinearGradient
        colors={["#277874", "#1B6F5D"]}
        style={styles.filterButtonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.filterButtonTextSelected}>{label}</Text>
      </LinearGradient>
    ) : (
      <View style={styles.filterButtonInactive}>
        <Text style={styles.filterButtonText}>{label}</Text>
      </View>
    )}
  </TouchableOpacity>
);

export default function Users() {
  const { action, state } = useLogin();
  const adminTools = useAdminTools();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserType, setSelectedUserType] = useState("All");
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
  const [addRole, setAddRole] = useState<"CONSUMER" | "RETAILER" | "ADMIN">("CONSUMER");
  const [isAdding, setIsAdding] = useState(false);
  
  // Get current logged-in user ID
  const currentUserId = state.user?.id;

  const userTypes = ["All", "CONSUMER", "RETAILER", "ADMIN"];

  useEffect(() => {
    // Fetch users when component mounts
    action.fetchAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return (state.allUsers || []).filter((user) => {
      const matchesSearch = 
        searchQuery === "" ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false; // fullname removed per server.json

      const matchesType = 
        selectedUserType === "All" ||
        user.role === selectedUserType ||
        user.role === selectedUserType;

      return matchesSearch && matchesType;
    });
  }, [state.allUsers, searchQuery, selectedUserType]);

  // Use refs to access latest values without causing re-renders
  const allUsersRef = useRef(state.allUsers);
  const searchQueryRef = useRef(searchQuery);
  const selectedUserTypeRef = useRef(selectedUserType);
  const actionRef = useRef(action);

  // Update refs when values change
  useEffect(() => {
    allUsersRef.current = state.allUsers;
    searchQueryRef.current = searchQuery;
    selectedUserTypeRef.current = selectedUserType;
    actionRef.current = action;
  });

  // Configure admin tools - only run once on mount
  useEffect(() => {
    adminTools.setRefreshHandler(() => {
      actionRef.current.fetchAllUsers();
    });
    
    adminTools.setExportHandler(() => {
      // Get current filtered users at export time using refs
      const currentFiltered = (allUsersRef.current || []).filter((user) => {
        const matchesSearch = 
          searchQueryRef.current === "" ||
          user.name?.toLowerCase().includes(searchQueryRef.current.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQueryRef.current.toLowerCase()) ||
          false;
        const matchesType = 
          selectedUserTypeRef.current === "All" ||
          user.role === selectedUserTypeRef.current ||
          user.role === selectedUserTypeRef.current;
        return matchesSearch && matchesType;
      });
      const usersData = JSON.stringify(currentFiltered, null, 2);
      // In a real app, you'd use a file sharing library here
      console.log("Users data:", usersData);
    });

    adminTools.setSearchHandler(() => {
      // Search functionality - no popup needed
    });

    // Settings is now in tabbar, no need to hide it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Calculate metrics from all users (not filtered) - use useMemo to recalculate when data changes
  const metrics = useMemo(() => {
    const allUsers = state.allUsers || [];
    return {
      totalUsers: allUsers.length,
      activeUsers: allUsers.length, // You can add status field to user model
      consumers: allUsers.filter(u => u.role === "CONSUMER").length,
      retailers: allUsers.filter(u => u.role === "RETAILER").length,
    };
  }, [state.allUsers]);

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
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setEditRole(user.role || "CONSUMER");
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
    } catch {
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
      } catch {
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
      // ADMIN role cannot be registered via register endpoint (per server.json spec)
      // Only CONSUMER and RETAILER can be registered
      const registerRole = addRole === "ADMIN" ? "CONSUMER" : addRole;
      
      await action.register({
        name: addName.trim(),
        email: addEmail.trim(),
        password: addPassword,
        role: registerRole,
      });
      
      // Refresh users list
      await action.fetchAllUsers();
      
      setShowAddModal(false);
      setAddName("");
      setAddEmail("");
      setAddPassword("");
      setAddRole("CONSUMER");
      Alert.alert("Success", "User created successfully");
    } catch {
      Alert.alert("Error", "Failed to create user");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        

        {/* Key Metrics Cards */}
        <View style={styles.metricsSection}>
          <View style={styles.metricsGrid}>
            <MetricsCard
              label="Total Users"
              value={metrics.totalUsers.toString()}
              icon="people"
              color="#277874"
              bgColor="#D1FAE5"
              gradientColors={["#277874", "#1B6F5D"] as [string, string]}
            />
            <MetricsCard
              label="Consumers"
              value={metrics.consumers.toString()}
              icon="person"
              color="#3B82F6"
              bgColor="#DBEAFE"
              gradientColors={["#3B82F6", "#2563EB"] as [string, string]}
            />
            <MetricsCard
              label="Retailers"
              value={metrics.retailers.toString()}
              icon="storefront"
              color="#F59E0B"
              bgColor="#FEF3C7"
              gradientColors={["#F59E0B", "#D97706"] as [string, string]}
            />
            <MetricsCard
              label="Active Users"
              value={metrics.activeUsers.toString()}
              icon="checkmark-circle"
              color="#10B981"
              bgColor="#D1FAE5"
              gradientColors={["#10B981", "#059669"] as [string, string]}
            />
          </View>
        </View>

        {/* User Management Section */}
        <View style={styles.userManagementSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Users</Text>
            </View>
            <TouchableOpacity style={styles.addUserButton} onPress={handleAddUser}>
              <LinearGradient
                colors={["#FFBE5D", "#F59E0B"]}
                style={styles.addUserButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addUserText}>Add User</Text>
              </LinearGradient>
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
                style={styles.modalButton}
                onPress={confirmDeleteUser}
              >
                <LinearGradient
                  colors={["#DC2626", "#B91C1C"]}
                  style={styles.deleteButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </LinearGradient>
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
                      style={styles.roleButton}
                      onPress={() => setEditRole(role)}
                    >
                      {editRole === role ? (
                        <LinearGradient
                          colors={["#277874", "#1B6F5D"]}
                          style={styles.roleButtonGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.roleButtonTextSelected}>{role}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.roleButtonInactive}>
                          <Text style={styles.roleButtonText}>{role}</Text>
                        </View>
                      )}
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
                style={styles.editModalButton}
                onPress={handleSaveEdit}
                disabled={isSaving}
              >
                <LinearGradient
                  colors={["#277874", "#1B6F5D"]}
                  style={styles.saveButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </LinearGradient>
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
                      style={styles.roleButton}
                      onPress={() => setAddRole(role as "CONSUMER" | "RETAILER" | "ADMIN")}
                    >
                      {addRole === role ? (
                        <LinearGradient
                          colors={["#277874", "#1B6F5D"]}
                          style={styles.roleButtonGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.roleButtonTextSelected}>{role}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.roleButtonInactive}>
                          <Text style={styles.roleButtonText}>{role}</Text>
                        </View>
                      )}
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
                style={styles.editModalButton}
                onPress={handleSaveAddUser}
                disabled={isAdding}
              >
                <LinearGradient
                  colors={["#FFBE5D", "#F59E0B"]}
                  style={styles.saveButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isAdding ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Create User</Text>
                  )}
                </LinearGradient>
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
  
  // ===== GREETING SECTION =====
  greetingSection: {
    marginBottom: 20,
    marginTop: 16,
  },
  greetingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  greetingDecoration: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  aiIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  
  // ===== METRICS SECTION =====
  metricsSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  metricCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    width: (width - 60) / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
    marginTop: 6,
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
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  addUserButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#FFBE5D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addUserButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  addUserText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
  },

  // ===== SEARCH BAR =====
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
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
    borderRadius: 20,
    overflow: "hidden",
  },
  filterButtonGradient: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonInactive: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  filterButtonTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },

  // ===== USER LIST =====
  userList: {
    gap: 12,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 2,
  },
  userAvatarWrapper: {
    position: "relative",
    marginRight: 14,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    zIndex: 1,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userAvatarShadow: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E0F2F1",
    top: 2,
    left: 2,
    zIndex: 0,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#e0f2f1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#277874",
  },
  menuButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  menuButtonIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F0FDF4",
  },
  deleteButtonIcon: {
    backgroundColor: "#FEF2F2",
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
    borderRadius: 20,
    padding: 24,
    width: width - 80,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
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
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 12,
    paddingHorizontal: 24,
    textAlign: "center",
  },
  deleteButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    borderRadius: 10,
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  // ===== EDIT/ADD USER MODAL =====
  editModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    width: width - 40,
    maxHeight: "80%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
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
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  roleButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  roleButtonInactive: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  roleButtonTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
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
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelEditButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelEditButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 12,
    textAlign: "center",
  },
  saveButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
