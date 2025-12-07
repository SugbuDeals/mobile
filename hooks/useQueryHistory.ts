import { useState, useCallback } from "react";
import type { QueryHistoryEntry } from "@/components/consumers/explore/QueryHistoryModal";

const MAX_HISTORY_ENTRIES = 10;

export function useQueryHistory() {
  const [history, setHistory] = useState<QueryHistoryEntry[]>([]);

  const addEntry = useCallback(
    (
      query: string,
      response: string,
      resultsCount: number
    ) => {
      const entry: QueryHistoryEntry = {
        id: Date.now(),
        query: query.trim(),
        response: response || "No response received",
        timestamp: new Date(),
        resultsCount,
      };
      setHistory((prev) => [entry, ...prev.slice(0, MAX_HISTORY_ENTRIES - 1)]);
    },
    []
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    addEntry,
    clearHistory,
  };
}

