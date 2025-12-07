import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, typography } from "@/styles/theme";
import { processTextWithHighlights } from "@/utils/textFormatting";

interface FormattedInsightTextProps {
  text: string | null;
  highlight?: string | null;
  elaboration?: string | null;
}

export default function FormattedInsightText({
  text,
  highlight,
  elaboration,
}: FormattedInsightTextProps) {
  const contentParts: Array<{
    type: "highlight" | "elaboration" | "text";
    content: string;
  }> = [];
  const seen = new Set<string>();
  const norm = (val?: string | null) => (val || "").trim();

  if (highlight && !seen.has(norm(highlight))) {
    seen.add(norm(highlight));
    contentParts.push({ type: "highlight", content: highlight });
  }

  if (elaboration && !seen.has(norm(elaboration))) {
    seen.add(norm(elaboration));
    contentParts.push({ type: "elaboration", content: elaboration });
  }

  if (text && !seen.has(norm(text))) {
    seen.add(norm(text));
    contentParts.push({ type: "text", content: text });
  }

  if (contentParts.length === 0) return null;

  return (
    <View>
      {contentParts.map((part, partIdx) => {
        if (part.type === "highlight") {
          return (
            <View key={`highlight-${partIdx}`} style={styles.highlightContainer}>
              <View style={styles.highlightIconContainer}>
                <Ionicons name="star" size={16} color={colors.warning} />
              </View>
              <View style={styles.highlightContent}>
                <Text style={styles.highlightLabel}>Key Highlight</Text>
                <FormattedText text={part.content} styleType="highlight" />
              </View>
            </View>
          );
        }

        if (part.type === "elaboration") {
          return (
            <View
              key={`elaboration-${partIdx}`}
              style={styles.elaborationContainer}
            >
              <View style={styles.elaborationIconContainer}>
                <Ionicons
                  name="information-circle"
                  size={16}
                  color={colors.primary}
                />
              </View>
              <View style={styles.elaborationContent}>
                <Text style={styles.elaborationLabel}>More Details</Text>
                <FormattedText text={part.content} styleType="elaboration" />
              </View>
            </View>
          );
        }

        return (
          <View
            key={`text-${partIdx}`}
            style={partIdx > 0 ? styles.insightParagraph : null}
          >
            <FormattedText text={part.content} styleType="text" />
          </View>
        );
      })}
    </View>
  );
}

function FormattedText({
  text,
  styleType,
}: {
  text: string;
  styleType: "highlight" | "elaboration" | "text";
}) {
  const paragraphs = text.split(/\n+/).filter((p) => p.trim());
  const getBaseTextStyle = () => ({
    color: colors.gray900,
    fontWeight: "400" as const,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
  });

  const getHighlightStyle = () => ({
    color: colors.primaryDark,
    fontWeight: "700" as const,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
  });

  return (
    <View>
      {paragraphs.map((paragraph, idx) => {
        const trimmed = paragraph.trim();
        if (!trimmed) return null;

        const isHeading =
          /^[#*•\-]\s/.test(trimmed) ||
          /^\d+\./.test(trimmed) ||
          trimmed.length < 50;

        const textParts = processTextWithHighlights(trimmed, [], {
          highlightColor: colors.primaryDark,
          highlightBackground: colors.primaryLight,
          boldColor: colors.gray900,
        });

        return (
          <View key={idx} style={idx > 0 ? styles.insightParagraph : null}>
            {isHeading ? (
              <Text style={styles.insightsHeading}>
                {trimmed.replace(/^\d+\.|[-•*]|\*\*/g, "").trim()}
              </Text>
            ) : (
              <Text
                style={
                  styleType === "highlight"
                    ? styles.highlightTextContainer
                    : styleType === "elaboration"
                    ? styles.elaborationTextContainer
                    : styles.insightsTextContainer
                }
              >
                {textParts.map((part, partIdx) => (
                  <Text key={partIdx} style={part.style}>
                    {part.text}
                  </Text>
                ))}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  highlightContainer: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  highlightIconContainer: {
    marginRight: spacing.sm,
  },
  highlightContent: {
    flex: 1,
  },
  highlightLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.warningDark,
    marginBottom: spacing.xs,
  },
  highlightTextContainer: {
    color: colors.warningDark,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
  },
  elaborationContainer: {
    flexDirection: "row",
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  elaborationIconContainer: {
    marginRight: spacing.sm,
  },
  elaborationContent: {
    flex: 1,
  },
  elaborationLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  elaborationTextContainer: {
    color: colors.primaryDark,
    fontWeight: typography.fontWeight.medium,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
  },
  insightParagraph: {
    marginTop: spacing.sm,
  },
  insightsHeading: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  insightsTextContainer: {
    color: colors.gray700,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
  },
});

