import { FileCard } from "@/components/sheet";
import type { SheetRecord } from "@/lib/db/schema";

interface SheetFilesListProps {
  sheets: SheetRecord[];
  isLoading: boolean;
  onOpenSheet: (id: string) => void;
  onDeleteSheet: (id: string, name: string) => void;
  emptyStateContent: React.ReactNode;
}

export function SheetFilesList({
  sheets,
  isLoading,
  onOpenSheet,
  onDeleteSheet,
  emptyStateContent,
}: SheetFilesListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`skeleton-${i}-${Date.now()}`}
            className="h-44 rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (sheets.length === 0) {
    return <>{emptyStateContent}</>;
  }

  return (
    <>
      <h2 className="text-lg font-semibold mb-4">Recent Files</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {sheets.map((sheet) => (
          <FileCard
            key={sheet.id}
            sheet={sheet}
            onOpen={onOpenSheet}
            onDelete={onDeleteSheet}
          />
        ))}
      </div>
    </>
  );
}
