import store from "@/store";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(consumers)" options={{ headerShown: false }} />
        <Stack.Screen name="(retailers)" options={{ headerShown: false }} />
      </Stack>
    </Provider>
  );
}