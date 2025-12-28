import Dexie, { type EntityTable } from "dexie";
import type { Column, RowData } from "@/types";

export interface SheetRecord {
  id: string;
  name: string;
  columnCount: number;
  rowCount: number;
  columns: Column[];
  fileSize?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChunkRecord {
  id: string;
  sheetId: string;
  chunkIndex: number;
  rows: Array<RowData | undefined>;
  version: number;
}

export interface PatchRecord {
  id?: number;
  sheetId: string;
  operation: PatchOperation;
  inverse: PatchOperation;
  timestamp: Date;
}

export type PatchOperation =
  | SetCellOperation
  | SetCellsOperation
  | InsertRowOperation
  | DeleteRowOperation
  | InsertColumnOperation
  | DeleteColumnOperation
  | ResizeColumnOperation
  | ReorderColumnsOperation;

export interface SetCellOperation {
  type: "SET_CELL";
  row: number;
  col: string;
  value: import("@/types").CellValue;
}

export interface SetCellsOperation {
  type: "SET_CELLS";
  cells: Array<{
    row: number;
    col: string;
    value: import("@/types").CellValue;
  }>;
}

export interface InsertRowOperation {
  type: "INSERT_ROW";
  atIndex: number;
  count: number;
}

export interface DeleteRowOperation {
  type: "DELETE_ROW";
  atIndex: number;
  count: number;
  deletedRows: Array<RowData | undefined>;
}

export interface InsertColumnOperation {
  type: "INSERT_COLUMN";
  atIndex: number;
  count: number;
}

export interface DeleteColumnOperation {
  type: "DELETE_COLUMN";
  columnIds: string[];
  deletedData: Record<number, Record<string, import("@/types").CellValue>>;
}

export interface ResizeColumnOperation {
  type: "RESIZE_COLUMN";
  columnId: string;
  width: number;
}

export interface ReorderColumnsOperation {
  type: "REORDER_COLUMNS";
  order: string[];
}

export class SheetDatabase extends Dexie {
  sheets!: EntityTable<SheetRecord, "id">;
  chunks!: EntityTable<ChunkRecord, "id">;
  patches!: EntityTable<PatchRecord, "id">;

  constructor() {
    super("ShadcnSheets");

    this.version(1).stores({
      sheets: "id",
      chunks: "id, sheetId, [sheetId+chunkIndex]",
      patches: "++id, sheetId",
    });
  }
}

export const db = new SheetDatabase();
