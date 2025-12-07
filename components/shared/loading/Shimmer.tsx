import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle, DimensionValue } from "react-native";
import { colors } from "@/styles/theme";

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

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

interface ShimmerLineProps {
  width?: number | string;
  style?: ViewStyle;
}

export function ShimmerLine({ width = "100%", style }: ShimmerLineProps) {
  return <Shimmer width={width} height={14} borderRadius={8} style={style} />;
}

interface ShimmerCardProps {
  style?: ViewStyle;
}

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

