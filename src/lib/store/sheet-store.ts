import { create } from "zustand";
import {
  addPatch,
  getPatch,
  getRowsInRange,
  getSheet,
  toSheetMeta,
  updateCellInChunk,
  updateSheet,
} from "@/lib/db/operations";
import type { PatchOperation, SetCellOperation } from "@/lib/db/schema";
import {
  type CellValue,
  CHUNK_SIZE,
  columnIndexToId,
  getChunkIndex,
  type SheetMeta,
  VIEWPORT_BUFFER,
} from "@/types";
import type { ImportState, SheetState, SheetStore } from "./types";

const MAX_VIEWPORT_SIZE = 2000;

const initialState: SheetState = {
  sheetId: null,
  sheetMeta: null,
  viewportData: new Map(),
  loadedChunks: new Set(),
  viewportStart: 0,
  viewportEnd: 0,
  activeCell: null,
  editingCell: null,
  editValue: "",
  undoStack: [],
  redoStack: [],
  importState: {
    isImporting: false,
    progress: 0,
    error: null,
  },
};

export const useSheetStore = create<SheetStore>((set, get) => ({
  ...initialState,

  loadSheet: async (sheetId: string) => {
    const record = await getSheet(sheetId);
    if (!record) {
      console.error(`Sheet ${sheetId} not found`);
      return;
    }

    set({
      sheetId,
      sheetMeta: toSheetMeta(record),
      viewportData: new Map(),
      loadedChunks: new Set(),
      viewportStart: 0,
      viewportEnd: 0,
      activeCell: null,
      editingCell: null,
      editValue: "",
      undoStack: [],
      redoStack: [],
    });
  },

  unloadSheet: () => {
    set(initialState);
  },

  loadViewport: async (startRow: number, endRow: number) => {
    const { sheetId, loadedChunks, sheetMeta } = get();
    if (!sheetId || !sheetMeta) return;

    const clampedStart = Math.max(0, startRow - VIEWPORT_BUFFER);
    const clampedEnd = Math.min(
      sheetMeta.rowCount - 1,
      endRow + VIEWPORT_BUFFER,
    );

    const startChunk = getChunkIndex(clampedStart);
    const endChunk = getChunkIndex(clampedEnd);

    const neededChunks: number[] = [];
    for (let i = startChunk; i <= endChunk; i++) {
      if (!loadedChunks.has(i)) {
        neededChunks.push(i);
      }
    }

    if (neededChunks.length > 0) {
      const minChunk = Math.min(...neededChunks);
      const maxChunk = Math.max(...neededChunks);
      const startLoadRow = minChunk * CHUNK_SIZE;
      const endLoadRow = (maxChunk + 1) * CHUNK_SIZE - 1;

      const newRows = await getRowsInRange(sheetId, startLoadRow, endLoadRow);

      set((state) => {
        const newViewportData = new Map(state.viewportData);
        const newLoadedChunks = new Set(state.loadedChunks);

        for (const [rowIndex, rowData] of newRows) {
          newViewportData.set(rowIndex, rowData);
        }

        for (const chunkIndex of neededChunks) {
          newLoadedChunks.add(chunkIndex);
        }

        return {
          viewportData: newViewportData,
          loadedChunks: newLoadedChunks,
          viewportStart: clampedStart,
          viewportEnd: clampedEnd,
        };
      });
    } else {
      set({
        viewportStart: clampedStart,
        viewportEnd: clampedEnd,
      });
    }

    get().evictOutOfRangeChunks(clampedStart, clampedEnd);

    const viewportSize = get().viewportData.size;
    if (viewportSize > MAX_VIEWPORT_SIZE) {
      console.warn(
        `[SheetStore] viewportData size (${viewportSize}) exceeds ${MAX_VIEWPORT_SIZE}. Possible leak!`,
      );
    }
  },

  evictOutOfRangeChunks: (startRow: number, endRow: number) => {
    const { loadedChunks } = get();

    const keepStart = getChunkIndex(
      Math.max(0, startRow - VIEWPORT_BUFFER * 2),
    );
    const keepEnd = getChunkIndex(endRow + VIEWPORT_BUFFER * 2);

    const chunksToEvict: number[] = [];
    for (const chunkIndex of loadedChunks) {
      if (chunkIndex < keepStart || chunkIndex > keepEnd) {
        chunksToEvict.push(chunkIndex);
      }
    }

    if (chunksToEvict.length === 0) return;

    set((state) => {
      const newViewportData = new Map(state.viewportData);
      const newLoadedChunks = new Set(state.loadedChunks);

      for (const chunkIndex of chunksToEvict) {
        const chunkStartRow = chunkIndex * CHUNK_SIZE;
        const chunkEndRow = chunkStartRow + CHUNK_SIZE - 1;

        for (let row = chunkStartRow; row <= chunkEndRow; row++) {
          newViewportData.delete(row);
        }

        newLoadedChunks.delete(chunkIndex);
      }

      return {
        viewportData: newViewportData,
        loadedChunks: newLoadedChunks,
      };
    });
  },

  setActiveCell: (position) => {
    const { editingCell } = get();

    if (editingCell) {
      get().commitEdit();
    }

    set({
      activeCell: position,
      editingCell: null,
      editValue: "",
    });
  },

  startEditing: () => {
    const { activeCell, viewportData } = get();
    if (!activeCell) return;

    const rowData = viewportData.get(activeCell.row);
    const cellValue = rowData?.[activeCell.col];

    const editValue = cellValue?.f ?? String(cellValue?.v ?? "");

    set({
      editingCell: activeCell,
      editValue,
    });
  },

  cancelEditing: () => {
    set({
      editingCell: null,
      editValue: "",
    });
  },

  setEditValue: (value: string) => {
    set({ editValue: value });
  },

  commitEdit: async () => {
    const { editingCell, editValue, viewportData, sheetId } = get();
    if (!editingCell || !sheetId) {
      set({ editingCell: null, editValue: "" });
      return;
    }

    const rowData = viewportData.get(editingCell.row);
    const _prevValue: CellValue = rowData?.[editingCell.col] ?? { v: null };

    const isFormula = editValue.startsWith("=");
    const newValue: CellValue = isFormula
      ? { v: null, f: editValue, t: "s" }
      : { v: parseValue(editValue), t: inferType(editValue) };

    await get().updateCell(editingCell.row, editingCell.col, newValue);

    set({
      editingCell: null,
      editValue: "",
    });

    get().recomputeFormulas();
  },

  updateCell: async (row: number, col: string, value: CellValue) => {
    const { sheetId, viewportData } = get();
    if (!sheetId) return;

    const rowData = viewportData.get(row);
    const prevValue: CellValue = rowData?.[col] ?? { v: null };

    set((state) => {
      const newViewportData = new Map(state.viewportData);
      const existingRow = newViewportData.get(row) ?? {};
      newViewportData.set(row, { ...existingRow, [col]: value });
      return { viewportData: newViewportData };
    });

    const operation: SetCellOperation = {
      type: "SET_CELL",
      row,
      col,
      value,
    };

    const inverse: SetCellOperation = {
      type: "SET_CELL",
      row,
      col,
      value: prevValue,
    };

    try {
      await updateCellInChunk(sheetId, row, col, value);

      const patchId = await addPatch(sheetId, operation, inverse);

      set((state) => ({
        undoStack: [...state.undoStack, patchId],
        redoStack: [],
      }));
    } catch (error) {
      console.error("Failed to persist cell update:", error);
      set((state) => {
        const newViewportData = new Map(state.viewportData);
        const existingRow = newViewportData.get(row) ?? {};
        newViewportData.set(row, { ...existingRow, [col]: prevValue });
        return { viewportData: newViewportData };
      });
    }
  },

  undo: async () => {
    const { undoStack, sheetId, viewportStart, viewportEnd } = get();
    if (undoStack.length === 0 || !sheetId) return;

    const patchId = undoStack[undoStack.length - 1];
    const patch = await getPatch(patchId);
    if (!patch) return;

    await applyPatchToStore(get, set, patch.inverse);

    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, patchId],
    }));

    await get().loadViewport(viewportStart, viewportEnd);
  },

  redo: async () => {
    const { redoStack, sheetId, viewportStart, viewportEnd } = get();
    if (redoStack.length === 0 || !sheetId) return;

    const patchId = redoStack[redoStack.length - 1];
    const patch = await getPatch(patchId);
    if (!patch) return;

    await applyPatchToStore(get, set, patch.operation);

    set((state) => ({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, patchId],
    }));

    await get().loadViewport(viewportStart, viewportEnd);
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  resizeColumn: async (columnId: string, width: number) => {
    const { sheetId, sheetMeta } = get();
    if (!sheetId || !sheetMeta) return;

    const prevWidth =
      sheetMeta.columns.find((c) => c.id === columnId)?.width ?? 100;

    set((state) => {
      if (!state.sheetMeta) return state;
      return {
        sheetMeta: {
          ...state.sheetMeta,
          columns: state.sheetMeta.columns.map((c) =>
            c.id === columnId ? { ...c, width } : c,
          ),
        },
      };
    });

    const newColumns = get().sheetMeta?.columns;
    await updateSheet(sheetId, { columns: newColumns });

    const operation: PatchOperation = {
      type: "RESIZE_COLUMN",
      columnId,
      width,
    };
    const inverse: PatchOperation = {
      type: "RESIZE_COLUMN",
      columnId,
      width: prevWidth,
    };

    const patchId = await addPatch(sheetId, operation, inverse);
    set((state) => ({
      undoStack: [...state.undoStack, patchId],
      redoStack: [],
    }));
  },

  insertColumn: async (atIndex: number) => {
    const { sheetId, sheetMeta } = get();
    if (!sheetId || !sheetMeta) return;

    const newColumnId = columnIndexToId(sheetMeta.columnCount);
    const newColumn = {
      id: newColumnId,
      width: 100,
      order: atIndex,
    };

    const newColumns = [
      ...sheetMeta.columns.map((c) =>
        c.order >= atIndex ? { ...c, order: c.order + 1 } : c,
      ),
      newColumn,
    ].sort((a, b) => a.order - b.order);

    set((state) => ({
      sheetMeta: state.sheetMeta
        ? {
            ...state.sheetMeta,
            columnCount: state.sheetMeta.columnCount + 1,
            columns: newColumns,
          }
        : null,
    }));

    await updateSheet(sheetId, {
      columnCount: sheetMeta.columnCount + 1,
      columns: newColumns,
    });

    const operation: PatchOperation = {
      type: "INSERT_COLUMN",
      atIndex,
      count: 1,
    };
    const inverse: PatchOperation = {
      type: "DELETE_COLUMN",
      columnIds: [newColumnId],
      deletedData: {},
    };

    const patchId = await addPatch(sheetId, operation, inverse);
    set((state) => ({
      undoStack: [...state.undoStack, patchId],
      redoStack: [],
    }));
  },

  deleteColumn: async (columnId: string) => {
    const { sheetId, sheetMeta } = get();
    if (!sheetId || !sheetMeta) return;

    const columnToDelete = sheetMeta.columns.find((c) => c.id === columnId);
    if (!columnToDelete) return;

    const newColumns = sheetMeta.columns
      .filter((c) => c.id !== columnId)
      .map((c) =>
        c.order > columnToDelete.order ? { ...c, order: c.order - 1 } : c,
      );

    set((state) => ({
      sheetMeta: state.sheetMeta
        ? {
            ...state.sheetMeta,
            columnCount: state.sheetMeta.columnCount - 1,
            columns: newColumns,
          }
        : null,
    }));

    await updateSheet(sheetId, {
      columnCount: sheetMeta.columnCount - 1,
      columns: newColumns,
    });

    const operation: PatchOperation = {
      type: "DELETE_COLUMN",
      columnIds: [columnId],
      deletedData: {},
    };
    const inverse: PatchOperation = {
      type: "INSERT_COLUMN",
      atIndex: columnToDelete.order,
      count: 1,
    };

    const patchId = await addPatch(sheetId, operation, inverse);
    set((state) => ({
      undoStack: [...state.undoStack, patchId],
      redoStack: [],
    }));
  },

  reorderColumns: async (newOrder: string[]) => {
    const { sheetId, sheetMeta } = get();
    if (!sheetId || !sheetMeta) return;

    const prevOrder = sheetMeta.columns.map((c) => c.id);

    const newColumns = sheetMeta.columns.map((col) => ({
      ...col,
      order: newOrder.indexOf(col.id),
    }));

    set((state) => ({
      sheetMeta: state.sheetMeta
        ? { ...state.sheetMeta, columns: newColumns }
        : null,
    }));

    await updateSheet(sheetId, { columns: newColumns });

    const operation: PatchOperation = {
      type: "REORDER_COLUMNS",
      order: newOrder,
    };
    const inverse: PatchOperation = {
      type: "REORDER_COLUMNS",
      order: prevOrder,
    };

    const patchId = await addPatch(sheetId, operation, inverse);
    set((state) => ({
      undoStack: [...state.undoStack, patchId],
      redoStack: [],
    }));
  },

  insertRow: async (atIndex: number) => {
    const { sheetId, sheetMeta } = get();
    if (!sheetId || !sheetMeta) return;

    set((state) => ({
      sheetMeta: state.sheetMeta
        ? { ...state.sheetMeta, rowCount: state.sheetMeta.rowCount + 1 }
        : null,
    }));

    await updateSheet(sheetId, { rowCount: sheetMeta.rowCount + 1 });

    const operation: PatchOperation = {
      type: "INSERT_ROW",
      atIndex,
      count: 1,
    };
    const inverse: PatchOperation = {
      type: "DELETE_ROW",
      atIndex,
      count: 1,
      deletedRows: [undefined],
    };

    const patchId = await addPatch(sheetId, operation, inverse);
    set((state) => ({
      undoStack: [...state.undoStack, patchId],
      redoStack: [],
    }));
  },

  deleteRow: async (atIndex: number) => {
    const { sheetId, sheetMeta, viewportData } = get();
    if (!sheetId || !sheetMeta) return;

    const deletedRowData = viewportData.get(atIndex);

    set((state) => ({
      sheetMeta: state.sheetMeta
        ? { ...state.sheetMeta, rowCount: state.sheetMeta.rowCount - 1 }
        : null,
    }));

    await updateSheet(sheetId, { rowCount: sheetMeta.rowCount - 1 });

    const operation: PatchOperation = {
      type: "DELETE_ROW",
      atIndex,
      count: 1,
      deletedRows: [deletedRowData],
    };
    const inverse: PatchOperation = {
      type: "INSERT_ROW",
      atIndex,
      count: 1,
    };

    const patchId = await addPatch(sheetId, operation, inverse);
    set((state) => ({
      undoStack: [...state.undoStack, patchId],
      redoStack: [],
    }));
  },

  setImportState: (state: Partial<ImportState>) => {
    set((s) => ({
      importState: { ...s.importState, ...state },
    }));
  },

  onImportComplete: async (sheetMeta: SheetMeta) => {
    set({
      sheetId: sheetMeta.id,
      sheetMeta,
      viewportData: new Map(),
      loadedChunks: new Set(),
      importState: {
        isImporting: false,
        progress: 100,
        error: null,
      },
    });

    await get().loadViewport(0, 100);
  },

  recomputeFormulas: () => {
    const { viewportData, sheetMeta } = get();
    if (!sheetMeta) return;

    let hasFormulas = false;
    for (const [_, rowData] of viewportData) {
      for (const [_, cellValue] of Object.entries(rowData)) {
        if (cellValue.f) {
          hasFormulas = true;
          break;
        }
      }
      if (hasFormulas) break;
    }

    if (!hasFormulas) return;

    const getCellValue = (row: number, col: string) => {
      const rowData = viewportData.get(row);
      return rowData?.[col];
    };

    const { evaluateViewportFormulas } = require("@/lib/formulas");
    const updatedData = evaluateViewportFormulas(viewportData, getCellValue);

    set({ viewportData: updatedData });
  },

  getViewportSize: () => get().viewportData.size,
}));

