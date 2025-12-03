import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
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

const ROLE_OPTIONS = [
  {
    key: "CONSUMER",
    title: "Smart Shopper",
    description: "Unlock curated deals, flash drops, and nearby steals.",
    chip: "Discover",
    accent: "#277874",
    gradient: ["#d3f5ef", "#a7ede0"],
    icon: "pricetag-outline" as const,
  },
  {
    key: "RETAILER",
    title: "Store Owner",
    description: "Showcase products, push promos, and grow loyal fans.",
    chip: "Build",
    accent: "#FFBE5E",
    gradient: ["#fff1da", "#ffe0aa"],
    icon: "storefront-outline" as const,
  },
] as const;

type RoleKey = (typeof ROLE_OPTIONS)[number]["key"];

export default function Register() {
  const {
    action: { register, login },
  } = useLogin();
  const {
    action: { createStore },
  } = useStore();
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
  const [selectedRole, setSelectedRole] = React.useState<RoleKey>("CONSUMER");
  const isRetailer = selectedRole === "RETAILER";

  const handleRoleSelect = React.useCallback((role: RoleKey) => {
    setSelectedRole(role);
    Haptics.selectionAsync();
  }, []);

  const onCreate = async (formData: yup.InferType<typeof schema>) => {
    try {
      setSubmitting(true);
      
      // Register the user
      const result = await register({ 
        name: formData.name, 
        email: formData.email, 
        password: formData.password, 
        role: selectedRole
      }).unwrap();
      
      // Automatically log in the user after successful registration
      try {
        await login({
          email: formData.email,
          password: formData.password,
        }).unwrap();
        
        if (isRetailer) {
          // Redirect retailers to setup page - store will be created during setup
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


  const renderRoleCard = React.useCallback(
    (roleOption: (typeof ROLE_OPTIONS)[number], extraWrapperStyles?: any) => {
      const isActive = roleOption.key === selectedRole;
      return (
        <TouchableOpacity
          key={roleOption.key}
          style={[
            styles.roleCardWrapper,
            isActive && styles.roleCardWrapperActive,
            extraWrapperStyles,
            isActive && {
              borderColor: roleOption.accent,
              shadowColor: roleOption.accent,
            },
          ]}
          onPress={() => handleRoleSelect(roleOption.key)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={roleOption.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.roleCard, isActive && styles.roleCardActive]}
          >
            <View
              style={[
                styles.roleIconBadge,
                {
                  backgroundColor: `${roleOption.accent}1a`,
                  borderColor: roleOption.accent,
                },
              ]}
            >
              <Ionicons
                name={roleOption.icon}
                size={20}
                color={roleOption.accent}
              />
            </View>
            <Text
              style={[
                styles.roleTitle,
                { color: roleOption.accent },
                isActive && styles.roleTitleActive,
              ]}
            >
              {roleOption.title}
            </Text>
            <Text style={styles.roleDescription}>{roleOption.description}</Text>
            <View
              style={[
                styles.roleChipBase,
                {
                  borderColor: roleOption.accent,
                  backgroundColor: isActive ? roleOption.accent : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.roleChipText,
                  { color: roleOption.accent },
                  isActive && styles.roleChipTextActive,
                ]}
              >
                {roleOption.chip}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    },
    [handleRoleSelect, selectedRole]
  );

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
            <View style={styles.roleGrid}>
              <View style={styles.roleRow}>
                {ROLE_OPTIONS.map((role) => renderRoleCard(role))}
              </View>
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
  roleGrid: {
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  roleCardWrapper: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  roleCardWrapperActive: {
    borderColor: "#277874",
    shadowColor: "#277874",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  roleCard: {
    padding: 14,
    minHeight: 150,
  },
  roleCardActive: {
    borderColor: "transparent",
  },
  roleIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  roleTitleActive: {
    color: "#0b3b38",
  },
  roleDescription: {
    fontSize: 12,
    color: "#475569",
    marginTop: 6,
    lineHeight: 18,
  },
  roleChipBase: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 12,
    color: "#0f172a",
    fontWeight: "600",
  },
  roleChipTextActive: {
    color: "#ffffff",
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
