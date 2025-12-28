"use client";

import { memo, useCallback } from "react";
import { FaHouse, FaPlus, FaXmark } from "react-icons/fa6";
import { Button } from "@/components/_ui/button";
import { cn } from "@/lib/utils";

interface SheetTab {
  id: string;
  name: string;
  isActive: boolean;
}

interface SheetTabsProps {
  tabs: SheetTab[];
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onAddTab: () => void;
  onHomeClick: () => void;
}

export function SheetTabs({
  tabs,
  onTabSelect,
  onTabClose,
  onAddTab,
  onHomeClick,
}: SheetTabsProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted border-t border-border">
      <Button
        variant="secondary"
        size="icon"
        className="h-9 w-9 rounded-lg"
        onClick={onHomeClick}
      >
        <FaHouse className="h-4 w-4 text-secondary-foreground" />
      </Button>

      <div className="flex items-center gap-1 flex-1 overflow-x-auto">
        {tabs.map((tab) => (
          <SheetTabItem
            key={tab.id}
            tab={tab}
            onSelect={() => onTabSelect(tab.id)}
            onClose={() => onTabClose(tab.id)}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-lg text-secondary-foreground hover:bg-accent"
        onClick={onAddTab}
      >
        <FaPlus className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface SheetTabItemProps {
  tab: SheetTab;
  onSelect: () => void;
  onClose: () => void;
}

const SheetTabItem = memo(function SheetTabItem({
  tab,
  onSelect,
  onClose,
}: SheetTabItemProps) {
  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
    },
    [onClose],
  );

  return (
    <div
      role="tab"
      tabIndex={0}
      aria-selected={tab.isActive}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer select-none transition-colors",
        tab.isActive
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <button
        type="button"
        className={cn(
          "flex items-center justify-center h-4 w-4 rounded transition-colors",
          tab.isActive
            ? "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/20"
            : "text-muted-foreground hover:text-foreground hover:bg-foreground/10",
        )}
        onClick={handleClose}
        aria-label={`Close ${tab.name}`}
      >
        <FaXmark className="h-3 w-3" />
      </button>

      <span className="text-sm font-medium whitespace-nowrap">{tab.name}</span>
    </div>
  );
});
