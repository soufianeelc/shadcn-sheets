import type { CellValue, RowData } from "@/types";
import {
  columnToIndex,
  type FormulaToken,
  indexToColumn,
  parseFormula,
} from "./parser";

export type CellGetter = (row: number, col: string) => CellValue | undefined;

export function evaluateFormula(
  formula: string,
  getCellValue: CellGetter,
): CellValue {
  try {
    const parsed = parseFormula(formula);
    const result = evaluateTokens(parsed.tokens, getCellValue);
    return {
      v: result,
      f: formula,
      t:
        typeof result === "number"
          ? "n"
          : typeof result === "boolean"
            ? "b"
            : "s",
    };
  } catch (_error) {
    return {
      v: "#ERROR!",
      f: formula,
      t: "e",
    };
  }
}

function evaluateTokens(
  tokens: FormulaToken[],
  getCellValue: CellGetter,
): string | number | boolean | null {
  if (tokens.length === 0) return null;

  if (tokens.length === 1) {
    return evaluateToken(tokens[0], getCellValue);
  }

  let result = evaluateToken(tokens[0], getCellValue);
  let i = 1;

  while (i < tokens.length) {
    const operatorToken = tokens[i];
    const valueToken = tokens[i + 1];

    if (operatorToken.type !== "operator" || !valueToken) {
      break;
    }

    const rightValue = evaluateToken(valueToken, getCellValue);
    result = applyOperator(result, operatorToken.value, rightValue);
    i += 2;
  }

  return result;
}

function evaluateToken(
  token: FormulaToken,
  getCellValue: CellGetter,
): string | number | boolean | null {
  switch (token.type) {
    case "number":
      return token.value;

    case "string":
      return token.value;

    case "cell": {
      const cell = getCellValue(token.row - 1, token.col);
      return cell?.v ?? null;
    }

    case "range":
      return "#REF!";

    case "function":
      return evaluateFunction(token.name, token.args, getCellValue);

    case "operator":
    case "paren":
      return null;

    default:
      return null;
  }
}

function evaluateFunction(
  name: string,
  args: FormulaToken[][],
  getCellValue: CellGetter,
): string | number | boolean | null {
  const funcName = name.toUpperCase();

  switch (funcName) {
    case "SUM":
      return evaluateSUM(args, getCellValue);

    case "AVG":
    case "AVERAGE":
      return evaluateAVG(args, getCellValue);

    case "COUNT":
      return evaluateCOUNT(args, getCellValue);

    case "MIN":
      return evaluateMIN(args, getCellValue);

    case "MAX":
      return evaluateMAX(args, getCellValue);

    case "IF":
      return evaluateIF(args, getCellValue);

    case "CONCAT":
    case "CONCATENATE":
      return evaluateCONCAT(args, getCellValue);

    default:
      return `#NAME?`;
  }
}

function getNumericValues(
  args: FormulaToken[][],
  getCellValue: CellGetter,
): number[] {
  const values: number[] = [];

  for (const arg of args) {
    for (const token of arg) {
      if (token.type === "number") {
        values.push(token.value);
      } else if (token.type === "cell") {
        const cell = getCellValue(token.row - 1, token.col);
        if (
          cell?.v !== null &&
          cell?.v !== undefined &&
          typeof cell.v === "number"
        ) {
          values.push(cell.v);
        } else if (typeof cell?.v === "string") {
          const num = parseFloat(cell.v);
          if (!Number.isNaN(num)) values.push(num);
        }
      } else if (token.type === "range") {
        const startColIdx = columnToIndex(token.startCol);
        const endColIdx = columnToIndex(token.endCol);

        for (let row = token.startRow; row <= token.endRow; row++) {
          for (let colIdx = startColIdx; colIdx <= endColIdx; colIdx++) {
            const col = indexToColumn(colIdx);
            const cell = getCellValue(row - 1, col);
            if (
              cell?.v !== null &&
              cell?.v !== undefined &&
              typeof cell.v === "number"
            ) {
              values.push(cell.v);
            } else if (typeof cell?.v === "string") {
              const num = parseFloat(cell.v);
              if (!Number.isNaN(num)) values.push(num);
            }
          }
        }
      }
    }
  }

  return values;
}

