import { logout } from '@/features/auth/slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAllAuthData, debugAuthState, forceLogout } from '@/utils/debugAuth';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const AuthDebugPanel = () => {
  const dispatch = useAppDispatch();
  const { user, accessToken } = useAppSelector((state) => state.auth);

  const handleDebugAuth = async () => {
    await debugAuthState();
    Alert.alert('Debug Info', 'Check console for auth debug information');
  };

  const handleClearAuth = async () => {
    await clearAllAuthData();
    Alert.alert('Cleared', 'All auth data cleared from AsyncStorage');
  };

  const handleForceLogout = async () => {
    await forceLogout();
    dispatch(logout());
    Alert.alert('Force Logout', 'All auth data cleared and logout dispatched');
  };

  const handleNormalLogout = () => {
    dispatch(logout());
    Alert.alert('Normal Logout', 'Logout action dispatched');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth Debug Panel</Text>
      <Text style={styles.info}>Current User: {user?.email || 'None'}</Text>
      <Text style={styles.info}>Has Token: {accessToken ? 'Yes' : 'No'}</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleDebugAuth}>
        <Text style={styles.buttonText}>Debug Auth State</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={handleClearAuth}>
        <Text style={styles.buttonText}>Clear AsyncStorage</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={handleForceLogout}>
        <Text style={styles.buttonText}>Force Logout</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={handleNormalLogout}>
        <Text style={styles.buttonText}>Normal Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  title: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  info: {
    color: 'white',
    fontSize: 12,
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
});
