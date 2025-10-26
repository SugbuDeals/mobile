import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  text?: string;
  overlay?: boolean;
}

export default function LoadingSpinner({ 
  size = 'large', 
  text = 'Loading...', 
  overlay = false 
}: LoadingSpinnerProps) {
  const containerStyle = overlay ? styles.overlay : styles.container;
  
  return (
    <View style={containerStyle}>
      <View style={styles.spinnerContainer}>
        <ActivityIndicator 
          size={size} 
          color="#FFBE5D" 
          style={styles.spinner}
        />
        {text && <Text style={styles.loadingText}>{text}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(39, 120, 116, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    color: '#FFBE5D',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
