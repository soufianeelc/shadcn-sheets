import { FaTableCellsLarge } from "react-icons/fa6";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <FaTableCellsLarge className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold mb-1">No files yet</h2>
      <p className="text-muted-foreground text-sm max-w-sm">
        Use the dropzone above to import your first CSV or Excel file. Your
        files are stored locally in your browser.
      </p>
    </div>
  );
}
