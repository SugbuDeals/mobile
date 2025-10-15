import { useCatalog } from "@/features/catalog";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AllRecommendations() {
  const router = useRouter();
  const {
    state: { products },
  } = useCatalog();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recommended</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {(products || []).map((p: any) => (
          <View key={p.id} style={styles.card}>
            <TouchableOpacity activeOpacity={0.9}>
              <View style={styles.imageWrap}>
                {/* Placeholder image since products may not have images */}
                <Image
                  source={require("../../assets/images/react-logo.png")}
                  style={styles.image}
                />
                <Text style={styles.badge}>New</Text>
              </View>
              <View style={styles.storeRow}>
                <View style={styles.storeLogo}>
                  <Image
                    source={require("../../assets/images/icon.png")}
                    style={styles.storeLogoImg}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.storeName}>
                    {p.storeName ?? "SugbuDeals"}
                  </Text>
                  <Text style={styles.storeDesc}>
                    {p.storeDesc ?? "Local Store"}
                  </Text>
                </View>
                <View style={styles.activePill}>
                  <Text style={styles.activeText}>Active</Text>
                </View>
              </View>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {p.name}
              </Text>
              {p.price != null && (
                <Text style={styles.price}>₱{Number(p.price).toFixed(2)}</Text>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  backBtn: { padding: 4, borderRadius: 999 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  grid: { paddingHorizontal: 20, paddingBottom: 120, rowGap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  imageWrap: {
    position: "relative",
    width: "100%",
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#1B6F5D",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 30,
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    columnGap: 10,
  },
  storeLogo: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  storeLogoImg: { width: 18, height: 18, resizeMode: "contain" },
  storeName: { fontWeight: "700", fontSize: 14 },
  storeDesc: { color: "#6B7280", fontSize: 12 },
  activePill: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  activeText: { color: "#1B6F5D", fontWeight: "700", fontSize: 12 },
  itemTitle: { paddingHorizontal: 12, paddingTop: 10, fontWeight: "700" },
  price: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    color: "#1B6F5D",
    fontWeight: "900",
  },
});
