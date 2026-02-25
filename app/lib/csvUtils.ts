import { HoldingItem } from "./types";

export interface CsvParseResult {
  items: HoldingItem[];
  errors: { line: number; message: string }[];
  totalLines: number;
}

function removeBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/)[0] || "";
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  return tabs > commas ? "\t" : ",";
}

function parseNumber(value: string): number {
  // Remove commas from numbers like "12,500"
  const cleaned = value.replace(/,/g, "").trim();
  return parseFloat(cleaned);
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function isHeaderLine(fields: string[]): boolean {
  const headerKeywords = ["구분", "종목", "종목코드", "수량", "평단가"];
  return headerKeywords.some((kw) => fields.some((f) => f.includes(kw)));
}

export function parseCsvToHoldings(csvText: string): CsvParseResult {
  const text = removeBom(csvText);
  const delimiter = detectDelimiter(text);
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");

  const items: HoldingItem[] = [];
  const errors: { line: number; message: string }[] = [];

  let startIndex = 0;
  if (lines.length > 0 && isHeaderLine(splitCsvLine(lines[0], delimiter))) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const lineNum = i + 1;
    const fields = splitCsvLine(lines[i], delimiter);

    if (fields.length < 5) {
      errors.push({ line: lineNum, message: `필드 부족 (${fields.length}/5)` });
      continue;
    }

    const [category, name, code, qtyStr, priceStr] = fields;

    if (!category || !name || !code) {
      errors.push({ line: lineNum, message: "구분, 종목, 종목코드는 필수입니다." });
      continue;
    }

    const quantity = parseNumber(qtyStr);
    const avgPrice = parseNumber(priceStr);

    if (isNaN(quantity) || quantity <= 0) {
      errors.push({ line: lineNum, message: `수량이 유효하지 않음: "${qtyStr}"` });
      continue;
    }

    if (isNaN(avgPrice) || avgPrice <= 0) {
      errors.push({ line: lineNum, message: `평단가가 유효하지 않음: "${priceStr}"` });
      continue;
    }

    items.push({
      id: `holding_${Date.now()}_${i}`,
      category: category.trim(),
      name: name.trim(),
      code: code.trim(),
      quantity: Math.floor(quantity),
      avgPrice: Math.round(avgPrice),
    });
  }

  return { items, errors, totalLines: lines.length - startIndex };
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportHoldingsTemplate(): string {
  return "\uFEFF구분,종목,종목코드,수량,평단가\n";
}

export function exportHoldingsToCsv(items: HoldingItem[]): string {
  const header = "구분,종목,종목코드,수량,평단가";
  const rows = items.map((item) =>
    [
      escapeCsvField(item.category),
      escapeCsvField(item.name),
      escapeCsvField(item.code),
      String(item.quantity),
      String(item.avgPrice),
    ].join(",")
  );
  return "\uFEFF" + [header, ...rows].join("\n") + "\n";
}

export function downloadCsv(csvText: string, filename: string): void {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
