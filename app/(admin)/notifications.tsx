import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ===== MAIN COMPONENT =====
export default function AdminNotifications() {
  const router = useRouter();
  const [items, setItems] = React.useState(ADMIN_NOTIFICATIONS);

  return (
    <View style={styles.container}>
      {/* Custom Header with Back Arrow */}
      <NotificationHeader />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notification List */}
        <NotificationList 
          items={items}
          onClearAll={() => setItems([])}
        />
        
        {/* Clear All Button - Inside ScrollView */}
        <ClearAllButton 
          onClearAll={() => setItems([])}
          hasItems={items.length > 0}
        />
      </ScrollView>
    </View>
  );
}

// ===== SUB-COMPONENTS =====

// Notification Header Component
const NotificationHeader = () => {
  const router = useRouter();
  
  return (
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={styles.backButton}
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={22} color="#0f172a" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Notifications</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
};

// Notification List Component
const NotificationList = ({ 
  items, 
  onClearAll 
}: {
  items: NotificationItem[];
  onClearAll: () => void;
}) => (
  <>
    {items.map((notification) => (
      <NotificationCard 
        key={notification.id} 
        notification={notification} 
      />
    ))}
    {items.length === 0 && (
      <EmptyState />
    )}
  </>
);

// Individual Notification Card Component
const NotificationCard = ({ 
  notification 
}: {
  notification: NotificationItem;
}) => (
  <View style={styles.card}>
    <View style={[styles.iconWrap, { 
      backgroundColor: `${notification.color}22`, 
      borderColor: notification.color 
    }]}> 
      <View style={[styles.dot, { backgroundColor: notification.color }]} />
    </View>
    <View style={styles.body}>
      <View style={styles.rowTop}>
        <Text style={styles.cardTitle}>{notification.title}</Text>
        <Text style={styles.time}>{notification.time}</Text>
      </View>
      <Text style={styles.desc}>{notification.desc}</Text>
    </View>
  </View>
);

// Empty State Component
const EmptyState = () => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyText}>You're all caught up!</Text>
  </View>
);

// Clear All Button Component
const ClearAllButton = ({ 
  onClearAll, 
  hasItems 
}: {
  onClearAll: () => void;
  hasItems: boolean;
}) => (
  hasItems && (
    <TouchableOpacity style={styles.clearButton} onPress={onClearAll}>
      <Text style={styles.clearText}>Clear All Notifications</Text>
    </TouchableOpacity>
  )
);

// ===== DATA TYPES =====
interface NotificationItem {
  id: string;
  title: string;
  time: string;
  desc: string;
  color: string;
}

// ===== MOCK DATA =====
const ADMIN_NOTIFICATIONS: NotificationItem[] = [
  { 
    id: "n1", 
    title: "New User Registration", 
    time: "9:30 AM", 
    desc: "5 new users registered in the last hour", 
    color: "#3B82F6" 
  },
  { 
    id: "n2", 
    title: "System Alert", 
    time: "8:45 AM", 
    desc: "High server load detected on main database", 
    color: "#F59E0B" 
  },
  { 
    id: "n3", 
    title: "Deal Approval Required", 
    time: "Yesterday", 
    desc: "3 new deals pending admin approval", 
    color: "#A78BFA" 
  },
  { 
    id: "n4", 
    title: "Security Update", 
    time: "Yesterday", 
    desc: "System security patch has been applied successfully", 
    color: "#10B981" 
  },
  { 
    id: "n5", 
    title: "User Report", 
    time: "2 days ago", 
    desc: "User 'john_doe' has been reported for suspicious activity", 
    color: "#F87171" 
  },
  { 
    id: "n6", 
    title: "Backup Complete", 
    time: "3 days ago", 
    desc: "Daily database backup completed successfully", 
    color: "#3B82F6" 
  },
];

// ===== STYLES =====
const styles = StyleSheet.create({
  // ===== MAIN LAYOUT STYLES =====
  // Used by: Main AdminNotifications component
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // Light gray background
  },
  scrollView: {
    flex: 1, // Take full height
  },
  scrollContent: {
    paddingHorizontal: 20, // Side padding for content
    paddingTop: 20, // Top padding
    paddingBottom: 20, // Bottom padding
  },
  
  // ===== HEADER STYLES =====
  // Used by: NotificationHeader component
  header: {
    flexDirection: "row", // Horizontal layout
    alignItems: "center", // Center vertically
    justifyContent: "space-between", // Space between elements
    paddingHorizontal: 20, // Side padding
    paddingTop: 14, // Top padding
    paddingBottom: 12, // Bottom padding
    backgroundColor: "#ffffff", // White background
    borderBottomWidth: 1, // Bottom border
    borderBottomColor: "#E5E7EB", // Light gray border
  },
  backButton: {
    padding: 4, // Touch area padding
    borderRadius: 999, // Circular touch area
  },
  headerTitle: {
    fontSize: 18, // Header font size
    fontWeight: "700", // Bold text
    color: "#1F2937", // Dark text
  },
  headerSpacer: {
    width: 30, // Space to balance the layout
  },
  
  // ===== NOTIFICATION CARD STYLES =====
  // Used by: NotificationCard component
  card: {
    flexDirection: "row", // Horizontal layout
    alignItems: "center", // Center vertically
    backgroundColor: "#ffffff", // White card background
    padding: 16, // Internal padding
    borderRadius: 12, // Rounded corners
    marginBottom: 12, // Space between cards
    shadowColor: "#000", // Shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  iconWrap: {
    width: 44, // Icon container width
    height: 44, // Icon container height
    borderRadius: 22, // Circular container
    alignItems: "center", // Center icon
    justifyContent: "center", // Center icon
    marginRight: 12, // Space before content
    borderWidth: 1, // Border for icon container
  },
  dot: {
    width: 12, // Dot size
    height: 12, // Dot size
    borderRadius: 999, // Circular dot
  },
  body: {
    flex: 1, // Take remaining space
  },
  rowTop: {
    flexDirection: "row", // Horizontal layout for title and time
    justifyContent: "space-between", // Space between title and time
    alignItems: "center", // Center vertically
    marginBottom: 4, // Space before description
  },
  cardTitle: {
    fontWeight: "700", // Bold title
    fontSize: 16, // Title font size
    color: "#1F2937", // Dark text
    flex: 1, // Take available space
  },
  time: {
    color: "#9CA3AF", // Light gray time
    fontSize: 12, // Small time font
    marginLeft: 8, // Space after title
  },
  desc: {
    color: "#6B7280", // Medium gray description
    fontSize: 14, // Description font size
    lineHeight: 20, // Line height for readability
  },
  
  // ===== EMPTY STATE STYLES =====
  // Used by: EmptyState component
  emptyState: {
    alignItems: "center", // Center content
    paddingTop: 60, // Top padding
  },
  emptyText: {
    color: "#6B7280", // Gray text
    fontSize: 16, // Empty state font size
    fontWeight: "500", // Medium weight
  },
  
  // ===== CLEAR ALL BUTTON STYLES =====
  // Used by: ClearAllButton component
  clearButton: {
    backgroundColor: "#F3F4F6", // Light gray background
    borderRadius: 12, // Rounded corners
    paddingVertical: 16, // Vertical padding
    alignItems: "center", // Center content
    marginTop: 20, // Top margin
    shadowColor: "#000", // Shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  clearText: {
    color: "#6B7280", // Gray text
    fontWeight: "700", // Bold text
    fontSize: 16, // Button font size
  },
});
