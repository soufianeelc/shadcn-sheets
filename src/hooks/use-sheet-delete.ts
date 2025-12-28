import { useCallback, useState } from "react";
import { deleteSheet } from "@/lib/db/operations";

interface DeleteState {
  id: string;
  name: string;
}

export function useSheetDelete() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sheetToDelete, setSheetToDelete] = useState<DeleteState | null>(null);

  const initiateDelete = useCallback((id: string, name: string) => {
    setSheetToDelete({ id, name });
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(
    async (onSuccess?: (sheetId: string) => void) => {
      if (!sheetToDelete) return;

      try {
        await deleteSheet(sheetToDelete.id);
        onSuccess?.(sheetToDelete.id);
        setDeleteDialogOpen(false);
        setSheetToDelete(null);
      } catch (error) {
        console.error("Failed to delete sheet:", error);
      }
    },
    [sheetToDelete],
  );

  const cancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setSheetToDelete(null);
  }, []);

  return {
    deleteDialogOpen,
    sheetToDelete,
    initiateDelete,
    confirmDelete,
    cancelDelete,
    setDeleteDialogOpen,
  };
}
