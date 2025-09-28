import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function RetailerHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Retailer Home</Text>
      <Text>Welcome! This is the retailer dashboard.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
});
