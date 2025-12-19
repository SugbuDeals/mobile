import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "@/styles/theme";
import type { Store } from "@/features/store/stores/types";

export interface StoreMarkerProps {
  /** Store object with location data */
  store: Store;
  /** Callback when marker is pressed */
  onPress?: (store: Store) => void;
  /** Callback when callout is pressed */
  onCalloutPress?: (store: Store) => void;
  /** Whether to show callout by default */
  showsCallout?: boolean;
  /** Whether this marker is selected/highlighted */
  isSelected?: boolean;
}

/**
 * Custom marker component for displaying stores on maps.
 * 
 * Displays a custom pin with store icon/image or default location icon.
 * Handles nullable coordinates safely and uses theme colors for consistency.
 * 
 * @component
 * @example
 * ```tsx
 * <StoreMarker
 *   store={store}
 *   onPress={(store) => handleStorePress(store)}
 *   showsCallout
 * />
 * ```
 * 
 * @param {StoreMarkerProps} props - StoreMarker component props
 * @returns {JSX.Element | null} StoreMarker component or null if coordinates invalid
 */
export default function StoreMarker({
  store,
  onPress,
  onCalloutPress,
  showsCallout = true,
  isSelected = false,
}: StoreMarkerProps) {
  // Validate coordinates
  const hasValidCoordinates =
    typeof store.latitude === "number" &&
    typeof store.longitude === "number" &&
    isFinite(store.latitude) &&
    isFinite(store.longitude);

  if (!hasValidCoordinates) {
    return null;
  }

  // TypeScript assertion: we've validated coordinates above
  const coordinate = {
    latitude: store.latitude as number,
    longitude: store.longitude as number,
  };

  const handlePress = () => {
    onPress?.(store);
  };

  const handleCalloutPress = () => {
    onCalloutPress?.(store);
  };

  // Custom marker image/icon
  const markerContent = store.imageUrl ? (
    <View style={styles.markerContainer}>
      <Image
        source={{ uri: store.imageUrl }}
        style={[
          styles.markerImage,
          isSelected && styles.markerImageSelected
        ]}
        resizeMode="cover"
      />
      <View style={[
        styles.markerPin,
        isSelected && styles.markerPinSelected
      ]} />
    </View>
  ) : (
    <View style={styles.markerContainer}>
      <View style={[
        styles.markerIconContainer,
        isSelected && styles.markerIconContainerSelected
      ]}>
        <Ionicons name="storefront" size={20} color={colors.white} />
      </View>
      <View style={[
        styles.markerPin,
        isSelected && styles.markerPinSelected
      ]} />
    </View>
  );

  return (
    <Marker
      coordinate={coordinate}
      title={store.name}
      description={store.address || store.description || undefined}
      onPress={handlePress}
      onCalloutPress={handleCalloutPress}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={isSelected ? 1000 : 1}
      identifier={store.id?.toString()}
    >
      {markerContent}
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.gray200,
  },
  markerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerPin: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.primary,
    marginTop: -2,
  },
  markerImageSelected: {
    borderColor: colors.secondaryDark,
    borderWidth: 4,
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  markerIconContainerSelected: {
    backgroundColor: colors.secondaryDark,
    borderColor: colors.secondaryDark,
    borderWidth: 4,
    width: 50,
    height: 50,
    borderRadius: 25,
    shadowColor: colors.secondaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  markerPinSelected: {
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderTopColor: colors.secondaryDark,
  },
});

