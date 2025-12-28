import { v4 as uuidv4 } from "uuid";
import {
  type CellValue,
  CHUNK_SIZE,
  type Column,
  generateDefaultColumns,
  getChunkId,
  getChunkIndex,
  getRowOffsetInChunk,
  type RowData,
  type SheetMeta,
} from "@/types";
import { db } from "./db";
import type {
  ChunkRecord,
  PatchOperation,
  PatchRecord,
  SheetRecord,
} from "./schema";

export async function createSheet(
  name: string,
  rowCount: number,
  columnCount: number,
  columns?: Column[],
  fileSize?: number,
): Promise<SheetRecord> {
  const id = uuidv4();
  const now = new Date();

  const sheet: SheetRecord = {
    id,
    name,
    rowCount,
    columnCount,
    columns: columns ?? generateDefaultColumns(columnCount),
    fileSize,
    createdAt: now,
    updatedAt: now,
  };

  await db.sheets.add(sheet);
  return sheet;
}

export async function getSheet(
  sheetId: string,
): Promise<SheetRecord | undefined> {
  return db.sheets.get(sheetId);
}

export async function updateSheet(
  sheetId: string,
  updates: Partial<Omit<SheetRecord, "id" | "createdAt">>,
): Promise<void> {
  await db.sheets.update(sheetId, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteSheet(sheetId: string): Promise<void> {
  await db.transaction("rw", [db.sheets, db.chunks, db.patches], async () => {
    await db.sheets.delete(sheetId);
    await db.chunks.where("sheetId").equals(sheetId).delete();
    await db.patches.where("sheetId").equals(sheetId).delete();
  });
}

export async function getAllSheets(): Promise<SheetRecord[]> {
  return db.sheets.toArray();
}

export async function getChunk(
  chunkId: string,
): Promise<ChunkRecord | undefined> {
  return db.chunks.get(chunkId);
}

export async function getChunksInRange(
  sheetId: string,
  startChunkIndex: number,
  endChunkIndex: number,
): Promise<ChunkRecord[]> {
  const chunks = await db.chunks
    .where("[sheetId+chunkIndex]")
    .between([sheetId, startChunkIndex], [sheetId, endChunkIndex], true, true)
    .toArray();

  return chunks;
}

export async function getOrCreateChunk(
  sheetId: string,
  chunkIndex: number,
): Promise<ChunkRecord> {
  const chunkId = getChunkId(sheetId, chunkIndex);
  let chunk = await db.chunks.get(chunkId);

  if (!chunk) {
    chunk = {
      id: chunkId,
      sheetId,
      chunkIndex,
      rows: new Array(CHUNK_SIZE).fill(undefined),
      version: 0,
    };
  }

  return chunk;
}

export async function writeChunk(chunk: ChunkRecord): Promise<void> {
  await db.chunks.put({
    ...chunk,
    version: chunk.version + 1,
  });
}

export async function writeChunks(chunks: ChunkRecord[]): Promise<void> {
  await db.chunks.bulkPut(
    chunks.map((c) => ({ ...c, version: c.version + 1 })),
  );
}

export async function updateCellInChunk(
  sheetId: string,
  rowIndex: number,
  colId: string,
  value: CellValue,
): Promise<void> {
  const chunkIndex = getChunkIndex(rowIndex);
  const rowOffset = getRowOffsetInChunk(rowIndex);
  const chunk = await getOrCreateChunk(sheetId, chunkIndex);

  if (!chunk.rows[rowOffset]) {
    chunk.rows[rowOffset] = {};
  }

  const row = chunk.rows[rowOffset];
  if (row) {
    row[colId] = value;
  }

  await writeChunk(chunk);
}

export async function getRowsInRange(
  sheetId: string,
  startRow: number,
  endRow: number,
): Promise<Map<number, RowData>> {
  const startChunk = getChunkIndex(startRow);
  const endChunk = getChunkIndex(endRow);

  const chunks = await getChunksInRange(sheetId, startChunk, endChunk);
  const rowMap = new Map<number, RowData>();

  for (const chunk of chunks) {
    const chunkStartRow = chunk.chunkIndex * CHUNK_SIZE;

    for (let offset = 0; offset < CHUNK_SIZE; offset++) {
      const absoluteRow = chunkStartRow + offset;

      if (absoluteRow < startRow || absoluteRow > endRow) continue;

      const rowData = chunk.rows[offset];
      if (rowData) {
        rowMap.set(absoluteRow, rowData);
      }
    }
  }

  return rowMap;
}

export async function addPatch(
  sheetId: string,
  operation: PatchOperation,
  inverse: PatchOperation,
): Promise<number> {
  const patch: PatchRecord = {
    sheetId,
    operation,
    inverse,
    timestamp: new Date(),
  };

  const id = await db.patches.add(patch);
  return id as number;
}

export async function getPatch(
  patchId: number,
): Promise<PatchRecord | undefined> {
  return db.patches.get(patchId);
}

export async function deletePatch(patchId: number): Promise<void> {
  await db.patches.delete(patchId);
}

export async function getPatchCount(sheetId: string): Promise<number> {
  return db.patches.where("sheetId").equals(sheetId).count();
}

export async function getAllPatches(sheetId: string): Promise<PatchRecord[]> {
  return db.patches.where("sheetId").equals(sheetId).toArray();
}

export async function deletePatches(patchIds: number[]): Promise<void> {
  await db.patches.bulkDelete(patchIds);
}

export function toSheetMeta(record: SheetRecord): SheetMeta {
  return {
    id: record.id,
    name: record.name,
    columnCount: record.columnCount,
    rowCount: record.rowCount,
    columns: record.columns,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