async function applyPatchToStore(
  get: () => SheetStore,
  set: (fn: (state: SheetState) => Partial<SheetState>) => void,
  operation: PatchOperation,
): Promise<void> {
  const { sheetId } = get();
  if (!sheetId) return;

  switch (operation.type) {
    case "SET_CELL":
      await updateCellInChunk(
        sheetId,
        operation.row,
        operation.col,
        operation.value,
      );
      set((state) => {
        const newViewportData = new Map(state.viewportData);
        const existingRow = newViewportData.get(operation.row) ?? {};
        newViewportData.set(operation.row, {
          ...existingRow,
          [operation.col]: operation.value,
        });
        return { viewportData: newViewportData };
      });
      break;

    case "SET_CELLS":
      for (const cell of operation.cells) {
        await updateCellInChunk(sheetId, cell.row, cell.col, cell.value);
      }
      set((state) => {
        const newViewportData = new Map(state.viewportData);
        for (const cell of operation.cells) {
          const existingRow = newViewportData.get(cell.row) ?? {};
          newViewportData.set(cell.row, {
            ...existingRow,
            [cell.col]: cell.value,
          });
        }
        return { viewportData: newViewportData };
      });
      break;

    case "RESIZE_COLUMN":
      set((state) => ({
        sheetMeta: state.sheetMeta
          ? {
              ...state.sheetMeta,
              columns: state.sheetMeta.columns.map((c) =>
                c.id === operation.columnId
                  ? { ...c, width: operation.width }
                  : c,
              ),
            }
          : null,
      }));
      await updateSheet(sheetId, { columns: get().sheetMeta?.columns });
      break;

    default:
      console.warn(
        `Unhandled patch operation type: ${(operation as PatchOperation).type}`,
      );
  }
}

function parseValue(value: string): string | number | boolean | null {
  if (value === "") return null;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;

  const num = Number(value);
  if (!Number.isNaN(num) && value.trim() !== "") return num;

  return value;
}

function inferType(value: string): "n" | "s" | "b" | "d" | "e" {
  if (value === "") return "s";
  if (value.toLowerCase() === "true" || value.toLowerCase() === "false")
    return "b";

  const num = Number(value);
  if (!Number.isNaN(num) && value.trim() !== "") return "n";

  return "s";
}
