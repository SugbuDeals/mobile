import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle, DimensionValue } from "react-native";
import { colors } from "@/styles/theme";

/**
 * Props for the Shimmer component
 */
export interface ShimmerProps {
  /** Width of shimmer element */
  width?: number | string;
  /** Height of shimmer element */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * A shimmer loading component with animated opacity effect.
 * 
 * Provides a skeleton loading animation for content placeholders.
 * 
 * @component
 * @example
 * ```tsx
 * <Shimmer width="100%" height={20} borderRadius={8} />
 * ```
 * 
 * @param {ShimmerProps} props - Shimmer component props
 * @returns {JSX.Element} Shimmer component
 */
export default function Shimmer({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style,
}: ShimmerProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as DimensionValue,
          height,
          borderRadius,
          backgroundColor: colors.gray200,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Props for the ShimmerLine component
 */
export interface ShimmerLineProps {
  /** Width of shimmer line */
  width?: number | string;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * A pre-configured shimmer component for line placeholders.
 * 
 * @component
 * @example
 * ```tsx
 * <ShimmerLine width="80%" />
 * ```
 * 
 * @param {ShimmerLineProps} props - ShimmerLine component props
 * @returns {JSX.Element} ShimmerLine component
 */
export function ShimmerLine({ width = "100%", style }: ShimmerLineProps) {
  return <Shimmer width={width} height={14} borderRadius={8} style={style} />;
}

/**
 * Props for the ShimmerCard component
 */
export interface ShimmerCardProps {
  /** Custom style */
  style?: ViewStyle;
}

/**
 * A pre-configured shimmer component for card placeholders.
 * 
 * @component
 * @example
 * ```tsx
 * <ShimmerCard />
 * ```
 * 
 * @param {ShimmerCardProps} props - ShimmerCard component props
 * @returns {JSX.Element} ShimmerCard component
 */
export function ShimmerCard({ style }: ShimmerCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Shimmer width="60%" height={16} borderRadius={8} />
      <Shimmer width="40%" height={14} borderRadius={8} style={styles.marginTop} />
      <Shimmer width="80%" height={14} borderRadius={8} style={styles.marginTop} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
  },
  marginTop: {
    marginTop: 8,
  },
});

