import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, borderRadius, typography } from "@/styles/theme";
import { TextField } from "@/components/shared";

interface LocationPickerProps {
  address: string;
  latitude?: number;
  longitude?: number;
  onLocationChange: (address: string, lat?: number, lng?: number) => void;
  label?: string;
}

export default function LocationPicker({
  address,
  latitude,
  longitude,
  onLocationChange,
  label = "Store Location",
}: LocationPickerProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleGetCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to get your current location."
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude: lat, longitude: lng } = position.coords;

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      const addressParts = reverseGeocode[0];
      const formattedAddress = [
        addressParts?.street,
        addressParts?.city,
        addressParts?.region,
        addressParts?.postalCode,
      ]
        .filter(Boolean)
        .join(", ");

      onLocationChange(formattedAddress || "Current Location", lat, lng);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to get current location"
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleGetCurrentLocation}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={styles.locationButtonText}>Use Current</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      <TextField
        label="Address"
        value={address}
        onChangeText={(text) => onLocationChange(text, latitude, longitude)}
        placeholder="Enter store address"
      />
      {(latitude !== undefined || longitude !== undefined) && (
        <View style={styles.coordinates}>
          <Text style={styles.coordinateText}>
            Lat: {latitude?.toFixed(6) || "N/A"}, Lng:{" "}
            {longitude?.toFixed(6) || "N/A"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray700,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
  },
  locationButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  coordinates: {
    marginTop: spacing.xs,
  },
  coordinateText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    fontFamily: "monospace",
  },
});

