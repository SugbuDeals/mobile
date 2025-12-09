import { useLogin } from "@/features/auth";
import { useStoreManagement } from "@/features/store";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { state: { user, accessToken, loading: authLoading } } = useLogin();
  const { userStore, storeLoading, isStoreLoaded } = useStoreManagement();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize app state
  React.useEffect(() => {
    if (!authLoading) {
      setIsInitialized(true);
    }
  }, [authLoading]);

  // Show loading screen ONLY while auth is loading
  // Don't block for store data - let it load in background
  // Store data will load asynchronously and won't block navigation
  if (!isInitialized || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '500',
  },
});
