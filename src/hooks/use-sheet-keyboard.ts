import { useEffect } from "react";
import type { SheetMeta } from "@/types";

interface UseSheetKeyboardProps {
  activeCell: { row: number; col: string } | null;
  editingCell: { row: number; col: string } | null;
  sheetMeta: SheetMeta | null;
  setActiveCell: (cell: { row: number; col: string }) => void;
  startEditing: () => void;
  setEditValue: (value: string) => void;
  updateCell: (
    row: number,
    col: string,
    value: { v: string | number | boolean | null },
  ) => void;
}

export function useSheetKeyboard({
  activeCell,
  editingCell,
  sheetMeta,
  setActiveCell,
  startEditing,
  setEditValue,
  updateCell,
}: UseSheetKeyboardProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeCell || !sheetMeta || editingCell) return;

      const sortedColumns = [...sheetMeta.columns].sort(
        (a, b) => a.order - b.order,
      );
      const currentColIndex = sortedColumns.findIndex(
        (c) => c.id === activeCell.col,
      );

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          if (activeCell.row > 0) {
            setActiveCell({ row: activeCell.row - 1, col: activeCell.col });
          }
          break;

        case "ArrowDown":
          e.preventDefault();
          if (activeCell.row < sheetMeta.rowCount - 1) {
            setActiveCell({ row: activeCell.row + 1, col: activeCell.col });
          }
          break;

        case "ArrowLeft":
          e.preventDefault();
          if (currentColIndex > 0) {
            setActiveCell({
              row: activeCell.row,
              col: sortedColumns[currentColIndex - 1].id,
            });
          }
          break;

        case "ArrowRight":
          e.preventDefault();
          if (currentColIndex < sortedColumns.length - 1) {
            setActiveCell({
              row: activeCell.row,
              col: sortedColumns[currentColIndex + 1].id,
            });
          }
          break;

        case "Enter":
        case "F2":
          e.preventDefault();
          startEditing();
          break;

        case "Delete":
        case "Backspace":
          e.preventDefault();
          updateCell(activeCell.row, activeCell.col, { v: null });
          break;

        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            setEditValue(e.key);
            startEditing();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeCell,
    editingCell,
    sheetMeta,
    setActiveCell,
    startEditing,
    setEditValue,
    updateCell,
  ]);
}
