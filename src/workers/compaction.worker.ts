/**
 * Compaction Worker
 *
 * Periodically merges old patches into chunk snapshots.
 * Runs when patch count exceeds threshold (~1000 patches).
 * Reads patches + chunks from Dexie, writes updated chunks, deletes merged patches.
 * Main thread only receives completion notification.
 */

import Dexie from "dexie";

// Re-create minimal Dexie schema in worker
const CHUNK_SIZE = 1000;
const COMPACTION_THRESHOLD = 1000;

interface CellValue {
  v: string | number | boolean | null;
  f?: string;
  t?: "n" | "s" | "b" | "d" | "e";
}

type RowData = Record<string, CellValue>;

interface ChunkRecord {
  id: string;
  sheetId: string;
  chunkIndex: number;
  rows: Array<RowData | undefined>;
  version: number;
}

interface PatchRecord {
  id?: number;
  sheetId: string;
  operation: PatchOperation;
  inverse: PatchOperation;
  timestamp: Date;
}

type PatchOperation =
  | SetCellOperation
  | SetCellsOperation
  | InsertRowOperation
  | DeleteRowOperation
  | InsertColumnOperation
  | DeleteColumnOperation
  | ResizeColumnOperation
  | ReorderColumnsOperation;

interface SetCellOperation {
  type: "SET_CELL";
  row: number;
  col: string;
  value: CellValue;
}

interface SetCellsOperation {
  type: "SET_CELLS";
  cells: Array<{ row: number; col: string; value: CellValue }>;
}

interface InsertRowOperation {
  type: "INSERT_ROW";
  atIndex: number;
  count: number;
}

interface DeleteRowOperation {
  type: "DELETE_ROW";
  atIndex: number;
  count: number;
  deletedRows: Array<RowData | undefined>;
}

interface InsertColumnOperation {
  type: "INSERT_COLUMN";
  atIndex: number;
  count: number;
}

interface DeleteColumnOperation {
  type: "DELETE_COLUMN";
  columnIds: string[];
  deletedData: Record<number, Record<string, CellValue>>;
}

interface ResizeColumnOperation {
  type: "RESIZE_COLUMN";
  columnId: string;
  width: number;
}

interface ReorderColumnsOperation {
  type: "REORDER_COLUMNS";
  order: string[];
}

