import React from "react";
import {
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Modal } from "@/components/Modal";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, borderRadius, typography } from "@/styles/theme";

export interface QueryHistoryEntry {
  id: number;
  query: string;
  response: string;
  timestamp: Date;
  resultsCount: number;
}

interface QueryHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  history: QueryHistoryEntry[];
  onReuseQuery: (query: string) => void;
}

export default function QueryHistoryModal({
  visible,
  onClose,
  history,
  onReuseQuery,
}: QueryHistoryModalProps) {
  return (
    <Modal
      isOpen={visible}
      onClose={onClose}
      title="Query History"
      size="md"
      variant="default"
    >
      <ScrollView style={styles.historyList}>
        {history.length > 0 ? (
          history.map((entry) => (
            <View key={entry.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyQuery} numberOfLines={2}>
                  {entry.query}
                </Text>
                <Text style={styles.historyTimestamp}>
                  {entry.timestamp.toLocaleDateString()}{" "}
                  {entry.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <Text style={styles.historyResponse} numberOfLines={3}>
                {entry.response}
              </Text>
              <View style={styles.historyFooter}>
                <View style={styles.resultsBadge}>
                  <Ionicons name="list-outline" size={14} color={colors.primary} />
                  <Text style={styles.resultsText}>
                    {entry.resultsCount} results
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.reuseButton}
                  onPress={() => {
                    onReuseQuery(entry.query);
                    onClose();
                  }}
                >
                  <Ionicons name="refresh-outline" size={16} color={colors.primary} />
                  <Text style={styles.reuseButtonText}>Reuse</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyHistoryState}>
            <Ionicons name="time-outline" size={48} color={colors.gray400} />
            <Text style={styles.emptyHistoryText}>No queries yet</Text>
            <Text style={styles.emptyHistorySubtext}>
              Your AI recommendation queries will appear here
            </Text>
          </View>
        )}
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  historyList: {
    maxHeight: 400,
  },
  historyCard: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    margin: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  historyQuery: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    marginRight: spacing.md,
  },
  historyTimestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    fontWeight: typography.fontWeight.medium,
  },
  historyResponse: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  historyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  resultsText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  reuseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9f8",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  reuseButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  emptyHistoryState: {
    alignItems: "center",
    padding: spacing.xxl * 2,
  },
  emptyHistoryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray500,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyHistorySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    textAlign: "center",
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },
});

