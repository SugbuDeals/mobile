import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { yupResolver } from "@hookform/resolvers/yup";
import { Link, router } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import * as yup from "yup";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().required("Email is required").email("Invalid email"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must contain at least 8 characters"),
});

export default function Register() {
  const { action: { register, login } } = useLogin();
  const { action: { createStore } } = useStore();
  const [submitting, setSubmitting] = React.useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  const [isRetailer, setIsRetailer] = React.useState(false);

  const onCreate = async (formData: yup.InferType<typeof schema>) => {
    try {
      setSubmitting(true);
      const role = isRetailer ? "RETAILER" : "CONSUMER";
      
      // Register the user
      const result = await register({ 
        name: formData.name, 
        email: formData.email, 
        password: formData.password, 
        role 
      }).unwrap();
      
      // Automatically log in the user after successful registration
      try {
        const loginResult = await login({
          email: formData.email,
          password: formData.password,
        }).unwrap();
        
        if (isRetailer) {
          // Automatically create a store for retailers
          try {
            await createStore({
              name: `${formData.name}'s Store`,
              description: "Welcome to my store!",
              ownerId: Number(loginResult.user.id),
            }).unwrap();
          } catch (storeError) {
            console.error("Failed to create store:", storeError);
            // Continue with the flow even if store creation fails
          }
          
          // Redirect retailers to setup page
          router.replace("/auth/setup");
        } else {
          // Redirect consumers to their dashboard
          router.replace("/(consumers)");
        }
      } catch (loginError) {
        console.error("Auto-login failed:", loginError);
        // If auto-login fails, redirect to login page
        alert("Registration successful! Please log in to continue.");
        router.replace("/auth/login");
      }
    } catch (e: any) {
      alert(e?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const { width: screenWidth } = Dimensions.get("window");
  const circleSize = Math.min(screenWidth * 1.1, 440);
  const circleDynamicStyle = {
    width: circleSize,
    height: circleSize,
    top: -circleSize * 0.15,
    right: -circleSize * 0.20,
    borderRadius: circleSize / 2,
  } as const;

  return (
    <View style={styles.container}>
      <View style={[styles.topRightCircle, circleDynamicStyle]} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Join our community today</Text>
          </View>

          <View style={styles.formSection}>
            <Controller
              control={control}
              name="name"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextField
                  label="Full Name"
                  iconComponent={<Ionicons name="person-outline" size={20} color="#14B8A6" />}
                  placeholder="John Doe"
                  value={value}
                  onChangeText={onChange}
                  error={errors.name?.message as string}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextField
                  label="Email Address"
                  iconComponent={<Ionicons name="mail-outline" size={20} color="#14B8A6" />}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message as string}
                />
              )}
            />

            {/* Phone field removed as it is not used in routes */}

            <Controller
              control={control}
              name="password"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextField
                  label="Password"
                  iconComponent={<Ionicons name="lock-closed-outline" size={20} color="#14B8A6" />}
                  placeholder="*********"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message as string}
                />
              )}
            />

            <Text style={styles.label}>Select Role</Text>
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, !isRetailer && styles.activeLabel]}>Customer</Text>
              <TouchableOpacity
                onPress={() => setIsRetailer((v) => !v)}
                activeOpacity={0.9}
                style={[styles.switchPill, isRetailer && styles.switchPillActive]}
              >
                <View style={[styles.switchThumb, isRetailer && styles.switchThumbRight]} />
              </TouchableOpacity>
              <Text style={[styles.switchLabel, isRetailer && styles.activeLabel]}>Store Owner</Text>
            </View>

            <Button onPress={handleSubmit(onCreate)} disabled={submitting}>
              <Text style={styles.primaryButtonText}>{submitting ? "Creating..." : "Create Account"}</Text>
            </Button>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Link href="/auth/login">
                <Text style={styles.loginLink}>Login</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#277874",
  },
  flex: { flex: 1 },
  scrollBody: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 68,
    paddingBottom: 24,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#475569",
    marginTop: 4,
  },
  formSection: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: "#0f172a",
    marginBottom: 6,
    marginTop: 8,
  },
  switchRow: {
    backgroundColor: "#dedede",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 16,
  },
  switchLabel: {
    color: "#64748b",
    fontSize: 14,
  },
  activeLabel: {
    color: "#0f172a",
    fontWeight: "600",
  },
  switchPill: {
    width: 80,
    height: 30,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    padding: 4,
    justifyContent: "center",
  },
  switchPillActive: {
    backgroundColor: "#277874",
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ffffff",
    transform: [{ translateX: 0 }],
  },
  switchThumbRight: {
    transform: [{ translateX: 50 }],
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  loginText: {
    color: "#475569",
    fontSize: 14,
  },
  loginLink: {
    color: "#277874",
    fontSize: 14,
    fontWeight: "700",
  },
  topRightCircle: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 0,
    opacity: 0.9,
    backgroundColor: "#FFBE5E",
  },
});
