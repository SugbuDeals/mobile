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

  // Show loading screen while initializing
  if (!isInitialized || authLoading || (user && (user as any).user_type === "retailer" && !isStoreLoaded && storeLoading)) {
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
