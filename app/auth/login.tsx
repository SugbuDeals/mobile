import Button from "@/components/Button";
import Card from "@/components/Card";
import Divider from "@/components/Divider";
import TextField from "@/components/TextField";
import { useLogin } from "@/features/auth";
import Ionicons from "@expo/vector-icons/Ionicons";
import { yupResolver } from "@hookform/resolvers/yup";
import { Link } from "expo-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import * as yup from "yup";

const schema = yup.object().shape({
  email: yup.string().required("Email is required").email("Invalid email"),
  password: yup.string().required("Password is required"),
});

export default function Login() {
  const {
    action: { login },
    state: { accessToken, loading, error },
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

  const onSignIn = (formData: yup.InferType<typeof schema>) => {
    login(formData);
  };

  useEffect(() => {
    if (!loading && !error) console.log(`access_token: ${accessToken}`);
    console.log(`error: ${error}`);
  }, [accessToken, loading, error]);

  return (
    <View style={styles.background}>
      <View style={styles.circle} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="person" size={24} color="white" />
            </View>
            <Text style={styles.headerGreeting}>Welcome</Text>
            <Text style={styles.headerSubtitle}>Please enter your details</Text>
          </View>

          <Card style={styles.card}>
            <Controller
              control={control}
              name="email"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextField
                  label="Email"
                  placeholder="Enter your email..."
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
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
                  placeholder="Enter your password..."
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
                  secureTextEntry
                />
              )}
            />
            <Button onPress={handleSubmit(onSignIn)}>
              <Text>Sign In</Text>
            </Button>

            <Divider text="Or continue with" />

            <View style={styles.signInOptionsContainer}>
              <Button variant="outline">
                <Ionicons name="logo-google" />
              </Button>
              <Button variant="outline">
                <Ionicons name="logo-apple" />
              </Button>
              <Button variant="outline">
                <Ionicons name="logo-facebook" />
              </Button>
            </View>
          </Card>

          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <Text style={{ color: "white" }}>Don&apos;t have an account? </Text>
            <Link
              style={{ color: "#FFBE5E", fontWeight: "bold" }}
              href="/auth/register"
            >
              Sign up
            </Link>
          </View>

          <View
            style={{ flexDirection: "row", justifyContent: "center", gap: 20 }}
          >
            <Link
              style={{ color: "#FFBE5E", fontWeight: "bold" }}
              href="/(consumers)"
            >
              Consumer
            </Link>
            <Link
              style={{ color: "#FFBE5E", fontWeight: "bold" }}
              href="/auth/setup"
            >
              Retailer Setup
            </Link>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#0d9488",
    position: "relative",
  },
  circle: {
    position: "absolute",
    top: -200,
    right: -200,
    width: 600,
    height: 600,
    backgroundColor: "#FFBE5E",
    borderRadius: "100%",
  },
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: "column",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 28,
  },
  header: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerGreeting: {
    fontSize: 26,
    fontWeight: "bold",
    color: "black",
  },
  headerSubtitle: {
    fontSize: 18,
    color: "black",
  },
  signInOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
});
