import { useDualRole } from "@/hooks/useDualRole";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  surface?: "header" | "default";
}

export default function RoleSwitcherBanner({ surface = "header" }: Props) {
  const { loading, hasDualRole, activeRole, canSwitch, switchRole } =
    useDualRole();

  if (loading || !hasDualRole) {
    return null;
  }

  const nextRole = activeRole === "CONSUMER" ? "RETAILER" : "CONSUMER";
  const nextRoute = nextRole === "CONSUMER" ? "/(consumers)" : "/(retailers)";

  const handleSwitch = async () => {
    if (!canSwitch) return;
    await switchRole();
    router.replace(nextRoute);
  };

  return (
    <TouchableOpacity
      onPress={handleSwitch}
      disabled={!canSwitch}
      style={[
        styles.container,
        surface === "header" && styles.headerPlacement,
        !canSwitch && styles.disabled,
      ]}
    >
      <View style={styles.iconBadge}>
        <Ionicons
          name={activeRole === "CONSUMER" ? "people" : "storefront"}
          size={16}
          color="#0f172a"
        />
      </View>
      <View style={styles.copy}>
        <Text style={styles.heading}>
          {activeRole === "CONSUMER"
            ? "Consumer Mode"
            : "Retailer Mode"}
        </Text>
        <Text style={styles.subheading}>
          {canSwitch
            ? `Tap to switch to ${nextRole === "CONSUMER" ? "Consumer" : "Retailer"}`
            : "Update name/email to re-sync both roles"}
        </Text>
      </View>
      <Ionicons
        name="swap-horizontal"
        size={18}
        color={canSwitch ? "#0f172a" : "#94a3b8"}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    gap: 12,
  },
  headerPlacement: {
    marginLeft: 12,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(39,120,116,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  copy: {
    flex: 1,
  },
  heading: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  subheading: {
    fontSize: 12,
    color: "#475569",
  },
  disabled: {
    opacity: 0.7,
  },
});

