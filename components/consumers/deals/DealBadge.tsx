/**
 * DealBadge Component
 * 
 * Small badge/chip component to display deal type on product cards
 * Provides quick visual identification of what kind of deal is available
 */

import type { DealType } from "@/services/api/types/swagger";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

export interface DealBadgeProps {
  dealType: DealType;
  size?: "small" | "medium" | "large";
}

/**
 * Get icon name for deal type
 */
function getDealIcon(dealType: DealType): keyof typeof Ionicons.glyphMap {
  switch (dealType) {
    case "PERCENTAGE_DISCOUNT":
      return "pricetag-outline";
    case "FIXED_DISCOUNT":
      return "cash-outline";
    case "BOGO":
      return "gift-outline";
    case "BUNDLE":
      return "apps-outline";
    case "QUANTITY_DISCOUNT":
      return "layers-outline";
    case "VOUCHER":
      return "ticket-outline";
    default:
      return "pricetag-outline";
  }
}

/**
 * Get color scheme for deal type
 */
function getDealColors(dealType: DealType): {
  background: string;
  text: string;
  border: string;
} {
  switch (dealType) {
    case "PERCENTAGE_DISCOUNT":
      return {
        background: "#FFF3E0",
        text: "#F57C00",
        border: "#FFB74D",
      };
    case "FIXED_DISCOUNT":
      return {
        background: "#E8F5E9",
        text: "#2E7D32",
        border: "#66BB6A",
      };
    case "BOGO":
      return {
        background: "#F3E5F5",
        text: "#7B1FA2",
        border: "#AB47BC",
      };
    case "BUNDLE":
      return {
        background: "#E3F2FD",
        text: "#1565C0",
        border: "#42A5F5",
      };
    case "QUANTITY_DISCOUNT":
      return {
        background: "#E0F2F1",
        text: "#00695C",
        border: "#26A69A",
      };
    case "VOUCHER":
      return {
        background: "#FFEBEE",
        text: "#C62828",
        border: "#EF5350",
      };
    default:
      return {
        background: "#FFF8E1",
        text: "#F57F17",
        border: "#FFCA28",
      };
  }
}

/**
 * Get short label for deal type
 */
function getDealLabel(dealType: DealType): string {
  switch (dealType) {
    case "PERCENTAGE_DISCOUNT":
      return "% OFF";
    case "FIXED_DISCOUNT":
      return "₱ OFF";
    case "BOGO":
      return "BOGO";
    case "BUNDLE":
      return "Bundle";
    case "QUANTITY_DISCOUNT":
      return "Bulk Deal";
    case "VOUCHER":
      return "Voucher";
    default:
      return "Deal";
  }
}

export default function DealBadge({ dealType, size = "medium" }: DealBadgeProps) {
  const colors = getDealColors(dealType);
  const icon = getDealIcon(dealType);
  const label = getDealLabel(dealType);

  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      icon: 12,
      text: styles.textSmall,
    },
    medium: {
      container: styles.containerMedium,
      icon: 14,
      text: styles.textMedium,
    },
    large: {
      container: styles.containerLarge,
      icon: 16,
      text: styles.textLarge,
    },
  }[size];

  return (
    <View
      style={[
        styles.container,
        sizeStyles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <Ionicons name={icon} size={sizeStyles.icon} color={colors.text} />
      <Text style={[styles.text, sizeStyles.text, { color: colors.text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  containerSmall: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  containerMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  containerLarge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textSmall: {
    fontSize: 9,
  },
  textMedium: {
    fontSize: 10,
  },
  textLarge: {
    fontSize: 12,
  },
});


