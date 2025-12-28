"use client";

import { memo } from "react";
import { useCellEditing, useCellFocus } from "@/hooks/use-cell-editing";
import { cn } from "@/lib/utils";
import { formatCellValue, getTypeIndicator } from "@/lib/utils/cell-formatting";
import type { CellValue } from "@/types";

interface SheetCellProps {
  rowIndex: number;
  colId: string;
  value: CellValue | undefined;
  width: number;
  isActive: boolean;
  isEditing: boolean;
  editValue: string;
  onSelect: (row: number, col: string) => void;
  onDoubleClick: () => void;
  onEditChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}

export const SheetCell = memo(function SheetCell({
  rowIndex,
  colId,
  value,
  width,
  isActive,
  isEditing,
  editValue,
  onSelect,
  onDoubleClick,
  onEditChange,
  onCommit,
  onCancel,
}: SheetCellProps) {
  const { cellRef, inputRef } = useCellFocus({ isActive, isEditing });

  const {
    handleClick,
    handleDoubleClick,
    handleKeyDown,
    handleInputKeyDown,
    handleInputBlur,
  } = useCellEditing({
    rowIndex,
    colId,
    onSelect,
    onDoubleClick,
    onCommit,
    onCancel,
  });

  const formattedValue = formatCellValue(value);
  const isFormula = Boolean(value?.f);
  const typeIndicator = isFormula ? "f(x)" : getTypeIndicator(value?.t);

  return (
    // biome-ignore lint/a11y/useSemanticElements: Using div for virtualized grid performance
    <div
      ref={cellRef}
      role="gridcell"
      tabIndex={isActive && !isEditing ? 0 : -1}
      className={cn(
        "h-8 border-r border-b border-border flex items-center text-sm font-medium text-foreground/70 cursor-cell select-none",
        !isEditing && "px-2",
        isActive &&
          !isEditing &&
          "ring-2 ring-primary bg-primary/5 rounded-sm relative z-10",
        isEditing && "border-2 border-primary p-0 rounded-sm relative z-10",
        value?.t === "e" && "text-destructive",
      )}
      style={{ width, minWidth: width, maxWidth: width }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={isEditing ? undefined : handleKeyDown}
      data-row={rowIndex}
      data-col={colId}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          className="w-full h-full px-2 bg-background text-foreground text-sm outline-none rounded-md"
        />
      ) : (
        <CellDisplay
          value={value}
          formattedValue={formattedValue}
          isActive={isActive}
          isFormula={isFormula}
          typeIndicator={typeIndicator}
        />
      )}
    </div>
  );
});

interface CellDisplayProps {
  value: CellValue | undefined;
  formattedValue: string;
  isActive: boolean;
  isFormula: boolean;
  typeIndicator: string | null;
}

function CellDisplay({
  value,
  formattedValue,
  isActive,
  isFormula,
  typeIndicator,
}: CellDisplayProps) {
  return (
    <>
      {isActive && typeIndicator && (
        <span
          className={cn(
            "text-xs font-serif italic font-medium mr-2 shrink-0",
            isFormula && "text-orange-500",
            !isFormula && value?.t === "n" && "text-blue-500",
            !isFormula && value?.t === "s" && "text-emerald-500",
            !isFormula && value?.t === "b" && "text-violet-500",
            !isFormula && value?.t === "d" && "text-amber-500",
            !isFormula && value?.t === "e" && "text-red-500",
          )}
        >
          {typeIndicator}
        </span>
      )}
      <span
        className={cn("truncate", value?.t === "n" && "ml-auto text-right")}
      >
        {formattedValue}
      </span>
    </>
  );
}

SheetCell.displayName = "SheetCell";
