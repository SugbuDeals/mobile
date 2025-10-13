import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { completeRetailerSetup } from "@/features/auth/slice";
import Ionicons from "@expo/vector-icons/Ionicons";
import { yupResolver } from "@hookform/resolvers/yup";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useDispatch } from "react-redux";
import * as yup from "yup";

const schema = yup.object().shape({
  storeName: yup.string().required("Store name is required"),
  storeDescription: yup.string().required("Store description is required"),
  storeCategory: yup.string().required("Store category is required"),
  contactEmail: yup.string().required("Contact email is required").email("Invalid email"),
  storeAddress: yup.string().required("Store address is required"),
});

export default function RetailerSetup() {
  const dispatch = useDispatch();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      storeName: "",
      storeDescription: "",
      storeCategory: "",
      contactEmail: "",
      storeAddress: "",
    },
  });

  const onConfirm = (formData: yup.InferType<typeof schema>) => {
    console.log("Store setup data:", formData);
    // Mark retailer setup as completed
    dispatch(completeRetailerSetup());
    // TODO: Implement store setup API call
    // Navigate to retailer dashboard
    router.replace("/(retailers)");
  };

  const onLater = () => {
    // Mark retailer setup as completed even if skipped
    dispatch(completeRetailerSetup());
    // Navigate to retailer dashboard
    router.replace("/(retailers)");
  };

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
          <TouchableOpacity style={styles.logoContainer}>
            <Ionicons name="image" size={40} color="#FFBE5D" />
          </TouchableOpacity>
          <Text style={styles.uploadText}>Upload Logo</Text>
          <Text style={styles.fileInfo}>PNG, JPG or SVG (Max 2MB)</Text>
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

          {/* Store Category */}
          <Controller
            control={control}
            name="storeCategory"
            render={({ field: { onChange, value } }) => (
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Store Category</Text>
                <TouchableOpacity style={styles.dropdownContainer}>
                  <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
                    {value || "Select category"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
                {errors.storeCategory && (
                  <Text style={styles.errorText}>{errors.storeCategory.message}</Text>
                )}
              </View>
            )}
          />

          {/* Contact Email and Store Address Row */}
          <View style={styles.rowContainer}>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="contactEmail"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.fieldContainer}>
                    <TextField
                      label="Contact Email"
                      placeholder="Email address"
                      value={value}
                      onChangeText={onChange}
                      error={errors.contactEmail?.message}
                    />
                  </View>
                )}
              />
            </View>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="storeAddress"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.slabel}>Store Address</Text>
                    <View style={styles.addressInputContainer}>
                      <TextField
                        placeholder="Address"
                        value={value}
                        onChangeText={onChange}
                        error={errors.storeAddress?.message}
                        style={styles.addressInput}
                      />
                      <TouchableOpacity style={styles.mapButton}>
                        <Text style={styles.mapButtonText}>Click here</Text>
                        <Ionicons name="location" size={16} color="#FFBE5D" />
                      </TouchableOpacity>
                    </View>
                    {errors.storeAddress && (
                      <Text style={styles.errorText}>{errors.storeAddress.message}</Text>
                    )}
                  </View>
                )}
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.laterButton} onPress={onLater}>
            <Text style={styles.laterButtonText}>Later</Text>
          </TouchableOpacity>
          <Button onPress={handleSubmit(onConfirm)} style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>Confirm</Text>
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
    position: "absolute",
    right: 8,
    top: "50%",
    transform: [{ translateY: -12 }], // Center vertically
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
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  laterButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#FFBE5D",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  laterButtonText: {
    fontSize: 16,
    color: "#FFBE5D",
    fontWeight: "500",
  },
  confirmButton: {
    flex: 1,
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
});
