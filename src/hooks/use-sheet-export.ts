import Papa from "papaparse";
import { useCallback } from "react";
import { getRowsInRange } from "@/lib/db/operations";
import type { SheetMeta } from "@/types";

export function useSheetExport() {
  const exportToCSV = useCallback(
    async (sheetId: string, sheetMeta: SheetMeta) => {
      try {
        const allRows = await getRowsInRange(
          sheetId,
          0,
          sheetMeta.rowCount - 1,
        );

        const sortedColumns = [...sheetMeta.columns].sort(
          (a, b) => a.order - b.order,
        );

        const data: Array<Record<string, string | number | boolean>> = [];

        for (let rowIndex = 0; rowIndex < sheetMeta.rowCount; rowIndex++) {
          const rowData = allRows.get(rowIndex);
          const row: Record<string, string | number | boolean> = {};

          sortedColumns.forEach((col) => {
            const cellValue = rowData?.[col.id];
            const value = cellValue?.v;
            if (value !== null && value !== undefined) {
              row[col.id] = value;
            } else {
              row[col.id] = "";
            }
          });

          data.push(row);
        }

        const csv = Papa.unparse(data, {
          columns: sortedColumns.map((col) => col.id),
          header: true,
        });

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${sheetMeta.name}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Failed to export CSV:", error);
      }
    },
    [],
  );

  return { exportToCSV };
}
