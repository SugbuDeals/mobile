import store from "@/store";
import { Stack } from "expo-router";
import { Provider } from "react-redux";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(consumers)" options={{ headerShown: false }} />
      </Stack>
    </Provider>
  );
}
