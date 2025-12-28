/**
 * Core types for the spreadsheet application
 */

/** Cell value type - supports formulas and type hints */
export type CellValue = {
  /** Computed/display value */
  v: string | number | boolean | null;
  /** Formula string (e.g., "=SUM(A1:A10)") */
  f?: string;
  /** Type hint: number, string, boolean, date, error */
  t?: "n" | "s" | "b" | "d" | "e";
};

/** Row data - sparse mapping of column ID to cell value */
export type RowData = Record<string, CellValue>;

/** Column definition */
export interface Column {
  /** Column identifier (A, B, C, ..., AA, AB, etc.) */
  id: string;
  /** Column width in pixels */
  width: number;
  /** Display order (0-indexed) */
  order: number;
}

/** Sheet metadata */
export interface SheetMeta {
  id: string;
  name: string;
  columnCount: number;
  rowCount: number;
  columns: Column[];
  createdAt: Date;
  updatedAt: Date;
}

/** Chunk of row data stored in IndexedDB */
export interface Chunk {
  /** Composite key: sheetId + chunkIndex */
  id: string;
  sheetId: string;
  chunkIndex: number;
  /** Array of rows, index = row offset within chunk (0 to CHUNK_SIZE-1) */
  rows: Array<RowData | undefined>;
  /** Version for optimistic concurrency */
  version: number;
}

/** Constants */
export const CHUNK_SIZE = 1000;
export const DEFAULT_COLUMN_WIDTH = 100;
export const DEFAULT_ROW_HEIGHT = 32;
export const VIEWPORT_BUFFER = 50;

/** Helper to generate column ID from index (0=A, 1=B, ..., 26=AA, etc.) */
export function columnIndexToId(index: number): string {
  let id = "";
  let n = index;
  while (n >= 0) {
    id = String.fromCharCode((n % 26) + 65) + id;
    n = Math.floor(n / 26) - 1;
  }
  return id;
}

/** Helper to convert column ID to index (A=0, B=1, ..., AA=26, etc.) */
export function columnIdToIndex(id: string): number {
  let index = 0;
  for (let i = 0; i < id.length; i++) {
    index = index * 26 + (id.charCodeAt(i) - 64);
  }
  return index - 1;
}

/** Generate chunk ID from sheet ID and chunk index */
export function getChunkId(sheetId: string, chunkIndex: number): string {
  return `${sheetId}:${chunkIndex}`;
}

/** Calculate chunk index from row index */
export function getChunkIndex(rowIndex: number): number {
  return Math.floor(rowIndex / CHUNK_SIZE);
}

/** Calculate row offset within chunk */
export function getRowOffsetInChunk(rowIndex: number): number {
  return rowIndex % CHUNK_SIZE;
}

/** Calculate which chunks are needed for a row range */
export function getChunkRange(
  startRow: number,
  endRow: number,
): { start: number; end: number } {
  return {
    start: getChunkIndex(startRow),
    end: getChunkIndex(endRow),
  };
}

/** Generate default columns for a sheet */
export function generateDefaultColumns(count: number): Column[] {
  return Array.from({ length: count }, (_, i) => ({
    id: columnIndexToId(i),
    width: DEFAULT_COLUMN_WIDTH,
    order: i,
  }));
}
