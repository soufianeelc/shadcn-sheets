export type FormulaToken =
  | { type: "number"; value: number }
  | { type: "string"; value: string }
  | { type: "cell"; col: string; row: number }
  | {
      type: "range";
      startCol: string;
      startRow: number;
      endCol: string;
      endRow: number;
    }
  | { type: "function"; name: string; args: FormulaToken[][] }
  | { type: "operator"; value: "+" | "-" | "*" | "/" }
  | { type: "paren"; value: "(" | ")" };

export interface ParsedFormula {
  type: "expression" | "function" | "cell" | "range" | "literal";
  tokens: FormulaToken[];
}

const CELL_REF_REGEX = /^([A-Z]+)(\d+)$/;
const RANGE_REGEX = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/;

export function parseFormula(formula: string): ParsedFormula {
  const expr = formula.startsWith("=")
    ? formula.slice(1).trim()
    : formula.trim();

  if (!expr) {
    return { type: "literal", tokens: [] };
  }

  const tokens = tokenize(expr);
  return {
    type: categorizeFormula(tokens),
    tokens,
  };
}

function tokenize(expr: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];
  let pos = 0;

  while (pos < expr.length) {
    const char = expr[pos];

    if (/\s/.test(char)) {
      pos++;
      continue;
    }

    if ("+-*/".includes(char)) {
      tokens.push({ type: "operator", value: char as "+" | "-" | "*" | "/" });
      pos++;
      continue;
    }

    if (char === "(" || char === ")") {
      tokens.push({ type: "paren", value: char });
      pos++;
      continue;
    }

    if (/\d/.test(char) || (char === "." && /\d/.test(expr[pos + 1] || ""))) {
      let numStr = "";
      while (pos < expr.length && /[\d.]/.test(expr[pos])) {
        numStr += expr[pos];
        pos++;
      }
      tokens.push({ type: "number", value: parseFloat(numStr) });
      continue;
    }

    if (/[A-Z]/i.test(char)) {
      let identifier = "";
      const _start = pos;

      while (pos < expr.length && /[A-Z\d]/i.test(expr[pos])) {
        identifier += expr[pos].toUpperCase();
        pos++;
      }

      if (expr[pos] === ":") {
        pos++;
        let endRef = "";
        while (pos < expr.length && /[A-Z\d]/i.test(expr[pos])) {
          endRef += expr[pos].toUpperCase();
          pos++;
        }

        const fullRange = `${identifier}:${endRef}`;
        const rangeMatch = fullRange.match(RANGE_REGEX);

        if (rangeMatch) {
          tokens.push({
            type: "range",
            startCol: rangeMatch[1],
            startRow: parseInt(rangeMatch[2], 10),
            endCol: rangeMatch[3],
            endRow: parseInt(rangeMatch[4], 10),
          });
          continue;
        }
      }

      if (expr[pos] === "(") {
        pos++;
        const args = parseFunctionArgs(expr, pos);
        pos = args.endPos;
        tokens.push({
          type: "function",
          name: identifier,
          args: args.args,
        });
        continue;
      }

      const cellMatch = identifier.match(CELL_REF_REGEX);
      if (cellMatch) {
        tokens.push({
          type: "cell",
          col: cellMatch[1],
          row: parseInt(cellMatch[2], 10),
        });
        continue;
      }

      tokens.push({ type: "string", value: identifier });
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      pos++;
      let str = "";
      while (pos < expr.length && expr[pos] !== quote) {
        str += expr[pos];
        pos++;
      }
      pos++;
      tokens.push({ type: "string", value: str });
      continue;
    }

    if (char === ",") {
      pos++;
      continue;
    }

    pos++;
  }

  return tokens;
}

function parseFunctionArgs(
  expr: string,
  startPos: number,
): { args: FormulaToken[][]; endPos: number } {
  const args: FormulaToken[][] = [];
  let currentArg: FormulaToken[] = [];
  let pos = startPos;
  let parenDepth = 1;

  while (pos < expr.length && parenDepth > 0) {
    const char = expr[pos];

    if (char === "(") {
      parenDepth++;
      pos++;
    } else if (char === ")") {
      parenDepth--;
      if (parenDepth === 0) {
        if (currentArg.length > 0) {
          args.push(currentArg);
        }
        pos++;
        break;
      }
      pos++;
    } else if (char === "," && parenDepth === 1) {
      if (currentArg.length > 0) {
        args.push(currentArg);
        currentArg = [];
      }
      pos++;
    } else {
      const subExpr = extractUntilDelimiter(expr, pos, parenDepth);
      const subTokens = tokenize(subExpr.value);
      currentArg.push(...subTokens);
      pos = subExpr.endPos;
    }
  }

  return { args, endPos: pos };
}

function extractUntilDelimiter(
  expr: string,
  startPos: number,
  _depth: number,
): { value: string; endPos: number } {
  let value = "";
  let pos = startPos;

  while (pos < expr.length) {
    const char = expr[pos];
    if (char === "," || char === ")" || char === "(") {
      break;
    }
    value += char;
    pos++;
  }

  return { value, endPos: pos };
}

function categorizeFormula(tokens: FormulaToken[]): ParsedFormula["type"] {
  if (tokens.length === 0) return "literal";
  if (tokens.length === 1) {
    const token = tokens[0];
    if (token.type === "cell") return "cell";
    if (token.type === "range") return "range";
    if (token.type === "function") return "function";
    if (token.type === "number" || token.type === "string") return "literal";
  }
  return "expression";
}

export function getFormulaDependencies(
  formula: string,
): Array<{ col: string; row: number }> {
  const parsed = parseFormula(formula);
  const deps: Array<{ col: string; row: number }> = [];

  function extractDeps(tokens: FormulaToken[]) {
    for (const token of tokens) {
      if (token.type === "cell") {
        deps.push({ col: token.col, row: token.row });
      } else if (token.type === "range") {
        const startColIndex = columnToIndex(token.startCol);
        const endColIndex = columnToIndex(token.endCol);

        for (let row = token.startRow; row <= token.endRow; row++) {
          for (let col = startColIndex; col <= endColIndex; col++) {
            deps.push({ col: indexToColumn(col), row });
          }
        }
      } else if (token.type === "function") {
        for (const arg of token.args) {
          extractDeps(arg);
        }
      }
    }
  }

  extractDeps(parsed.tokens);
  return deps;
}

export function columnToIndex(col: string): number {
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 64);
  }
  return index - 1;
}

export function indexToColumn(index: number): string {
  let col = "";
  let n = index;
  while (n >= 0) {
    col = String.fromCharCode((n % 26) + 65) + col;
    n = Math.floor(n / 26) - 1;
  }
  return col;
}
