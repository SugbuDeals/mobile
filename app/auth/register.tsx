import Button from "@/components/Button";
import Card from "@/components/Card";
import TextField from "@/components/TextField";
import { yupResolver } from "@hookform/resolvers/yup";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import * as yup from "yup";

const schema = yup.object().shape({
  fullname: yup.string().required("Name is required"),
  email: yup.string().required("Email is required").email("Invalid email"),
  phone: yup.string().required("Phone number is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must contain at least 8 characters"),
});

export default function Login() {
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
    console.log(formData);
  };

  return (
    <View style={styles.background}>
      <View style={styles.circle} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerGreeting}>Creating Account</Text>
            <Text style={styles.headerSubtitle}>Join our community today</Text>
          </View>

          <Card style={styles.card}>
            {/* Full Name */}
            <Controller
              control={control}
              name="fullname"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextField
                  label="Name"
                  placeholder="John Doe"
                  value={value}
                  onChangeText={onChange}
                  error={errors.fullname?.message}
                />
              )}
            />
            {/* Email */}
            <Controller
              control={control}
              name="email"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextField
                  label="Email"
                  placeholder="your@email.com"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
                />
              )}
            />
            {/* Phone Number */}
            <Controller
              control={control}
              name="phone"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextField
                  label="Phone"
                  placeholder="(+63) 9123456780"
                  value={value}
                  onChangeText={onChange}
                  error={errors.phone?.message}
                />
              )}
            />
            {/* Password */}
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
              <Text>Sign Up</Text>
            </Button>
          </Card>

          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <Text style={{ color: "white" }}>Already have an account? </Text>
            <Link style={{ color: "#FFBE5E", fontWeight: "bold" }} href="/auth/login">Sign In</Link>
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
