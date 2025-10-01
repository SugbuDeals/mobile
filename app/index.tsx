import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View style={{ padding: 10 }}>
      <Text>Welcome to SugbuDeals</Text>
      <Link href="/auth/login">Login</Link>
      <Link href="/auth/register">Register</Link>
      <Link href="/(consumers)">Consumer</Link>
    </View>
  );
}
