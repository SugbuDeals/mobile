import Button from "@/components/Button";
import Divider from "@/components/Divider";
import TextField from "@/components/TextField";
import { useLogin } from "@/features/auth";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { yupResolver } from "@hookform/resolvers/yup";
import { Link, router } from "expo-router";
import { useEffect } from "react";
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
  email: yup.string().required("Email is required").email("Invalid email"),
  password: yup.string().required("Password is required"),
});

export default function Login() {
  const {
    action: { login },
    state: { accessToken, loading, user, error },
  } = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    console.log(`access_token: ${accessToken}`);
    console.log(`error: ${error}`);
  }, [accessToken, error]);

  const onSignIn = (formData: yup.InferType<typeof schema>) => {
    login(formData);
  };

  useEffect(() => {
    if (!loading && accessToken && user) {
      const normalizedRole = String(
        (user as any).user_type ?? (user as any).role ?? ""
      ).toLowerCase();
      if (normalizedRole === "retailer") {
        router.replace("/(retailers)");
      } else {
        router.replace("/(consumers)");
      }
    }
  }, [accessToken, loading, user]);

  const { width: screenWidth } = Dimensions.get("window");
  const circleSize = Math.min(screenWidth * 1.1, 440);
  const circleDynamicStyle = {
    width: circleSize,
    height: circleSize,
    top: -circleSize * 0.15,
    right: -circleSize * 0.2,
    borderRadius: circleSize / 2,
  } as const;

  return (
    <View style={styles.container}>
      {/* Decorative top-right circle (using a View since image asset isn't present) */}
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
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={96}
              color="#ffffff"
              style={styles.headerImage}
            />
            <Text style={styles.headerTitle}>Welcome</Text>
            <Text style={styles.headerSubtitle}>Please enter your details</Text>
          </View>

          <View style={styles.formSection}>
            <Controller
              control={control}
              name="email"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextField
                  label="Email"
                  iconComponent={
                    <Ionicons name="mail-outline" size={20} color="#14B8A6" />
                  }
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message as string}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextField
                  label="Password"
                  iconComponent={
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#14B8A6"
                    />
                  }
                  placeholder="Enter your password"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message as string}
                />
              )}
            />

            <TouchableOpacity onPress={() => {}} style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button onPress={handleSubmit(onSignIn)}>
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </Button>

            <Divider text="Or continue with" />

            <View style={styles.linksRow}>
              <Button variant="outline" style={styles.socialIcon}>
                <Ionicons name="logo-google" size={22} color="#4B5563" />
              </Button>
              <Button variant="outline" style={styles.socialIcon}>
                <Ionicons name="logo-apple" size={22} color="#4B5563" />
              </Button>
              <Button variant="outline" style={styles.socialIcon}>
                <Ionicons name="logo-facebook" size={22} color="#4B5563" />
              </Button>
            </View>
          </View>

          <View style={styles.footerSection}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <Link href="/auth/register" style={styles.linkText}>
              Sign up
            </Link>
          </View>

          <View
            style={{ flexDirection: "row", justifyContent: "center", gap: 20 }}
          >
            <Link style={styles.linkText} href="/(consumers)">
              Consumer
            </Link>
            <Link style={styles.linkText} href="/auth/setup">
              Retailer Setup
            </Link>
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
  flex: {
    flex: 1,
  },
  topRightCircle: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 0,
    opacity: 0.9,
    backgroundColor: "#FFBE5E",
  },
  scrollBody: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 68,
    paddingBottom: 32,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 42,
  },
  headerImage: {
    width: 96,
    height: 96,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
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
  forgotRow: {
    alignSelf: "flex-end",
    marginTop: 4,
    marginBottom: 12,
  },
  forgotText: {
    color: "#2563eb",
    fontSize: 13,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  linksRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 13,
  },
  socialIcon: {
    width: 79,
    height: 50,
    marginBottom: 15,
    borderRadius: 7,
    borderWidth: 1.1,
    borderColor: "#8d8d8d",
    alignItems: "center",
    justifyContent: "center",
  },
  footerSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    color: "#ffffff",
    fontSize: 14,
  },
  linkText: {
    color: "#FFBE5E",
    fontSize: 14,
    fontWeight: "600",
  },
});
