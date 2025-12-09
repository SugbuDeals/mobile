import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { useLogin } from "@/features/auth";
import { completeRetailerSetup } from "@/features/auth/slice";
import { useStore, useStoreManagement } from "@/features/store";
import { uploadFile } from "@/utils/fileUpload";
import Ionicons from "@expo/vector-icons/Ionicons";
import { yupResolver } from "@hookform/resolvers/yup";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useDispatch } from "react-redux";
import * as yup from "yup";

const schema = yup.object().shape({
  storeName: yup.string().required("Store name is required"),
  storeDescription: yup.string().required("Store description is required"),
});

export default function RetailerSetup() {
  const dispatch = useDispatch();
  const { action: { updateStore, createStore }, state: { loading } } = useStore();
  const { state: { user, loading: authLoading, accessToken } } = useLogin();
  // Use the store management hook to get the user's store
  const { userStore, storeLoading, refreshStore } = useStoreManagement();
  const [submitting, setSubmitting] = React.useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = React.useState(false);
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [address, setAddress] = React.useState("");
  const [latitude, setLatitude] = React.useState<number | undefined>(undefined);
  const [longitude, setLongitude] = React.useState<number | undefined>(undefined);
  const [isGettingLocation, setIsGettingLocation] = React.useState(false);
  
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      storeName: "",
      storeDescription: "",
    },
  });

  // Check if user has already completed setup
  React.useEffect(() => {
    // If auth is still loading, wait
    if (authLoading) {
      return;
    }

    // If we have a user, check permissions
    if (user) {
      setHasCheckedAuth(true);
      
      // Check if user is a retailer
      const normalizedRole = String(user.role ?? "").toLowerCase();
      const normalizedUserType = String(user.user_type ?? "").toLowerCase();
      const isRetailer = normalizedRole === "retailer" || normalizedUserType === "retailer";
      
      if (!isRetailer) {
        // If user is not a retailer, redirect to consumer dashboard
        router.replace("/(consumers)");
        return;
      }

      // Store is loaded via useStoreManagement hook
      console.log("Store loaded via store management hook");

      // Check if setup is already completed AND user has a store
      // Only redirect if both conditions are met - if no store exists, allow setup
      if (user.retailer_setup_completed && userStore?.id) {
        Alert.alert(
          "Setup Already Completed",
          "You have already completed your store setup. You can update your store details in Settings.",
          [
            {
              text: "Go to Settings",
              onPress: () => router.replace("/(retailers)/settings"),
            },
          ]
        );
      }
    } else if (!authLoading && !hasCheckedAuth) {
      // If auth is not loading and we don't have a user, redirect to login
      // But only after we've given it a chance to load
      const timeoutId = setTimeout(() => {
        if (!user) {
          Alert.alert("Authentication Required", "Please log in to access store setup.");
          router.replace("/auth/login");
        }
      }, 1000); // Wait 1 second for user to load

      return () => clearTimeout(timeoutId);
    }
  }, [user, authLoading, hasCheckedAuth]);

  // Request image picker permissions
  React.useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Sorry, we need camera roll permissions to upload images!');
        }
      }
    })();
  }, []);

  // Populate form with existing store data
  React.useEffect(() => {
    console.log("Store data updated:", userStore);
    if (userStore) {
      setValue("storeName", userStore.name || "");
      setValue("storeDescription", userStore.description || "");
      if (userStore.imageUrl) {
        setImageUrl(userStore.imageUrl);
      }
      setAddress(userStore.address || "");
      setLatitude(userStore.latitude ?? undefined);
      setLongitude(userStore.longitude ?? undefined);
    }
  }, [userStore, setValue]);

  // Debug: Log userStore changes
  React.useEffect(() => {
    console.log("userStore state changed:", userStore);
  }, [userStore]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        setImageUrl(null); // Clear previous upload URL
        
        // Upload image immediately
        if (accessToken) {
          await handleImageUpload(uri);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleImageUpload = async (uri: string) => {
    if (!accessToken) {
      Alert.alert("Error", "Please log in to upload images.");
      return;
    }

    setUploadingImage(true);
    try {
      const result = await uploadFile(uri, accessToken);
      setImageUrl(result.url || result.filename);
      Alert.alert("Success", "Logo uploaded successfully!");
    } catch (error) {
      console.error("Image upload error:", error);
      Alert.alert("Upload Error", error instanceof Error ? error.message : "Failed to upload image. Please try again.");
      setImageUri(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageUri(null);
    setImageUrl(null);
  };

  const handleGetCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Location permission is needed to set your store location.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);

      const places = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      if (places && places.length > 0) {
        const p = places[0];
        const line = [p.name, p.street, p.subregion, p.city || p.region, p.postalCode, p.country]
          .filter(Boolean)
          .join(", ");
        setAddress(line);
      }
      Alert.alert("Location captured", "Coordinates and address have been filled.");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to get current location";
      Alert.alert("Location Error", errorMessage);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const onConfirm = async (formData: yup.InferType<typeof schema>) => {
    try {
      setSubmitting(true);
      
      if (!user?.id) {
        Alert.alert("Error", "User information not available. Please try logging in again.");
        router.replace("/auth/login");
        return;
      }

      // If store is still loading, wait a bit and try again
      if (loading || storeLoading) {
        Alert.alert("Please wait", "Loading store information...");
        return;
      }

      // If there's a new image but it hasn't been uploaded yet, upload it first
      if (imageUri && !imageUrl && accessToken) {
        setUploadingImage(true);
        try {
          const result = await uploadFile(imageUri, accessToken);
          setImageUrl(result.url || result.filename);
        } catch (error) {
          console.error("Image upload error:", error);
          Alert.alert("Upload Error", "Failed to upload image. Creating store without logo.");
        } finally {
          setUploadingImage(false);
        }
      }

      if (!userStore?.id) {
        // Create a new store if one doesn't exist
        if (!user) {
          Alert.alert("Error", "User information not available. Please try logging in again.");
          router.replace("/auth/login");
          return;
        }
        try {
          const newStore = await createStore({
            name: formData.storeName,
            description: formData.storeDescription,
            ownerId: Number(user.id),
            ...(imageUrl && { imageUrl }),
            ...(address && { address }),
            ...(latitude !== undefined && { latitude }),
            ...(longitude !== undefined && { longitude }),
          }).unwrap();
          
          console.log("Store created successfully:", newStore);
          
          // The store should already be set in the Redux state by createStore.fulfilled
          // Let's verify this by checking the state
          console.log("Store should now be available in Redux state");
        } catch (createError: unknown) {
          const errorMessage = createError instanceof Error ? createError.message : "Failed to create store. Please try again.";
          Alert.alert("Error", errorMessage);
          return;
        }
      } else {
        // Update existing store
        if (!user) {
          Alert.alert("Error", "User information not available. Please try logging in again.");
          router.replace("/auth/login");
          return;
        }
        try {
          await updateStore({
            id: userStore.id,
            name: formData.storeName,
            description: formData.storeDescription,
            ...(imageUrl && { imageUrl }),
            ...(address && { address }),
            ...(latitude !== undefined && { latitude }),
            ...(longitude !== undefined && { longitude }),
          }).unwrap();
        } catch (updateError: unknown) {
          const errorMessage = updateError instanceof Error ? updateError.message : "Failed to update store. Please try again.";
          Alert.alert("Error", errorMessage);
          return;
        }
      }

      // Mark retailer setup as completed
      dispatch(completeRetailerSetup());
      
      Alert.alert("Success", "Store setup completed successfully!");
      
      // Small delay to ensure state is updated before redirect
      setTimeout(() => {
        router.replace("/(retailers)");
      }, 100);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to setup store. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };


  // Show loading while checking authentication or loading store
  if (authLoading || loading || storeLoading || (!user && !hasCheckedAuth)) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>
          {loading || storeLoading ? "Loading store information..." : "Loading..."}
        </Text>
      </View>
    );
  }

  // If user is loaded but store is not found, show setup form (store will be created)
  if (user && !loading && !userStore && !storeLoading) {
    // This is normal for new retailers - they don't have a store yet
    // Show the setup form to create one
  }

  return (
    <View style={styles.container}>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <LinearGradient
          colors={["#FFBE5D", "#277874"]}
          style={styles.banner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.bannerText}>
            Complete your store profile to start showcasing products.
          </Text>
        </LinearGradient>
        {/* Logo Upload */}
        <View style={styles.logoSection}>
          {imageUri || imageUrl ? (
            <View style={styles.logoPreview}>
              <Image 
                source={{ uri: imageUri || imageUrl || undefined }} 
                style={styles.logoImage}
                resizeMode="cover"
              />
              <TouchableOpacity 
                style={styles.logoEditButton}
                onPress={pickImage}
                disabled={uploadingImage}
              >
                <Ionicons name="camera" size={20} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.logoRemoveButton}
                onPress={removeImage}
                disabled={uploadingImage}
              >
                <Ionicons name="trash" size={18} color="#ffffff" />
              </TouchableOpacity>
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.logoContainer}
              onPress={pickImage}
              disabled={uploadingImage}
            >
              <Ionicons name="image" size={40} color="#FFBE5D" />
              {uploadingImage && (
                <Text style={styles.uploadingTextSmall}>Uploading...</Text>
              )}
            </TouchableOpacity>
          )}
          <Text style={styles.uploadText}>Upload Logo</Text>
          <Text style={styles.fileInfo}>PNG, JPG or WEBP (Max 2MB)</Text>
        </View>

        {/* Store Details Form */}
        <View style={styles.formCard}>
          {/* Store Name */}
          <Controller
            control={control}
            name="storeName"
            render={({ field: { onChange, value } }) => (
              <TextField
                label="Store Name"
                placeholder="Enter store name"
                value={value}
                onChangeText={onChange}
                error={errors.storeName?.message}
              />
            )}
          />

          {/* Store Description */}
          <Controller
            control={control}
            name="storeDescription"
            render={({ field: { onChange, value } }) => (
              <TextField
                label="Store Description"
                placeholder="Describe your store"
                value={value}
                onChangeText={onChange}
                error={errors.storeDescription?.message}
                multiline
                numberOfLines={3}
              />
            )}
          />

          {/* Store Address */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Store Address</Text>
              <TouchableOpacity style={styles.mapButton} onPress={handleGetCurrentLocation} disabled={isGettingLocation}>
                <Text style={[styles.mapButtonText, isGettingLocation && { color: '#9CA3AF' }]}>
                  {isGettingLocation ? "Getting..." : "Get Current Location"}
                </Text>
                <Ionicons name="location" size={18} color={isGettingLocation ? "#9CA3AF" : "#FFBE5D"} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Store address"
              value={address}
              onChangeText={setAddress}
              placeholderTextColor="#9CA3AF"
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Latitude"
                value={latitude !== undefined ? String(latitude) : ""}
                onChangeText={(t) => setLatitude(t ? Number(t) : undefined)}
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Longitude"
                value={longitude !== undefined ? String(longitude) : ""}
                onChangeText={(t) => setLongitude(t ? Number(t) : undefined)}
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={styles.helperText}>Tap the button to auto-fill your current location.</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button onPress={handleSubmit(onConfirm)} style={styles.confirmButton} disabled={submitting || loading || uploadingImage}>
            <Text style={styles.confirmButtonText}>
              {submitting ? "Updating..." : uploadingImage ? "Uploading..." : loading ? "Loading..." : "Complete Setup"}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    backgroundColor: "#ffffff",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  placeholder: {
    width: 40,
  },
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 20,
    width: "100%",
  },
  bannerText: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "500",
    paddingVertical: 10,
    marginTop: 18,
  },
  content: {
    flex: 1,
    
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 14,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#FFBE5D",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    marginBottom: 12,
  },
  logoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
    position: "relative",
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  logoEditButton: {
    position: "absolute",
    top: 4,
    right: 44,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoRemoveButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  uploadingTextSmall: {
    color: "#FFBE5D",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
  },
  uploadText: {
    fontSize: 16,
    color: "#FFBE5D",
    fontWeight: "500",
    marginBottom: 4,
  },
  fileInfo: {
    fontSize: 12,
    color: "#6b7280",
  },
  formCard: {
    paddingHorizontal: 20,
    marginBottom: 24,
    backgroundColor: "#ffffff",
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#374151",
  },
  slabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
    marginTop: 6,
  },
  dropdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  dropdownText: {
    fontSize: 16,
    color: "#374151",
  },
  placeholderText: {
    color: "#9ca3af",
  },
  rowContainer: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  addressInputContainer: {
    position: "relative",
  },
  addressInput: {
    paddingRight: 100, // Make space for the button inside
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mapButtonText: {
    fontSize: 12,
    color: "#FFBE5D",
    marginRight: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
  disabledInput: {
    backgroundColor: "#F3F4F6",
    color: "#6B7280",
  },
  disabledText: {
    color: "#6B7280",
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  buttonContainer: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  confirmButton: {
    width: "100%",
    backgroundColor: "#FFBE5D",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
  },
  loadingText: {
    fontSize: 18,
    color: "#374151",
    fontWeight: "500",
  },
});
