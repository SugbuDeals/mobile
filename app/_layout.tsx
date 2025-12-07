import store from "@/store";
import { initApiClient } from "@/services/api/client";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { useEffect } from "react";

// Initialize API client
initApiClient({
  baseURL: "http://192.168.1.48:3000",
  getAccessToken: () => {
    const state = store.getState();
    return state.auth.accessToken || null;
  },
  onUnauthorized: () => {
    // Handle unauthorized - could dispatch logout action
    console.warn("Unauthorized API request");
  },
});

export default function RootLayout() {
  return (
    <Provider store={store}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(consumers)" options={{ headerShown: false }} />
        <Stack.Screen name="(retailers)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      </Stack>
    </Provider>
  );
}