// Create Dexie instance in worker
class WorkerDB extends Dexie {
  chunks!: Dexie.Table<ChunkRecord, string>;
  patches!: Dexie.Table<PatchRecord, number>;

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
interface CompactMessage {
  type: "compact";
  sheetId: string;
}

interface CheckMessage {
  type: "check";
  sheetId: string;
}

type WorkerMessage = CompactMessage | CheckMessage;

interface StartedMessage {
  type: "started";
  patchCount: number;
}

interface ProgressMessage {
  type: "progress";
  percent: number;
}

interface DoneMessage {
  type: "done";
  patchesRemoved: number;
  chunksUpdated: number;
}

interface ErrorMessage {
  type: "error";
  message: string;
}

interface CheckResultMessage {
  type: "checkResult";
  needsCompaction: boolean;
  patchCount: number;
}

// Helper functions
function getChunkId(sheetId: string, chunkIndex: number): string {
  return `${sheetId}:${chunkIndex}`;
}

function getChunkIndex(rowIndex: number): number {
  return Math.floor(rowIndex / CHUNK_SIZE);
}

function getRowOffsetInChunk(rowIndex: number): number {
  return rowIndex % CHUNK_SIZE;
}

/**
 * Check if compaction is needed
 */
async function checkCompactionNeeded(
  sheetId: string,
): Promise<{ needed: boolean; count: number }> {
  const patchCount = await db.patches.where("sheetId").equals(sheetId).count();
  return {
    needed: patchCount >= COMPACTION_THRESHOLD,
    count: patchCount,
  };
}

/**
 * Apply a patch operation to chunks
 */
async function applyPatchToChunks(
  sheetId: string,
  operation: PatchOperation,
  chunksCache: Map<string, ChunkRecord>,
): Promise<void> {
  switch (operation.type) {
    case "SET_CELL": {
      const chunkIndex = getChunkIndex(operation.row);
      const chunkId = getChunkId(sheetId, chunkIndex);
      const rowOffset = getRowOffsetInChunk(operation.row);

      let chunk = chunksCache.get(chunkId);
      if (!chunk) {
        chunk = await db.chunks.get(chunkId);
        if (!chunk) {
          chunk = {
            id: chunkId,
            sheetId,
            chunkIndex,
            rows: new Array(CHUNK_SIZE).fill(undefined),
            version: 0,
          };
        }
        chunksCache.set(chunkId, chunk);
      }

      if (!chunk.rows[rowOffset]) {
        chunk.rows[rowOffset] = {};
      }
      const row = chunk.rows[rowOffset];
      if (row) {
        row[operation.col] = operation.value;
      }
      break;
    }

    case "SET_CELLS": {
      for (const cell of operation.cells) {
        const chunkIndex = getChunkIndex(cell.row);
        const chunkId = getChunkId(sheetId, chunkIndex);
        const rowOffset = getRowOffsetInChunk(cell.row);

        let chunk = chunksCache.get(chunkId);
        if (!chunk) {
          chunk = await db.chunks.get(chunkId);
          if (!chunk) {
            chunk = {
              id: chunkId,
              sheetId,
              chunkIndex,
              rows: new Array(CHUNK_SIZE).fill(undefined),
              version: 0,
            };
          }
          chunksCache.set(chunkId, chunk);
        }

        if (!chunk.rows[rowOffset]) {
          chunk.rows[rowOffset] = {};
        }
        const cellRow = chunk.rows[rowOffset];
        if (cellRow) {
          cellRow[cell.col] = cell.value;
        }
      }
      break;
    }

    // Note: Row/column structural operations are more complex
    // For now, we only compact cell value changes
    // Structural operations should remain in the patch log
    case "INSERT_ROW":
    case "DELETE_ROW":
    case "INSERT_COLUMN":
    case "DELETE_COLUMN":
      // Skip structural operations - keep them in patch log
      break;

    case "RESIZE_COLUMN":
    case "REORDER_COLUMNS":
      // These affect sheet metadata, not chunk data
      break;
  }
}

/**
 * Run compaction for a sheet
 */
async function runCompaction(
  sheetId: string,
): Promise<{ patchesRemoved: number; chunksUpdated: number }> {
  // Get all patches for this sheet, sorted by ID (oldest first)
  const patches = await db.patches
    .where("sheetId")
    .equals(sheetId)
    .sortBy("id");

  if (patches.length === 0) {
    return { patchesRemoved: 0, chunksUpdated: 0 };
  }

  self.postMessage({
    type: "started",
    patchCount: patches.length,
  } as StartedMessage);

  // Cache for modified chunks
  const chunksCache = new Map<string, ChunkRecord>();
  const patchIdsToDelete: number[] = [];
  let processed = 0;

  // Apply each patch to the chunks
  for (const patch of patches) {
    // Only compact SET_CELL and SET_CELLS operations
    if (
      patch.operation.type === "SET_CELL" ||
      patch.operation.type === "SET_CELLS"
    ) {
      await applyPatchToChunks(sheetId, patch.operation, chunksCache);
      if (patch.id !== undefined) {
        patchIdsToDelete.push(patch.id);
      }
    }

    processed++;
    if (processed % 100 === 0) {
      const percent = (processed / patches.length) * 80; // 80% for applying patches
      self.postMessage({ type: "progress", percent } as ProgressMessage);
    }
  }

  self.postMessage({ type: "progress", percent: 80 } as ProgressMessage);

  // Write updated chunks to database
  const chunksToWrite = Array.from(chunksCache.values()).map((chunk) => ({
    ...chunk,
    version: chunk.version + 1,
  }));

  if (chunksToWrite.length > 0) {
    await db.chunks.bulkPut(chunksToWrite);
  }

  self.postMessage({ type: "progress", percent: 90 } as ProgressMessage);

  // Delete compacted patches
  if (patchIdsToDelete.length > 0) {
    await db.patches.bulkDelete(patchIdsToDelete);
  }

  self.postMessage({ type: "progress", percent: 100 } as ProgressMessage);

  return {
    patchesRemoved: patchIdsToDelete.length,
    chunksUpdated: chunksToWrite.length,
  };
}

// Worker message handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  try {
    if (message.type === "check") {
      const { needed, count } = await checkCompactionNeeded(message.sheetId);
      self.postMessage({
        type: "checkResult",
        needsCompaction: needed,
        patchCount: count,
      } as CheckResultMessage);
    } else if (message.type === "compact") {
      const result = await runCompaction(message.sheetId);
      self.postMessage({
        type: "done",
        patchesRemoved: result.patchesRemoved,
        chunksUpdated: result.chunksUpdated,
      } as DoneMessage);
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    } as ErrorMessage);
  }
};
