import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const MOCK = [
  { id: "n1", title: "Watch Out for New Deals!", time: "9:30 AM", desc: "Click here to view details", color: "#3B82F6" },
  { id: "n2", title: "Successfully Changed Password", time: "8:45 AM", desc: "You've changed your password", color: "#10B981" },
  { id: "n3", title: "Deal is about to end", time: "Yesterday", desc: "Click here to view details", color: "#A78BFA" },
  { id: "n4", title: "You've saved an Item", time: "Yesterday", desc: "Recently saved an item “product”", color: "#F87171" },
];

export default function Notifications() {
  const router = useRouter();
  const [items, setItems] = React.useState(MOCK);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {items.map((n) => (
          <View key={n.id} style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: `${n.color}22`, borderColor: n.color }]}> 
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

      <TouchableOpacity style={styles.clearBtnFixed} onPress={() => setItems([])}>
        <Text style={styles.clearText}>Clear All Notifications</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  backBtn: { padding: 4, borderRadius: 999 },
  title: { fontSize: 18, fontWeight: "700" },
  content: { paddingHorizontal: 20, paddingBottom: 180 },
  clearBtnFixed: { position: "absolute", left: 20, right: 20, bottom: 90, backgroundColor: "#F3F4F6", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  clearText: { color: "#6B7280", fontWeight: "700" },

  // Card
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", padding: 14, borderRadius: 12, marginBottom: 10 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginRight: 12, borderWidth: 1 },
  dot: { width: 12, height: 12, borderRadius: 999 },
  body: { flex: 1 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardTitle: { fontWeight: "700" },
  time: { color: "#9CA3AF", fontSize: 12 },
  desc: { color: "#6B7280" },
});


