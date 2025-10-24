import React from "react";
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

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
  borderRadius = 16,
  backgroundColor = "#ffffff",
  padding = 0,
  margin = 8,
  shadow = true,
  borderWidth = 0,
  borderColor = "#e0e0e0",
}: CardProps) {
  const cardStyles: ViewStyle = {
    backgroundColor,
    borderRadius,
    padding,
    margin,
    borderWidth,
    borderColor,
    ...(shadow && {
      // iOS shadow properties
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: elevation / 2,
      },
      shadowOpacity: 0.1 * (elevation / 4),
      shadowRadius: elevation,
      // Android elevation
      elevation: elevation,
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
