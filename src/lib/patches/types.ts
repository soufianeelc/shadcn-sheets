import { z } from "zod";

export const CellValueSchema = z.object({
  v: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  f: z.string().optional(),
  t: z.enum(["n", "s", "b", "d", "e"]).optional(),
});

export type CellValueType = z.infer<typeof CellValueSchema>;

export const SetCellOperationSchema = z.object({
  type: z.literal("SET_CELL"),
  row: z.number().int().nonnegative(),
  col: z.string().min(1),
  value: CellValueSchema,
});

export type SetCellOperation = z.infer<typeof SetCellOperationSchema>;

export const SetCellsOperationSchema = z.object({
  type: z.literal("SET_CELLS"),
  cells: z.array(
    z.object({
      row: z.number().int().nonnegative(),
      col: z.string().min(1),
      value: CellValueSchema,
    }),
  ),
});

export type SetCellsOperation = z.infer<typeof SetCellsOperationSchema>;

export const InsertRowOperationSchema = z.object({
  type: z.literal("INSERT_ROW"),
  atIndex: z.number().int().nonnegative(),
  count: z.number().int().positive().default(1),
});

export type InsertRowOperation = z.infer<typeof InsertRowOperationSchema>;

export const DeleteRowOperationSchema = z.object({
  type: z.literal("DELETE_ROW"),
  atIndex: z.number().int().nonnegative(),
  count: z.number().int().positive().default(1),
  deletedRows: z.array(z.record(z.string(), CellValueSchema).optional()),
});

export type DeleteRowOperation = z.infer<typeof DeleteRowOperationSchema>;

export const InsertColumnOperationSchema = z.object({
  type: z.literal("INSERT_COLUMN"),
  atIndex: z.number().int().nonnegative(),
  count: z.number().int().positive().default(1),
});

export type InsertColumnOperation = z.infer<typeof InsertColumnOperationSchema>;

export const DeleteColumnOperationSchema = z.object({
  type: z.literal("DELETE_COLUMN"),
  columnIds: z.array(z.string()),
  deletedData: z.record(z.string(), z.record(z.string(), CellValueSchema)),
});

export type DeleteColumnOperation = z.infer<typeof DeleteColumnOperationSchema>;

export const ResizeColumnOperationSchema = z.object({
  type: z.literal("RESIZE_COLUMN"),
  columnId: z.string().min(1),
  width: z.number().int().positive(),
});

export type ResizeColumnOperation = z.infer<typeof ResizeColumnOperationSchema>;

export const ReorderColumnsOperationSchema = z.object({
  type: z.literal("REORDER_COLUMNS"),
  order: z.array(z.string()),
});

export type ReorderColumnsOperation = z.infer<
  typeof ReorderColumnsOperationSchema
>;

export const PatchOperationSchema = z.discriminatedUnion("type", [
  SetCellOperationSchema,
  SetCellsOperationSchema,
  InsertRowOperationSchema,
  DeleteRowOperationSchema,
  InsertColumnOperationSchema,
  DeleteColumnOperationSchema,
  ResizeColumnOperationSchema,
  ReorderColumnsOperationSchema,
]);

export type PatchOperation = z.infer<typeof PatchOperationSchema>;

export const PatchRecordSchema = z.object({
  id: z.number().optional(),
  sheetId: z.string().uuid(),
  operation: PatchOperationSchema,
  inverse: PatchOperationSchema,
  timestamp: z.date(),
});

export type PatchRecord = z.infer<typeof PatchRecordSchema>;

export function validatePatchOperation(operation: unknown): PatchOperation {
  return PatchOperationSchema.parse(operation);
}

export function validatePatchRecord(record: unknown): PatchRecord {
  return PatchRecordSchema.parse(record);
}
