import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const MOCK = [
  {
    id: "n1",
    title: "New Order Received",
    time: "9:30 AM",
    desc: "Customer John Doe placed an order for 2 items",
    color: "#3B82F6",
  },
  {
    id: "n2",
    title: "Product Low Stock Alert",
    time: "8:45 AM",
    desc: "Whiteboard Marker is running low on stock",
    color: "#F59E0B",
  },
  {
    id: "n3",
    title: "Promotion Approved",
    time: "Yesterday",
    desc: "Your 'Back to School' promotion is now live",
    color: "#10B981",
  },
  {
    id: "n4",
    title: "Payment Received",
    time: "Yesterday",
    desc: "Payment of ₱1,250.00 has been processed",
    color: "#10B981",
  },
  {
    id: "n5",
    title: "Store Review",
    time: "2 days ago",
    desc: "You received a 5-star review from a customer",
    color: "#F59E0B",
  },
  {
    id: "n6",
    title: "Inventory Update",
    time: "3 days ago",
    desc: "Product 'Eraser Pen' has been restocked",
    color: "#3B82F6",
  },
];

export default function Notifications() {
  const router = useRouter();
  const [items, setItems] = React.useState(MOCK);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Gradient Header */}
      <LinearGradient
        colors={["#FFBE5D", "#277874"]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="cart" size={24} color="#ffffff" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Notifications</Text>
                <Text style={styles.headerSubtitle}>Be notified</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Main Content Header */}
      <View style={styles.mainHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.mainBackButton}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.mainTitle}>Notifications</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {items.map((n) => (
          <View key={n.id} style={styles.card}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: `${n.color}22`, borderColor: n.color },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: n.color }]} />
            </View>
            <View style={styles.body}>
              <View style={styles.rowTop}>
                <Text style={styles.cardTitle}>{n.title}</Text>
                <Text style={styles.time}>{n.time}</Text>
              </View>
              <Text style={styles.desc}>{n.desc}</Text>
            </View>
          </View>
        ))}
        {items.length === 0 && (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <Text style={{ color: "#6B7280" }}>You&apos;re all caught up!</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.clearBtnFixed}
        onPress={() => setItems([])}
      >
        <Text style={styles.clearText}>Clear All Notifications</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomRightRadius: 40,
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
  headerRight: {
    width: 30,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  mainHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  mainBackButton: { padding: 4, borderRadius: 999 },
  mainTitle: { fontSize: 18, fontWeight: "700" },
  content: { paddingHorizontal: 20, paddingBottom: 180 },
  clearBtnFixed: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 90,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  clearText: { color: "#6B7280", fontWeight: "700" },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
  },
  dot: { width: 12, height: 12, borderRadius: 999 },
  body: { flex: 1 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: { fontWeight: "700" },
  time: { color: "#9CA3AF", fontSize: 12 },
  desc: { color: "#6B7280" },
});
