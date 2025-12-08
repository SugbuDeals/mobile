import { useStore } from "@/features/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Linking, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

export default function ViewMap() {
  const router = useRouter();
  const {
    state: { nearbyStores },
    action: { findNearbyStores },
  } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [initialRegion, setInitialRegion] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setInitialRegion({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          await findNearbyStores({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, radiusKm: 10 });
        } else {
          setInitialRegion({ latitude: 10.3157, longitude: 123.8854, latitudeDelta: 0.2, longitudeDelta: 0.2 });
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [findNearbyStores]);

  const handleOpenInMaps = (store: { latitude?: number | null; longitude?: number | null; address?: string | null }) => {
    const hasCoords = typeof store?.latitude === 'number' && typeof store?.longitude === 'number';
    const url = hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`
      : `https://maps.google.com/maps?q=${encodeURIComponent(store?.address || "")}`;
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
        {initialRegion && (
          <MapView
            style={{ flex: 1 }}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            showsUserLocation
          >
            {(nearbyStores || [])
              .filter((s) => typeof s.latitude === 'number' && typeof s.longitude === 'number')
              .map((s) => (
                <Marker
                  key={s.id}
                  coordinate={{ 
                    latitude: s.latitude ?? 0, 
                    longitude: s.longitude ?? 0 
                  }}
                  title={s.name}
                  description={s.address || s.description}
                  onCalloutPress={() => handleOpenInMaps(s)}
                />
              ))}
          </MapView>
        )}
      </View>

      {/* Open in Maps Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.openMapsButton} onPress={() => Linking.openURL("https://maps.google.com/maps") }>
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
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1B6F5D",
    marginLeft: 8,
  },
});
