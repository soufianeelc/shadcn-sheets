/**
 * Import Worker - Parses CSV/XLSX files and writes directly to IndexedDB
 *
 * Only sends progress updates and final metadata to main thread,
 * never the actual row data (to avoid janking the UI).
 */

import Dexie from "dexie";
import Papa from "papaparse";
import * as XLSX from "xlsx";

// Re-create minimal Dexie schema in worker (can't import from main thread)
const CHUNK_SIZE = 1000;

interface CellValue {
  v: string | number | boolean | null;
  f?: string;
  t?: "n" | "s" | "b" | "d" | "e";
}

type RowData = Record<string, CellValue>;

interface Column {
  id: string;
  width: number;
  order: number;
}

interface SheetRecord {
  id: string;
  name: string;
  columnCount: number;
  rowCount: number;
  columns: Column[];
  fileSize?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ChunkRecord {
  id: string;
  sheetId: string;
  chunkIndex: number;
  rows: Array<RowData | undefined>;
  version: number;
}

// Create Dexie instance in worker
class WorkerDB extends Dexie {
  sheets!: Dexie.Table<SheetRecord, string>;
  chunks!: Dexie.Table<ChunkRecord, string>;

  constructor() {
    super("ShadcnSheets");
    this.version(1).stores({
      sheets: "id",
      chunks: "id, sheetId, [sheetId+chunkIndex]",
      patches: "++id, sheetId",
    });
  }
}

const db = new WorkerDB();

// Message types
interface ImportMessage {
  type: "import";
  file: File;
  sheetId: string;
  fileName: string;
}

type WorkerMessage = ImportMessage;

interface ProgressMessage {
  type: "progress";
  percent: number;
}

interface DoneMessage {
  type: "done";
  sheetMeta: SheetRecord;
}

interface ErrorMessage {
  type: "error";
  message: string;
}

// Helper to convert column index to ID (A, B, ..., Z, AA, AB, etc.)
function columnIndexToId(index: number): string {
  let id = "";
  let n = index;
  while (n >= 0) {
    id = String.fromCharCode((n % 26) + 65) + id;
    n = Math.floor(n / 26) - 1;
  }
  return id;
}

// Helper to parse cell value
function parseCellValue(value: unknown): CellValue {
  if (value === null || value === undefined || value === "") {
    return { v: null, t: "s" };
  }

  if (typeof value === "boolean") {
    return { v: value, t: "b" };
  }

  if (typeof value === "number") {
    return { v: value, t: "n" };
  }

  const str = String(value);

  // Check if it's a number
  const num = Number(str);
  if (!Number.isNaN(num) && str.trim() !== "") {
    return { v: num, t: "n" };
  }

  // Check for boolean strings
  if (str.toLowerCase() === "true") {
    return { v: true, t: "b" };
  }
  if (str.toLowerCase() === "false") {
    return { v: false, t: "b" };
  }

  // String
  return { v: str, t: "s" };
}

// Generate chunk ID
function getChunkId(sheetId: string, chunkIndex: number): string {
  return `${sheetId}:${chunkIndex}`;
}

// Process CSV file
async function processCSV(
  file: File,
  sheetId: string,
  fileName: string,
): Promise<SheetRecord> {
  return new Promise((resolve, reject) => {
    let rowCount = 0;
    let columnCount = 0;
    let columns: Column[] = [];
    let currentChunk: Array<RowData | undefined> = new Array(CHUNK_SIZE).fill(
      undefined,
    );
    let currentChunkIndex = 0;
    let isFirstRow = true;
    const totalBytes = file.size;
    let processedBytes = 0;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      chunk: async (results, parser) => {
        // Pause parser while we process
        parser.pause();

        try {
          const rows = results.data as Record<string, unknown>[];

          // On first chunk, set up columns from headers
          if (isFirstRow && rows.length > 0) {
            const headers = Object.keys(rows[0]);
            columnCount = headers.length;
            columns = headers.map((_header, index) => ({
              id: columnIndexToId(index),
              width: 100,
              order: index,
            }));
            isFirstRow = false;
          }

          // Process each row
          for (const row of rows) {
            const rowOffset = rowCount % CHUNK_SIZE;
            const chunkIndex = Math.floor(rowCount / CHUNK_SIZE);

            // If we've moved to a new chunk, write the previous one
            if (chunkIndex > currentChunkIndex) {
              await writeChunk(sheetId, currentChunkIndex, currentChunk);
              currentChunk = new Array(CHUNK_SIZE).fill(undefined);
              currentChunkIndex = chunkIndex;
            }

            // Convert row to RowData format
            const rowData: RowData = {};
            const headers = Object.keys(row);
            for (let i = 0; i < headers.length; i++) {
              const colId = columnIndexToId(i);
              const value = row[headers[i]];
              if (value !== null && value !== undefined && value !== "") {
                rowData[colId] = parseCellValue(value);
              }
            }

            currentChunk[rowOffset] =
              Object.keys(rowData).length > 0 ? rowData : undefined;
            rowCount++;
          }

          // Update progress
          processedBytes += results.meta.cursor || 0;
          const percent = Math.min(95, (processedBytes / totalBytes) * 100);
          self.postMessage({ type: "progress", percent } as ProgressMessage);

          // Resume parser
          parser.resume();
        } catch (error) {
          parser.abort();
          reject(error);
        }
      },
      complete: async () => {
        try {
          // Write final chunk
          if (rowCount > 0) {
            await writeChunk(sheetId, currentChunkIndex, currentChunk);
          }

          // Create sheet record
          const now = new Date();
          const sheetRecord: SheetRecord = {
            id: sheetId,
            name: fileName.replace(/\.(csv|xlsx|xls)$/i, ""),
            columnCount,
            rowCount,
            columns,
            fileSize: file.size,
            createdAt: now,
            updatedAt: now,
          };

          await db.sheets.put(sheetRecord);

          self.postMessage({
            type: "progress",
            percent: 100,
          } as ProgressMessage);
          resolve(sheetRecord);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

// Process XLSX file
async function processXLSX(
  file: File,
  sheetId: string,
  fileName: string,
): Promise<SheetRecord> {
  const arrayBuffer = await file.arrayBuffer();

  self.postMessage({ type: "progress", percent: 10 } as ProgressMessage);

  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  self.postMessage({ type: "progress", percent: 30 } as ProgressMessage);

  // Get range
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
  const rowCount = range.e.r - range.s.r + 1;
  const columnCount = range.e.c - range.s.c + 1;

  // Generate columns
  const columns: Column[] = Array.from({ length: columnCount }, (_, i) => ({
    id: columnIndexToId(i),
    width: 100,
    order: i,
  }));

  // Process rows in chunks
  let currentChunk: Array<RowData | undefined> = new Array(CHUNK_SIZE).fill(
    undefined,
  );
  let currentChunkIndex = 0;

  for (let r = range.s.r; r <= range.e.r; r++) {
    const rowIndex = r - range.s.r;
    const rowOffset = rowIndex % CHUNK_SIZE;
    const chunkIndex = Math.floor(rowIndex / CHUNK_SIZE);

    // If we've moved to a new chunk, write the previous one
    if (chunkIndex > currentChunkIndex) {
      await writeChunk(sheetId, currentChunkIndex, currentChunk);
      currentChunk = new Array(CHUNK_SIZE).fill(undefined);
      currentChunkIndex = chunkIndex;

      // Update progress
      const percent = 30 + (rowIndex / rowCount) * 65;
      self.postMessage({ type: "progress", percent } as ProgressMessage);
    }

    // Process row
    const rowData: RowData = {};
    for (let c = range.s.c; c <= range.e.c; c++) {
      const colId = columnIndexToId(c - range.s.c);
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[cellAddress];

      if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
        const cellValue: CellValue = {
          v: cell.v,
          t: cell.t === "n" ? "n" : cell.t === "b" ? "b" : "s",
        };

        // Preserve formula if present
        if (cell.f) {
          cellValue.f = `=${cell.f}`;
        }

        rowData[colId] = cellValue;
      }
    }

    currentChunk[rowOffset] =
      Object.keys(rowData).length > 0 ? rowData : undefined;
  }

  // Write final chunk
  await writeChunk(sheetId, currentChunkIndex, currentChunk);

  // Create sheet record
  const now = new Date();
  const sheetRecord: SheetRecord = {
    id: sheetId,
    name: fileName.replace(/\.(csv|xlsx|xls)$/i, "") || firstSheetName,
    columnCount,
    rowCount,
    columns,
    fileSize: file.size,
    createdAt: now,
    updatedAt: now,
  };

  await db.sheets.put(sheetRecord);

  self.postMessage({ type: "progress", percent: 100 } as ProgressMessage);

  return sheetRecord;
}

// Write chunk to IndexedDB
async function writeChunk(
  sheetId: string,
  chunkIndex: number,
  rows: Array<RowData | undefined>,
): Promise<void> {
  const chunkRecord: ChunkRecord = {
    id: getChunkId(sheetId, chunkIndex),
    sheetId,
    chunkIndex,
    rows,
    version: 0,
  };

  await db.chunks.put(chunkRecord);
}

// Worker message handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  if (message.type === "import") {
    try {
      self.postMessage({ type: "progress", percent: 0 } as ProgressMessage);

      const { file, sheetId, fileName } = message;
      const extension = fileName.split(".").pop()?.toLowerCase();

      let sheetRecord: SheetRecord;

      if (extension === "csv") {
        sheetRecord = await processCSV(file, sheetId, fileName);
      } else if (extension === "xlsx" || extension === "xls") {
        sheetRecord = await processXLSX(file, sheetId, fileName);
      } else {
        throw new Error(`Unsupported file type: ${extension}`);
      }

      self.postMessage({
        type: "done",
        sheetMeta: sheetRecord,
      } as DoneMessage);
    } catch (error) {
      self.postMessage({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ErrorMessage);
    }
  }
};
