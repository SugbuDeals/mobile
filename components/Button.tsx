import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
} from "react-native";
import { colors, spacing, borderRadius, typography } from "@/styles/theme";

/**
 * Button component variants
 */
export type ButtonVariant = "primary" | "outline" | "secondary" | "danger" | "success";

/**
 * Button size options
 */
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Props for the Button component
 * 
 * @interface ButtonProps
 * @extends {TouchableOpacityProps}
 */
export interface ButtonProps extends TouchableOpacityProps {
  /** Button content - can be a string (auto-wrapped in Text) or React elements */
  children?: React.ReactNode;
  /** Visual style variant of the button */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Shows loading spinner and disables button */
  loading?: boolean;
  /** Makes button take full width of container */
  fullWidth?: boolean;
}

/**
 * A versatile button component with multiple variants, sizes, and states.
 * 
 * Supports both string children (auto-wrapped in Text) and React elements for custom content.
 * Includes loading state, disabled state, and full-width option.
 * 
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Button onPress={handlePress}>Click Me</Button>
 * 
 * // With loading state
 * <Button loading={isSubmitting} onPress={handleSubmit}>
 *   Submit
 * </Button>
 * 
 * // Different variants and sizes
 * <Button variant="danger" size="lg" onPress={handleDelete}>
 *   Delete
 * </Button>
 * 
 * // Custom content
 * <Button variant="outline" onPress={handleShare}>
 *   <Ionicons name="share" size={20} />
 *   <Text>Share</Text>
 * </Button>
 * ```
 * 
 * @param {ButtonProps} props - Button component props
 * @returns {JSX.Element} Button component
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  /** Size-specific style configurations */
  const sizeStyles: Record<ButtonSize, {
    paddingVertical: number;
    paddingHorizontal: number;
    minHeight: number;
    fontSize: number;
  }> = {
    sm: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      minHeight: 36,
      fontSize: typography.fontSize.sm,
    },
    md: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      minHeight: 44,
      fontSize: typography.fontSize.base,
    },
    lg: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      minHeight: 52,
      fontSize: typography.fontSize.lg,
    },
  };

  /**
   * Determines the appropriate text color based on button variant
   * @returns {string} Color value for text/loading indicator
   */
  const getTextColor = (): string => {
    if (variant === "outline") return colors.primary;
    return colors.white;
  };

  /**
   * Renders button content - handles string children, React elements, and loading state
   * @returns {React.ReactNode} Rendered content
   */
  const renderContent = (): React.ReactNode => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
        />
      );
    }

    // If children is a string, wrap it in Text with proper styling
    if (typeof children === "string") {
      return (
        <Text style={[styles.text, styles[`${variant}Text`], { fontSize: sizeStyles[size].fontSize }]}>
          {children}
        </Text>
      );
    }

    // Otherwise, render children as-is (for custom content like icons)
    return children;
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...rest}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.6,
  },
  primary: {
    backgroundColor: "#F3AF4A", // Keep original color for backward compatibility
  },
  secondary: {
    backgroundColor: colors.primary,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.error,
  },
  success: {
    backgroundColor: colors.success,
  },
  text: {
    fontWeight: typography.fontWeight.semibold,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.white,
  },
  outlineText: {
    color: colors.primary,
  },
  dangerText: {
    color: colors.white,
  },
  successText: {
    color: colors.white,
  },
});
