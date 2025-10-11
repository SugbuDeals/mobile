import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
  icon?: React.ReactNode;
}

export default function Toggle({ value, onValueChange, label, icon }: ToggleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#e5e7eb", true: "#277874" }}
        thumbColor={value ? "#ffffff" : "#ffffff"}
        ios_backgroundColor="#e5e7eb"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#277874",
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "500",
  },
});
