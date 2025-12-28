import { useCallback, useEffect, useState } from "react";
import { getAllSheets } from "@/lib/db/operations";
import type { SheetRecord } from "@/lib/db/schema";

export function useSheetList() {
  const [sheets, setSheets] = useState<SheetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSheets = useCallback(async () => {
    try {
      const allSheets = await getAllSheets();
      setSheets(
        allSheets.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
      );
    } catch (error) {
      console.error("Failed to load sheets:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSheets = useCallback(async () => {
    const allSheets = await getAllSheets();
    setSheets(
      allSheets.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
    );
  }, []);

  const removeSheetFromList = useCallback((sheetId: string) => {
    setSheets((prev) => prev.filter((s) => s.id !== sheetId));
  }, []);

  useEffect(() => {
    loadSheets();
  }, [loadSheets]);

  return {
    sheets,
    isLoading,
    refreshSheets,
    removeSheetFromList,
  };
}
