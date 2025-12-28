import type { CellValue } from "@/types";

export function getTypeIndicator(
  type: CellValue["t"] | undefined,
): string | null {
  switch (type) {
    case "n":
      return "123";
    case "s":
      return "Abc";
    case "b":
      return "T/F";
    case "d":
      return "Date";
    case "e":
      return "Err";
    default:
      return null;
  }
}

export function formatCellValue(value: CellValue | undefined): string {
  if (!value || value.v === null || value.v === undefined) {
    return "";
  }

  const v = value.v;

  if (typeof v === "boolean") {
    return v ? "TRUE" : "FALSE";
  }

  if (typeof v === "number") {
    if (Number.isInteger(v)) {
      return v.toLocaleString();
    }
    return v.toLocaleString(undefined, { maximumFractionDigits: 10 });
  }

  return String(v);
}
