import React from "react";
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { colors, spacing, borderRadius, shadows } from "@/styles/theme";

interface CardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  elevation?: number;
  borderRadius?: number;
  backgroundColor?: string;
  padding?: number;
  margin?: number;
  shadow?: boolean;
  borderWidth?: number;
  borderColor?: string;
}

export default function Card({
  children,
  style,
  onPress,
  disabled = false,
  elevation = 4,
  borderRadius: borderRadiusProp,
  backgroundColor = colors.white,
  padding = spacing.lg,
  margin = spacing.sm,
  shadow = true,
  borderWidth = 0,
  borderColor = colors.gray200,
}: CardProps) {
  const cardStyles: ViewStyle = {
    backgroundColor,
    borderRadius: borderRadiusProp ?? borderRadius.lg,
    padding,
    margin,
    borderWidth,
    borderColor,
    ...(shadow && {
      shadowColor: shadows.md.shadowColor,
      shadowOffset: shadows.md.shadowOffset,
      shadowOpacity: shadows.md.shadowOpacity,
      shadowRadius: shadows.md.shadowRadius,
      elevation: shadows.md.elevation,
    }),
  };

  const content = (
    <View style={[styles.card, cardStyles, style]}>{children}</View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        style={styles.touchable}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  touchable: {
    flex: 0,
  },
});

