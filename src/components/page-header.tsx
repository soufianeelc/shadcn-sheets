import { FaCloudArrowDown } from "react-icons/fa6";
import { Button } from "@/components/_ui/button";
import { SidebarTrigger } from "@/components/_ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/_ui/tooltip";

interface PageHeaderProps {
  showExport: boolean;
  isExportDisabled: boolean;
  onExportClick: () => void;
}

export function PageHeader({
  showExport,
  isExportDisabled,
  onExportClick,
}: PageHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      {showExport && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isExportDisabled}
                onClick={onExportClick}
              >
                <FaCloudArrowDown className="h-4 w-4 mr-1" />
                Export
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export to CSV</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </header>
  );
}
