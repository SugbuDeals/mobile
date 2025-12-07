import React from "react";
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, borderRadius, typography } from "@/styles/theme";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Alert } from "react-native";

interface ImageUploaderProps {
  imageUrl?: string;
  onImageSelected: (url: string) => void;
  label?: string;
  aspectRatio?: [number, number];
  size?: "small" | "medium" | "large";
}

export default function ImageUploader({
  imageUrl,
  onImageSelected,
  label,
  aspectRatio,
  size = "medium",
}: ImageUploaderProps) {
  const { uploading, pickImageFromLibrary, pickImageFromCamera } =
    useImageUpload();

  const handlePickImage = async (source: "library" | "camera") => {
    const result =
      source === "library"
        ? await pickImageFromLibrary()
        : await pickImageFromCamera();

    if (result.error) {
      Alert.alert("Error", result.error);
      return;
    }

    if (result.uri) {
      onImageSelected(result.uri);
    }
  };

  const showImageSourceOptions = () => {
    Alert.alert(
      "Select Image Source",
      "Choose where to get the image from",
      [
        {
          text: "Camera",
          onPress: () => handlePickImage("camera"),
        },
        {
          text: "Photo Library",
          onPress: () => handlePickImage("library"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const sizeStyles = {
    small: { width: 80, height: 80 },
    medium: { width: 120, height: 120 },
    large: { width: 200, height: 200 },
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.uploadButton, sizeStyles[size]]}
        onPress={showImageSourceOptions}
        disabled={uploading}
        activeOpacity={0.7}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={32} color={colors.gray400} />
            <Text style={styles.placeholderText}>Tap to upload</Text>
          </View>
        )}
        {imageUrl && !uploading && (
          <View style={styles.overlay}>
            <Ionicons name="camera" size={20} color={colors.white} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray700,
    marginBottom: spacing.sm,
  },
  uploadButton: {
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  overlay: {
    position: "absolute",
    bottom: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});

