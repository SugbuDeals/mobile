import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ErrorAlertProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  type?: 'error' | 'warning' | 'info';
}

export default function ErrorAlert({ 
  message, 
  visible, 
  onDismiss, 
  type = 'error' 
}: ErrorAlertProps) {
  if (!visible || !message) return null;

  const getIconName = () => {
    switch (type) {
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'alert-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return '#ef4444';
    }
  };

  return (
    <Animated.View style={styles.container}>
      <View style={[styles.alert, type === 'error' && styles.errorAlert]}>
        <View style={styles.content}>
          <Ionicons 
            name={getIconName()} 
            size={20} 
            color={getIconColor()} 
            style={styles.icon}
          />
          <Text style={[styles.message, type === 'error' && styles.errorText]}>
            {message}
          </Text>
          <TouchableOpacity 
            onPress={onDismiss}
            style={styles.dismissButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={18} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  alert: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    borderLeftColor: '#ef4444',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 8,
    marginTop: 1,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
    lineHeight: 20,
  },
  errorText: {
    color: '#dc2626',
  },
  dismissButton: {
    marginLeft: 8,
    padding: 4,
  },
});
