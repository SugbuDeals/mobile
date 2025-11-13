import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    Dimensions,
    Linking,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import MapView, { Marker } from "react-native-maps";

const screen = Dimensions.get("window");

export default function NavigateStore() {
  const router = useRouter();
  const params = useLocalSearchParams() as Record<string, string | undefined>;

  const storeName = (params.storeName as string) || "QuickMart";
  const address = (params.address as string) || "";
  const latParam = params.latitude ? Number(params.latitude) : undefined;
  const lngParam = params.longitude ? Number(params.longitude) : undefined;

  const [region, setRegion] = React.useState<any | null>(null);
  React.useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const lat = latParam ?? pos.coords.latitude;
          const lng = lngParam ?? pos.coords.longitude;
          setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.03, longitudeDelta: 0.03 });
        } else if (latParam && lngParam) {
          setRegion({ latitude: latParam, longitude: lngParam, latitudeDelta: 0.03, longitudeDelta: 0.03 });
        }
      } catch {}
    })();
  }, [latParam, lngParam]);

  const handleOpenInMaps = () => {
    const url = latParam && lngParam
      ? `https://www.google.com/maps/dir/?api=1&destination=${latParam},${lngParam}`
      : `https://maps.google.com/maps?q=${encodeURIComponent(address || storeName)}`;
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
        <Text style={styles.headerTitle}>Navigate Store</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapView style={styles.mapImage} initialRegion={region || { latitude: 10.3157, longitude: 123.8854, latitudeDelta: 0.05, longitudeDelta: 0.05 }}>
          {latParam && lngParam && (
            <Marker coordinate={{ latitude: latParam, longitude: lngParam }} title={storeName} description={address || "Destination"} />
          )}
        </MapView>

        {/* Store Information Card */}
        <View style={styles.storeCard}>
          <View style={styles.storeHeader}>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{storeName}</Text>
              <Text style={styles.storeCategories}>
                Stationary, Groceries, Home
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Open</Text>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="time" size={16} color="#1B6F5D" />
              </View>
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Estimated Time</Text>
                <Text style={styles.detailValue}>12 mins</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="walk" size={16} color="#1B6F5D" />
              </View>
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Distance</Text>
                <Text style={styles.detailValue}>1.3 km</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.openMapsButton}
            onPress={handleOpenInMaps}
          >
            <Ionicons name="map" size={20} color="#1B6F5D" />
            <Text style={styles.openMapsText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
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
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
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
  mapImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  routeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  routeLine: {
    position: "absolute",
    height: 4,
    backgroundColor: "#FFA500",
    borderRadius: 2,
    shadowColor: "#FFA500",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  storePin: {
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  storeCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  storeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  storeCategories: {
    fontSize: 14,
    color: "#888",
  },
  statusBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
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
  },
  openMapsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1B6F5D",
    marginLeft: 8,
  },
});
