import type { CellValue, RowData, SheetMeta } from "@/types";

export interface CellPosition {
  row: number;
  col: string;
}

export interface ImportState {
  isImporting: boolean;
  progress: number;
  error: string | null;
}

export interface SheetState {
  sheetId: string | null;
  sheetMeta: SheetMeta | null;
  viewportData: Map<number, RowData>;
  loadedChunks: Set<number>;
  viewportStart: number;
  viewportEnd: number;
  activeCell: CellPosition | null;
  editingCell: CellPosition | null;
  editValue: string;
  undoStack: number[];
  redoStack: number[];
  importState: ImportState;
}

export interface SheetActions {
  loadSheet: (sheetId: string) => Promise<void>;
  unloadSheet: () => void;
  loadViewport: (startRow: number, endRow: number) => Promise<void>;
  evictOutOfRangeChunks: (startRow: number, endRow: number) => void;
  setActiveCell: (position: CellPosition | null) => void;
  startEditing: () => void;
  cancelEditing: () => void;
  setEditValue: (value: string) => void;
  commitEdit: () => Promise<void>;
  updateCell: (row: number, col: string, value: CellValue) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: () => boolean;
  canRedo: () => boolean;
  resizeColumn: (columnId: string, width: number) => Promise<void>;
  insertColumn: (atIndex: number) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
  reorderColumns: (newOrder: string[]) => Promise<void>;
  insertRow: (atIndex: number) => Promise<void>;
  deleteRow: (atIndex: number) => Promise<void>;
  setImportState: (state: Partial<ImportState>) => void;
  onImportComplete: (sheetMeta: SheetMeta) => Promise<void>;
  recomputeFormulas: () => void;
  getViewportSize: () => number;
}

export type SheetStore = SheetState & SheetActions;
