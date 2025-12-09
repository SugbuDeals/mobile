import { useState, useCallback } from "react";

export interface UseTabsReturn<T extends string> {
  activeTab: T;
  setActiveTab: (tab: T) => void;
  isActive: (tab: T) => boolean;
  reset: () => void;
}

/**
 * Hook for managing tab selection state
 * @param initialTab - Initial active tab
 * @returns Tab state and control functions
 */
export function useTabs<T extends string>(initialTab: T): UseTabsReturn<T> {
  const [activeTab, setActiveTab] = useState<T>(initialTab);

  const isActive = useCallback(
    (tab: T) => {
      return activeTab === tab;
    },
    [activeTab]
  );

  const reset = useCallback(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return {
    activeTab,
    setActiveTab,
    isActive,
    reset,
  };
}

