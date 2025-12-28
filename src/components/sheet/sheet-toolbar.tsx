"use client";

import { FaCloudArrowDown, FaCloudArrowUp } from "react-icons/fa6";
import { Button } from "@/components/_ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/_ui/tooltip";
import { useSheetStore } from "@/lib/store/sheet-store";

interface SheetToolbarProps {
  onImportClick: () => void;
}

export function SheetToolbar({ onImportClick }: SheetToolbarProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 p-2 border-b border-border bg-background">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onImportClick}>
                <FaCloudArrowUp className="h-4 w-4 mr-1" />
                Import
              </Button>
            </TooltipTrigger>
            <TooltipContent>Import CSV or Excel file</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!useSheetStore.getState().sheetMeta}
                onClick={() => {
                  console.log("Export not yet implemented");
                }}
              >
                <FaCloudArrowDown className="h-4 w-4 mr-1" />
                Export
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export to CSV</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
