import { logout } from "@/features/auth/slice";
import { useAppDispatch } from "@/store/hooks";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function AdminSettings() {
  const dispatch = useAppDispatch();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
          onPress: async () => {
            setIsLoggingOut(true);
            // Clear auth state immediately
            dispatch(logout());
            // Use setTimeout to ensure state update is processed before navigation
            setTimeout(() => {
              router.replace("/auth/login");
            }, 0);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Dashboard Overview Section */}
        <View style={styles.dashboardSection}>
          <Text style={styles.sectionTitle}>Admin Dashboard</Text>
          <Text style={styles.sectionSubtitle}>
            Quick overview of system health and key metrics
          </Text>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: "#DBEAFE" }]}>
                <Ionicons name="speedometer" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.statLabel}>System Status</Text>
              <Text style={styles.statValue}>Operational</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: "#D1FAE5" }]}>
                <Ionicons name="shield-checkmark" size={24} color="#10B981" />
              </View>
              <Text style={styles.statLabel}>Security</Text>
              <Text style={styles.statValue}>Secure</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="sync" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.statLabel}>Uptime</Text>
              <Text style={styles.statValue}>99.9%</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: "#E0E7FF" }]}>
                <Ionicons name="server" size={24} color="#6366F1" />
              </View>
              <Text style={styles.statLabel}>Load</Text>
              <Text style={styles.statValue}>Normal</Text>
            </View>
          </View>
        </View>

        {/* Monitoring Access Card */}
        <View style={styles.monitoringCard}>
          <View style={styles.monitoringHeader}>
            <View style={styles.monitoringIconContainer}>
              <Ionicons name="analytics" size={32} color="#277874" />
            </View>
            <View style={styles.monitoringTextContainer}>
              <Text style={styles.monitoringTitle}>Comprehensive Monitoring</Text>
              <Text style={styles.monitoringDescription}>
                Access detailed performance metrics, error logs, and system analytics
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.monitoringButton}
            onPress={() => router.push("/(admin)/monitoring/performance")}
          >
            <Text style={styles.monitoringButtonText}>View Detailed Monitoring</Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push("/(admin)/users")}
          >
            <Ionicons name="people" size={24} color="#277874" />
            <Text style={styles.actionText}>Manage Users</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push("/(admin)/reports")}
          >
            <Ionicons name="flag" size={24} color="#277874" />
            <Text style={styles.actionText}>Review Reports</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push("/(admin)/subscriptions")}
          >
            <Ionicons name="stats-chart" size={24} color="#277874" />
            <Text style={styles.actionText}>View Analytics</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </>
            )}
          </TouchableOpacity>
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
  dashboardSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#277874",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    width: "47%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#277874",
  },
  monitoringCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#277874",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  monitoringHeader: {
    flexDirection: "row",
    marginBottom: 20,
  },
  monitoringIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#E0F2F1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  monitoringTextContainer: {
    flex: 1,
  },
  monitoringTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#277874",
    marginBottom: 6,
  },
  monitoringDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  monitoringButton: {
    backgroundColor: "#277874",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  monitoringButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginLeft: 12,
  },
  logoutContainer: {
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutButtonText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "600",
  },
});
