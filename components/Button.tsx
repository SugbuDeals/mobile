import React from "react";
import {
    StyleSheet,
    TouchableOpacity,
    TouchableOpacityProps,
} from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  children?: React.ReactNode;
  variant?: "primary" | "outline" | "secondary" | "danger" | "success";
}

export default function Button({
  children,
  variant = "primary",
  style,
  ...rest
}: ButtonProps) {
  return (
    <TouchableOpacity style={[styles.base, styles[variant], style]} {...rest}>
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  primary: {
    backgroundColor: "#F3AF4A",
  },
  secondary: {
    backgroundColor: "#277874",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#277874",
  },
  danger: {
    backgroundColor: "#ef4444",
  },
  success: {
    backgroundColor: "#277874",
  },
});
