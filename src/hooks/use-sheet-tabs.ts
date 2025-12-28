import { useCallback, useEffect, useState } from "react";

interface SheetTab {
  id: string;
  name: string;
}

interface UseSheetTabsProps {
  currentSheetId: string | null;
  currentSheetMeta: { id: string; name: string } | null;
  onTabSelect: (tabId: string) => void;
  onTabRemove: (tabId: string) => void;
}

export function useSheetTabs({
  currentSheetId,
  currentSheetMeta,
  onTabSelect,
  onTabRemove,
}: UseSheetTabsProps) {
  const [openTabs, setOpenTabs] = useState<SheetTab[]>([]);

  useEffect(() => {
    if (
      currentSheetMeta &&
      !openTabs.find((t) => t.id === currentSheetMeta.id)
    ) {
      setOpenTabs((prev) => [
        ...prev,
        { id: currentSheetMeta.id, name: currentSheetMeta.name },
      ]);
    }
  }, [currentSheetMeta, openTabs]);

  const handleTabSelect = useCallback(
    (tabId: string) => {
      onTabSelect(tabId);
    },
    [onTabSelect],
  );

  const handleTabClose = useCallback(
    (tabId: string) => {
      setOpenTabs((prev) => prev.filter((t) => t.id !== tabId));
      onTabRemove(tabId);
    },
    [onTabRemove],
  );

  const removeTab = useCallback((tabId: string) => {
    setOpenTabs((prev) => prev.filter((t) => t.id !== tabId));
  }, []);

  const tabs = openTabs.map((tab) => ({
    ...tab,
    isActive: tab.id === currentSheetId,
  }));

  return {
    tabs,
    openTabs,
    handleTabSelect,
    handleTabClose,
    removeTab,
  };
}
