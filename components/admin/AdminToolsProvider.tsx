import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import AdminTools, { AdminTool } from "./AdminTools";

interface AdminToolsContextValue {
  setTools: (tools: AdminTool[]) => void;
  setRefreshHandler: (handler: () => void) => void;
  setExportHandler: (handler: () => void) => void;
  setSearchHandler: (handler: () => void) => void;
  setShowRefresh: (show: boolean) => void;
  setShowExport: (show: boolean) => void;
  setShowSearch: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setPosition: (position: "bottom-right" | "bottom-left" | "top-right") => void;
  setCompact: (compact: boolean) => void;
}

const AdminToolsContext = createContext<AdminToolsContextValue | undefined>(undefined);

export function useAdminTools() {
  const context = useContext(AdminToolsContext);
  if (!context) {
    throw new Error("useAdminTools must be used within AdminToolsProvider");
  }
  return context;
}

interface AdminToolsProviderProps {
  children: ReactNode;
}

export function AdminToolsProvider({ children }: AdminToolsProviderProps) {
  const [tools, setTools] = useState<AdminTool[]>([]);
  const [onRefresh, setOnRefresh] = useState<(() => void) | undefined>(undefined);
  const [onExport, setOnExport] = useState<(() => void) | undefined>(undefined);
  const [onSearch, setOnSearch] = useState<(() => void) | undefined>(undefined);
  const [showRefresh, setShowRefresh] = useState(true);
  const [showExport, setShowExport] = useState(true);
  const [showSearch, setShowSearch] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [position, setPosition] = useState<"bottom-right" | "bottom-left" | "top-right">("bottom-right");
  const [compact, setCompact] = useState(false);

  const contextValue: AdminToolsContextValue = useMemo(() => ({
    setTools,
    setRefreshHandler: setOnRefresh,
    setExportHandler: setOnExport,
    setSearchHandler: setOnSearch,
    setShowRefresh,
    setShowExport,
    setShowSearch,
    setShowSettings,
    setPosition,
    setCompact,
  }), []);

  return (
    <AdminToolsContext.Provider value={contextValue}>
      {children}
      <AdminTools
        tools={tools}
        onRefresh={onRefresh}
        onExport={onExport}
        onSearch={onSearch}
        showRefresh={showRefresh}
        showExport={showExport}
        showSearch={showSearch}
        showSettings={showSettings}
        position={position}
        compact={compact}
      />
    </AdminToolsContext.Provider>
  );
}
