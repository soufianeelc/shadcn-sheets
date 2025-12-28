"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSheetKeyboard } from "@/hooks/use-sheet-keyboard";
import { useSheetStore } from "@/lib/store/sheet-store";
import { DEFAULT_ROW_HEIGHT } from "@/types";
import { ColumnHeaders } from "./column-header";
import { RowHeader } from "./row-header";
import { SheetRow } from "./sheet-row";

export function SheetContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  const {
    sheetMeta,
    viewportData,
    activeCell,
    editingCell,
    editValue,
    loadViewport,
    setActiveCell,
    startEditing,
    cancelEditing,
    setEditValue,
    commitEdit,
    resizeColumn,
    insertColumn,
    deleteColumn,
    insertRow,
    deleteRow,
    updateCell,
  } = useSheetStore();

  const rowVirtualizer = useVirtualizer({
    count: sheetMeta?.rowCount ?? 0,
    getScrollElement: () => containerRef.current,
    estimateSize: () => DEFAULT_ROW_HEIGHT,
    overscan: 10,
  });

  useEffect(() => {
    const virtualItems = rowVirtualizer.getVirtualItems();
    if (virtualItems.length === 0) return;

    const startRow = virtualItems[0].index;
    const endRow = virtualItems[virtualItems.length - 1].index;

    loadViewport(startRow, endRow);
  }, [loadViewport, rowVirtualizer.getVirtualItems]);

  useSheetKeyboard({
    activeCell,
    editingCell,
    sheetMeta,
    setActiveCell,
    startEditing,
    setEditValue,
    updateCell,
  });

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  }, []);

  const handleCellSelect = useCallback(
    (row: number, col: string) => {
      setActiveCell({ row, col });
    },
    [setActiveCell],
  );

  const handleCellDoubleClick = useCallback(() => {
    startEditing();
  }, [startEditing]);

  const handleInsertRowAbove = useCallback(
    (rowIndex: number) => {
      insertRow(rowIndex);
    },
    [insertRow],
  );

  const handleInsertRowBelow = useCallback(
    (rowIndex: number) => {
      insertRow(rowIndex + 1);
    },
    [insertRow],
  );

  const handleDeleteRow = useCallback(
    (rowIndex: number) => {
      deleteRow(rowIndex);
    },
    [deleteRow],
  );

  const totalWidth =
    sheetMeta?.columns.reduce((sum, col) => sum + col.width, 0) ?? 0;

  if (!sheetMeta) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No sheet loaded
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ColumnHeaders
        columns={sheetMeta.columns}
        onResize={resizeColumn}
        onInsertColumn={insertColumn}
        onDeleteColumn={deleteColumn}
        scrollLeft={scrollLeft}
      />

      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative"
        onScroll={handleScroll}
      >
        <div
          className="relative"
          style={{
            height: rowVirtualizer.getTotalSize(),
            width: totalWidth + 48,
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const rowData = viewportData.get(virtualRow.index);

            return (
              <div
                key={virtualRow.key}
                className="absolute top-0 left-0 flex"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  height: virtualRow.size,
                }}
              >
                <RowHeader
                  rowIndex={virtualRow.index}
                  onInsertAbove={handleInsertRowAbove}
                  onInsertBelow={handleInsertRowBelow}
                  onDelete={handleDeleteRow}
                />

                <SheetRow
                  rowIndex={virtualRow.index}
                  rowData={rowData}
                  columns={sheetMeta.columns}
                  activeCell={activeCell}
                  editingCell={editingCell}
                  editValue={editValue}
                  onCellSelect={handleCellSelect}
                  onCellDoubleClick={handleCellDoubleClick}
                  onEditChange={setEditValue}
                  onCommit={commitEdit}
                  onCancel={cancelEditing}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
