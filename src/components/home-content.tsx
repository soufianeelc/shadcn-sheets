import { ScrollArea } from "@/components/_ui/scroll-area";
import { EmptyState } from "@/components/empty-state";
import { InlineDropzone } from "@/components/sheet";
import { SheetFilesList } from "@/components/sheet-files-list";
import type { SheetRecord } from "@/lib/db/schema";

interface HomeContentProps {
  sheets: SheetRecord[];
  isLoading: boolean;
  onFileSelect: (file: File) => void;
  onOpenSheet: (id: string) => void;
  onDeleteSheet: (id: string, name: string) => void;
}

export function HomeContent({
  sheets,
  isLoading,
  onFileSelect,
  onOpenSheet,
  onDeleteSheet,
}: HomeContentProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="p-6">
        <div className="mb-8">
          <InlineDropzone onFileSelect={onFileSelect} />
        </div>

        <SheetFilesList
          sheets={sheets}
          isLoading={isLoading}
          onOpenSheet={onOpenSheet}
          onDeleteSheet={onDeleteSheet}
          emptyStateContent={<EmptyState />}
        />
      </div>
    </ScrollArea>
  );
}
