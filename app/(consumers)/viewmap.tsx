import { useStore } from "@/features/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Linking, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ViewMap() {
  const router = useRouter();
  const {
    state: { stores },
    action: { findStores },
  } = useStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (!stores || stores.length === 0) {
          setIsLoading(true);
          await (findStores() as any);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [stores, findStores]);

  const handleOpenInMaps = (storeAddress?: string) => {
    const address = storeAddress || "123 Market Street";
    const url = `https://maps.google.com/maps?q=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>View Map</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <Image
          source={require("../../assets/images/partial-react-logo.png")}
          style={styles.mapImage}
        />

        {/* Simple placeholder markers */}
        <View style={[styles.marker, { top: "25%", left: "45%" }]}>
          <View style={styles.greenMarker} />
        </View>
        <View style={[styles.marker, { top: "60%", left: "25%" }]}>
          <View style={styles.greenMarker} />
        </View>
        <View style={[styles.marker, { top: "60%", right: "25%" }]}>
          <View style={styles.greenMarker} />
        </View>
        <View style={[styles.marker, { top: "35%", right: "35%" }]}>
          <View style={styles.redMarker} />
        </View>
      </View>

      {/* Open in Maps Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.openMapsButton} onPress={() => handleOpenInMaps()}>
          <Ionicons name="map-outline" size={20} color="#1B6F5D" />
          <Text style={styles.buttonText}>Open in Maps</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    marginBottom: 70,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: "#fff",
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#000" },
  mapContainer: {
    flex: 1,
    position: "relative",
    margin: 20,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapImage: { width: "100%", height: "100%", resizeMode: "cover" },
  marker: { position: "absolute" },
  greenMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1B6F5D",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  redMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#DC2626",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonContainer: { paddingHorizontal: 20, paddingBottom: 30 },
  openMapsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#1B6F5D",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#1B6F5D", marginLeft: 8 },
});


