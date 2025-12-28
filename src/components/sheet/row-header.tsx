"use client";

import { memo } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/_ui/context-menu";

interface RowHeaderProps {
  rowIndex: number;
  onInsertAbove: (rowIndex: number) => void;
  onInsertBelow: (rowIndex: number) => void;
  onDelete: (rowIndex: number) => void;
  style?: React.CSSProperties;
}

export const RowHeader = memo(function RowHeader({
  rowIndex,
  onInsertAbove,
  onInsertBelow,
  onDelete,
  style,
}: RowHeaderProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="w-12 h-8 border-r border-b border-border bg-muted flex items-center justify-center text-sm text-muted-foreground select-none flex-shrink-0"
          style={style}
        >
          {rowIndex + 1}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={() => onInsertAbove(rowIndex)}>
          Insert row above
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onInsertBelow(rowIndex)}>
          Insert row below
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onDelete(rowIndex)}
          className="text-destructive"
        >
          Delete row
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

RowHeader.displayName = "RowHeader";
