"use client";

import { FaFileExcel, FaTrash } from "react-icons/fa6";
import { Button } from "@/components/_ui/button";
import type { SheetRecord } from "@/lib/db/schema";
import { cn, formatDistanceToNow, formatFileSize } from "@/lib/utils";

interface FileCardProps {
  sheet: SheetRecord;
  onOpen: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

export function FileCard({ sheet, onOpen, onDelete }: FileCardProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Cannot use button here due to nested Button component inside
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(sheet.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(sheet.id);
        }
      }}
      className={cn(
        "group relative flex flex-col items-center p-6 rounded-xl",
        "bg-card border border-border/50",
        "hover:border-primary/30 hover:bg-accent/50",
        "transition-all duration-200 ease-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "cursor-pointer text-left w-full",
      )}
    >
      {/* Delete button */}
      <span className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(sheet.id, sheet.name);
          }}
        >
          <FaTrash className="h-3.5 w-3.5" />
        </Button>
      </span>

      {/* Icon */}
      <div
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
          "bg-linear-to-br from-green-500/20 to-green-600/10",
          "group-hover:from-green-500/30 group-hover:to-green-600/20",
          "transition-all duration-200",
        )}
      >
        <FaFileExcel className="w-8 h-8 text-green-600 dark:text-green-500" />
      </div>

      {/* File name */}
      <h3 className="font-medium text-foreground truncate max-w-full text-center">
        {sheet.name}
      </h3>

      {/* Metadata */}
      <div className="flex flex-col items-center gap-1 mt-2 text-xs text-muted-foreground">
        {sheet.fileSize && <span>{formatFileSize(sheet.fileSize)}</span>}
        <span>{formatDistanceToNow(sheet.updatedAt)}</span>
      </div>
    </div>
  );
}
