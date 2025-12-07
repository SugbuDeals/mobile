import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { uploadFile } from "@/utils/fileUpload";
import { Alert, Platform } from "react-native";
import { useAppSelector } from "@/store/hooks";

export interface ImageUploadResult {
  uri: string | null;
  error: string | null;
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  const pickAndUploadImage = useCallback(
    async (source: "camera" | "library" = "library"): Promise<ImageUploadResult> => {
      try {
        if (!accessToken) {
          return {
            uri: null,
            error: "Authentication required",
          };
        }

        // Request permissions
        if (source === "camera") {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            return {
              uri: null,
              error: "Camera permission denied",
            };
          }
        } else {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            return {
              uri: null,
              error: "Media library permission denied",
            };
          }
        }

        // Launch image picker
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: source === "camera" ? [4, 3] : undefined,
          quality: 0.8,
        });

        if (result.canceled || !result.assets[0]) {
          return { uri: null, error: null };
        }

        const asset = result.assets[0];
        const uri = asset.uri;

        // Upload the image
        setUploading(true);
        const uploadResult = await uploadFile(uri, accessToken);

        if (!uploadResult || !uploadResult.url) {
          return {
            uri: null,
            error: "Failed to upload image",
          };
        }

        return {
          uri: uploadResult.url,
          error: null,
        };
      } catch (error) {
        return {
          uri: null,
          error:
            error instanceof Error ? error.message : "Failed to upload image",
        };
      } finally {
        setUploading(false);
      }
    },
    [accessToken]
  );

  const pickImageFromLibrary = useCallback(
    () => pickAndUploadImage("library"),
    [pickAndUploadImage]
  );

  const pickImageFromCamera = useCallback(
    () => pickAndUploadImage("camera"),
    [pickAndUploadImage]
  );

  return {
    uploading,
    pickAndUploadImage,
    pickImageFromLibrary,
    pickImageFromCamera,
  };
}

