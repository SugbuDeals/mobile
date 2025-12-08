import React from "react";
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

/**
 * Props for the Card component
 */
export interface CardProps {
  /** Card content */
  children?: React.ReactNode;
  /** Custom style for card */
  style?: StyleProp<ViewStyle>;
  /** Callback when card is pressed (makes card pressable) */
  onPress?: (event: GestureResponderEvent) => void;
  /** Disable card interaction */
  disabled?: boolean;
  /** Elevation/shadow depth (Android) */
  elevation?: number;
  /** Border radius */
  borderRadius?: number;
  /** Background color */
  backgroundColor?: string;
  /** Internal padding */
  padding?: number;
  /** External margin */
  margin?: number;
  /** Enable shadow/elevation */
  shadow?: boolean;
  /** Border width */
  borderWidth?: number;
  /** Border color */
  borderColor?: string;
}

/**
 * A versatile card component that can be used as a container or pressable element.
 * 
 * Supports custom styling, elevation, borders, and can be made pressable with onPress.
 * Automatically handles touch feedback and disabled states.
 * 
 * @component
 * @example
 * ```tsx
 * // Basic card
 * <Card>
 *   <Text>Card content</Text>
 * </Card>
 * 
 * // Pressable card
 * <Card onPress={handlePress}>
 *   <Text>Clickable card</Text>
 * </Card>
 * 
 * // Custom styling
 * <Card
 *   backgroundColor="#f0f0f0"
 *   borderRadius={12}
 *   padding={20}
 *   elevation={8}
 * >
 *   <Text>Custom styled card</Text>
 * </Card>
 * 
 * // Disabled card
 * <Card onPress={handlePress} disabled>
 *   <Text>Disabled card</Text>
 * </Card>
 * ```
 * 
 * @param {CardProps} props - Card component props
 * @returns {JSX.Element} Card component
 */
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
