"use client";

import { memo, useCallback } from "react";
import { RxDragHandleDots2 } from "react-icons/rx";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/_ui/context-menu";
import { useColumnResize } from "@/hooks/use-column-resize";
import { cn } from "@/lib/utils";
import type { Column } from "@/types";

interface ColumnHeaderProps {
  column: Column;
  onResize: (columnId: string, width: number) => void;
  onInsertLeft: (columnId: string) => void;
  onInsertRight: (columnId: string) => void;
  onDelete: (columnId: string) => void;
}

export const ColumnHeader = memo(function ColumnHeader({
  column,
  onResize,
  onInsertLeft,
  onInsertRight,
  onDelete,
}: ColumnHeaderProps) {
  const { isResizing, handleResizeStart } = useColumnResize({
    columnId: column.id,
    initialWidth: column.width,
    onResize,
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "relative h-8 border-b border-border bg-muted flex items-center justify-center text-sm font-medium select-none",
            isResizing && "bg-muted/80",
          )}
          style={{ width: column.width, minWidth: column.width }}
        >
          {column.id}

          <div
            aria-hidden="true"
            className={cn(
              "absolute -right-[5px] top-1/2 -translate-y-1/2 z-10",
              "w-[10px] h-5 cursor-col-resize flex items-center justify-center",
              "rounded-sm border border-border bg-muted",
              "opacity-0 hover:opacity-100 transition-opacity",
              "hover:bg-accent hover:border-primary/50",
              isResizing && "opacity-100 bg-accent border-primary",
            )}
            onMouseDown={handleResizeStart}
          >
            <RxDragHandleDots2 className="h-3 w-3 text-muted-foreground" />
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-px bg-border" />
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={() => onInsertLeft(column.id)}>
          Insert column left
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onInsertRight(column.id)}>
          Insert column right
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onDelete(column.id)}
          className="text-destructive"
        >
          Delete column
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

interface ColumnHeadersProps {
  columns: Column[];
  onResize: (columnId: string, width: number) => void;
  onInsertColumn: (atIndex: number) => void;
  onDeleteColumn: (columnId: string) => void;
  scrollLeft: number;
}

export function ColumnHeaders({
  columns,
  onResize,
  onInsertColumn,
  onDeleteColumn,
  scrollLeft,
}: ColumnHeadersProps) {
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);

  const handleInsertLeft = useCallback(
    (columnId: string) => {
      const column = columns.find((c) => c.id === columnId);
      if (column) {
        onInsertColumn(column.order);
      }
    },
    [columns, onInsertColumn],
  );

  const handleInsertRight = useCallback(
    (columnId: string) => {
      const column = columns.find((c) => c.id === columnId);
      if (column) {
        onInsertColumn(column.order + 1);
      }
    },
    [columns, onInsertColumn],
  );

  return (
    <div className="flex sticky top-0 z-[5] bg-background overflow-hidden">
      <div className="w-12 h-8 border-r border-b border-border bg-muted shrink-0" />

      <div className="flex-1 overflow-hidden relative">
        <div
          className="flex shrink-0 absolute inset-y-0 left-0"
          style={{
            transform: `translateX(-${scrollLeft}px)`,
            width: totalWidth,
            minWidth: totalWidth,
          }}
        >
          {sortedColumns.map((column) => (
            <ColumnHeader
              key={column.id}
              column={column}
              onResize={onResize}
              onInsertLeft={handleInsertLeft}
              onInsertRight={handleInsertRight}
              onDelete={onDeleteColumn}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

ColumnHeader.displayName = "ColumnHeader";
