"use client";

import { memo } from "react";
import type { Column, RowData } from "@/types";
import { SheetCell } from "./sheet-cell";

interface SheetRowProps {
  rowIndex: number;
  rowData: RowData | undefined;
  columns: Column[];
  activeCell: { row: number; col: string } | null;
  editingCell: { row: number; col: string } | null;
  editValue: string;
  onCellSelect: (row: number, col: string) => void;
  onCellDoubleClick: () => void;
  onEditChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  style?: React.CSSProperties;
}

export const SheetRow = memo(function SheetRow({
  rowIndex,
  rowData,
  columns,
  activeCell,
  editingCell,
  editValue,
  onCellSelect,
  onCellDoubleClick,
  onEditChange,
  onCommit,
  onCancel,
  style,
}: SheetRowProps) {
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <div className="flex" style={style}>
      {sortedColumns.map((column) => {
        const isActive =
          activeCell?.row === rowIndex && activeCell?.col === column.id;
        const isEditing =
          editingCell?.row === rowIndex && editingCell?.col === column.id;

        return (
          <SheetCell
            key={column.id}
            rowIndex={rowIndex}
            colId={column.id}
            value={rowData?.[column.id]}
            width={column.width}
            isActive={isActive}
            isEditing={isEditing}
            editValue={isEditing ? editValue : ""}
            onSelect={onCellSelect}
            onDoubleClick={onCellDoubleClick}
            onEditChange={onEditChange}
            onCommit={onCommit}
            onCancel={onCancel}
          />
        );
      })}
    </div>
  );
});

SheetRow.displayName = "SheetRow";
