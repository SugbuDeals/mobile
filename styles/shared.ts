/**
 * Shared style patterns and utilities
 */

import { StyleSheet } from "react-native";
import { colors, spacing, borderRadius, shadows } from "./theme";

export const sharedStyles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginVertical: spacing.lg,
  },
  
  // Text
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  subheading: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray800,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 16,
    color: colors.gray700,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    color: colors.gray600,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray700,
    marginBottom: spacing.xs,
  },
  
  // Cards
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.gray900,
  },
  
  // Buttons
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  
  // Inputs
  input: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.gray900,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  
  // Dividers
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.md,
  },
  
  // Badges
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  badgePrimary: {
    backgroundColor: colors.primaryLight,
  },
  badgeSuccess: {
    backgroundColor: colors.successLight,
  },
  badgeError: {
    backgroundColor: colors.errorLight,
  },
  badgeWarning: {
    backgroundColor: colors.warningLight,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  badgeTextPrimary: {
    color: colors.primaryDark,
  },
  badgeTextSuccess: {
    color: colors.successDark,
  },
  badgeTextError: {
    color: colors.errorDark,
  },
  badgeTextWarning: {
    color: colors.warningDark,
  },
  
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.gray600,
  },
  
  // Empty states
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray500,
    textAlign: "center",
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray400,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});

