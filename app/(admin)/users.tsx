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

// Mock data for users
const mockUsers = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    role: "Retailer",
    status: "Active",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
  },
  {
    id: 2,
    name: "Mike Chen",
    email: "mike.chen@email.com",
    role: "Consumer",
    status: "Inactive",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
  },
  {
    id: 3,
    name: "Emma Davis",
    email: "emma.davis@email.com",
    role: "Consumer",
    status: "Active",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
  },
  {
    id: 4,
    name: "Alex Rodriguez",
    email: "alex.rodriguez@email.com",
    role: "Consumer",
    status: "Suspended",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
  },
  {
    id: 5,
    name: "Lisa Park",
    email: "lisa.park@email.com",
    role: "Consumer",
    status: "Active",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
  }
];

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
const UserCard = ({ user }: { user: typeof mockUsers[0] }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return { bg: "#D1FAE5", text: "#065F46" };
      case "Inactive": return { bg: "#FEF3C7", text: "#92400E" };
      case "Suspended": return { bg: "#FEE2E2", text: "#991B1B" };
      default: return { bg: "#F3F4F6", text: "#374151" };
    }
  };

  const statusColors = getStatusColor(user.status);

  return (
    <View style={styles.userCard}>
      <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <Text style={styles.userRole}>{user.role}</Text>
      </View>
      <View style={styles.userActions}>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.text }]}>{user.status}</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserType, setSelectedUserType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const userTypes = ["All", "Consumer", "Retailer"];
  const statusFilters = ["All", "Active", "Inactive", "Blocked"];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Key Metrics Cards */}
        <View style={styles.metricsSection}>
          <View style={styles.metricsGrid}>
            <MetricsCard
              label="Total Users"
              value="1,247"
              icon="people"
              color="#1B6F5D"
              bgColor="#D1FAE5"
            />
            <MetricsCard
              label="Active Users"
              value="892"
              icon="checkmark-circle"
              color="#F59E0B"
              bgColor="#FEF3C7"
            />
            <MetricsCard
              label="Deal Queries"
              value="15,432"
              icon="add-circle"
              color="#1B6F5D"
              bgColor="#D1FAE5"
            />
            <MetricsCard
              label="Suspends"
              value="15"
              icon="person-remove"
              color="#DC2626"
              bgColor="#FEE2E2"
            />
          </View>
        </View>

        {/* User Management Section */}
        <View style={styles.userManagementSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>User Management</Text>
            <TouchableOpacity style={styles.addUserButton}>
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
                  label={type}
                  isSelected={selectedUserType === type}
                  onPress={() => setSelectedUserType(type)}
                />
              ))}
            </View>
            
            <Text style={styles.filterLabel}>User Status:</Text>
            <View style={styles.filterRow}>
              {statusFilters.map((status) => (
                <FilterButton
                  key={status}
                  label={status}
                  isSelected={selectedStatus === status}
                  onPress={() => setSelectedStatus(status)}
                />
              ))}
            </View>
          </View>

          {/* User List */}
          <View style={styles.userList}>
            {mockUsers.map((user) => (
              <UserCard key={user.id} user={user} />
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
    color: "#1F2937",
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
    color: "#1F2937",
  },
  addUserButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#20B2AA",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addUserText: {
    color: "#ffffff",
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
    backgroundColor: "#F3F4F6",
  },
  filterButtonSelected: {
    backgroundColor: "#1B6F5D",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
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
    shadowColor: "#000",
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
    color: "#6B7280",
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  menuButton: {
    padding: 4,
  },
});