function evaluateSUM(args: FormulaToken[][], getCellValue: CellGetter): number {
  const values = getNumericValues(args, getCellValue);
  return values.reduce((sum, val) => sum + val, 0);
}

function evaluateAVG(
  args: FormulaToken[][],
  getCellValue: CellGetter,
): number | string {
  const values = getNumericValues(args, getCellValue);
  if (values.length === 0) return "#DIV/0!";
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function evaluateCOUNT(
  args: FormulaToken[][],
  getCellValue: CellGetter,
): number {
  let count = 0;

  for (const arg of args) {
    for (const token of arg) {
      if (token.type === "number") {
        count++;
      } else if (token.type === "cell") {
        const cell = getCellValue(token.row - 1, token.col);
        if (cell?.v !== null && cell?.v !== undefined && cell.v !== "") {
          if (typeof cell.v === "number") count++;
        }
      } else if (token.type === "range") {
        const startColIdx = columnToIndex(token.startCol);
        const endColIdx = columnToIndex(token.endCol);

        for (let row = token.startRow; row <= token.endRow; row++) {
          for (let colIdx = startColIdx; colIdx <= endColIdx; colIdx++) {
            const col = indexToColumn(colIdx);
            const cell = getCellValue(row - 1, col);
            if (cell?.v !== null && cell?.v !== undefined && cell.v !== "") {
              if (typeof cell.v === "number") count++;
            }
          }
        }
      }
    }
  }

  return count;
}

function evaluateMIN(
  args: FormulaToken[][],
  getCellValue: CellGetter,
): number | string {
  const values = getNumericValues(args, getCellValue);
  if (values.length === 0) return "#VALUE!";
  return Math.min(...values);
}

function evaluateMAX(
  args: FormulaToken[][],
  getCellValue: CellGetter,
): number | string {
  const values = getNumericValues(args, getCellValue);
  if (values.length === 0) return "#VALUE!";
  return Math.max(...values);
}

function evaluateIF(
  args: FormulaToken[][],
  getCellValue: CellGetter,
): string | number | boolean | null {
  if (args.length < 2) return "#VALUE!";

  const condition = evaluateTokens(args[0], getCellValue);
  const isTruthy = Boolean(condition);

  if (isTruthy) {
    return args[1] ? evaluateTokens(args[1], getCellValue) : true;
  } else {
    return args[2] ? evaluateTokens(args[2], getCellValue) : false;
  }
}

function evaluateCONCAT(
  args: FormulaToken[][],
  getCellValue: CellGetter,
): string {
  let result = "";

  for (const arg of args) {
    const value = evaluateTokens(arg, getCellValue);
    result += String(value ?? "");
  }

  return result;
}

function applyOperator(
  left: string | number | boolean | null,
  operator: "+" | "-" | "*" | "/",
  right: string | number | boolean | null,
): string | number | boolean | null {
  const leftNum = toNumber(left);
  const rightNum = toNumber(right);

  if (leftNum === null || rightNum === null) {
    if (operator === "+") {
      return String(left ?? "") + String(right ?? "");
    }
    return "#VALUE!";
  }

  switch (operator) {
    case "+":
      return leftNum + rightNum;
    case "-":
      return leftNum - rightNum;
    case "*":
      return leftNum * rightNum;
    case "/":
      if (rightNum === 0) return "#DIV/0!";
      return leftNum / rightNum;
    default:
      return "#VALUE!";
  }
}

function toNumber(value: string | number | boolean | null): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  const num = parseFloat(value);
  return Number.isNaN(num) ? null : num;
}

export function evaluateViewportFormulas(
  viewportData: Map<number, RowData>,
  getCellValue: CellGetter,
): Map<number, RowData> {
  const updatedData = new Map(viewportData);

  for (const [rowIndex, rowData] of viewportData) {
    let hasChanges = false;
    const updatedRow = { ...rowData };

    for (const [colId, cellValue] of Object.entries(rowData)) {
      if (cellValue.f) {
        const result = evaluateFormula(cellValue.f, getCellValue);
        if (result.v !== cellValue.v) {
          updatedRow[colId] = result;
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      updatedData.set(rowIndex, updatedRow);
    }
  }

  return updatedData;
}
