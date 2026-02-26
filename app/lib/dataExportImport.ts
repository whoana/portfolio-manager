import { Portfolio, PortfolioHoldings } from "./types";
import type { ThemeName } from "./settingsStorage";

// ── 타입 정의 ──

export interface ExportFileFormat {
  appName: "etf-portfolio-manager";
  version: number;
  exportedAt: string;
  data: ExportData;
}

export interface ExportData {
  portfolios: Portfolio[];
  holdings: PortfolioHoldings[];
  settings: {
    theme: ThemeName;
    helpEnabled: boolean;
  };
}

export interface ImportParseResult {
  success: boolean;
  data?: ExportData;
  error?: string;
  stats?: {
    portfolioCount: number;
    holdingCount: number;
    totalStockCount: number;
  };
}

export interface ImportApplyResult {
  portfoliosAdded: number;
  holdingsAdded: number;
  skipped: number;
}

// ── localStorage 키 ──

const PORTFOLIOS_KEY = "etf_portfolios";
const HOLDINGS_KEY = "etf_holdings";
const THEME_KEY = "etf_theme";
const HELP_KEY = "etf_help_enabled";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ── 내보내기 ──

export function collectExportData(): ExportData {
  let portfolios: Portfolio[] = [];
  let holdings: PortfolioHoldings[] = [];
  let theme: ThemeName = "toss";
  let helpEnabled = true;

  try {
    const p = localStorage.getItem(PORTFOLIOS_KEY);
    if (p) portfolios = JSON.parse(p);
  } catch {}

  try {
    const h = localStorage.getItem(HOLDINGS_KEY);
    if (h) holdings = JSON.parse(h);
  } catch {}

  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === "claude" || t === "dark" || t === "classic" || t === "toss") theme = t;
  } catch {}

  try {
    const he = localStorage.getItem(HELP_KEY);
    if (he === "false") helpEnabled = false;
  } catch {}

  return { portfolios, holdings, settings: { theme, helpEnabled } };
}

export function exportAllData(): void {
  const data = collectExportData();

  const file: ExportFileFormat = {
    appName: "etf-portfolio-manager",
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };

  const json = JSON.stringify(file, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `portfolio-backup-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── 들여오기: 파일 파싱 + 검증 ──

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsText(file);
  });
}

export async function parseImportFile(file: File): Promise<ImportParseResult> {
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: `파일 크기가 너무 큽니다 (최대 5MB, 현재 ${(file.size / 1024 / 1024).toFixed(1)}MB)` };
  }

  if (!file.name.endsWith(".json")) {
    return { success: false, error: "JSON 파일만 지원됩니다." };
  }

  let text: string;
  try {
    text = await readFileAsText(file);
  } catch {
    return { success: false, error: "파일을 읽을 수 없습니다." };
  }

  return parseImportJson(text);
}

/** JSON 문자열을 파싱하고 검증. 테스트에서도 직접 사용 가능. */
export function parseImportJson(text: string): ImportParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { success: false, error: "유효한 JSON 형식이 아닙니다." };
  }
  return validateImportData(parsed);
}

function validateImportData(raw: unknown): ImportParseResult {
  if (typeof raw !== "object" || raw === null) {
    return { success: false, error: "잘못된 파일 형식입니다." };
  }

  const obj = raw as Record<string, unknown>;

  if (obj.appName !== "etf-portfolio-manager") {
    return { success: false, error: "이 앱에서 생성된 백업 파일이 아닙니다." };
  }

  if (typeof obj.version !== "number") {
    return { success: false, error: "파일 버전 정보가 없습니다." };
  }

  const data = obj.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== "object") {
    return { success: false, error: "데이터 섹션이 없습니다." };
  }

  if (!Array.isArray(data.portfolios)) {
    return { success: false, error: "포트폴리오 데이터가 유효하지 않습니다." };
  }

  if (!Array.isArray(data.holdings)) {
    return { success: false, error: "보유 내역 데이터가 유효하지 않습니다." };
  }

  // 포트폴리오 필수 필드 검증
  for (let i = 0; i < data.portfolios.length; i++) {
    const p = data.portfolios[i] as Record<string, unknown>;
    if (!p.id || !p.name || !Array.isArray(p.stocks)) {
      return { success: false, error: `포트폴리오 ${i + 1}번째 항목이 유효하지 않습니다 (id, name, stocks 필수).` };
    }
  }

  // 보유 내역 필수 필드 검증
  for (let i = 0; i < data.holdings.length; i++) {
    const h = data.holdings[i] as Record<string, unknown>;
    if (!h.portfolioId || !Array.isArray(h.items)) {
      return { success: false, error: `보유 내역 ${i + 1}번째 항목이 유효하지 않습니다 (portfolioId, items 필수).` };
    }
  }

  const settings = (data.settings || { theme: "toss", helpEnabled: true }) as {
    theme: ThemeName;
    helpEnabled: boolean;
  };

  const exportData: ExportData = {
    portfolios: data.portfolios as Portfolio[],
    holdings: data.holdings as PortfolioHoldings[],
    settings: {
      theme: ["claude", "dark", "classic", "toss"].includes(settings.theme) ? settings.theme : "toss",
      helpEnabled: typeof settings.helpEnabled === "boolean" ? settings.helpEnabled : true,
    },
  };

  const totalStockCount = exportData.portfolios.reduce((s, p) => s + p.stocks.length, 0);
  const holdingCount = exportData.holdings.reduce((s, h) => s + h.items.length, 0);

  return {
    success: true,
    data: exportData,
    stats: {
      portfolioCount: exportData.portfolios.length,
      holdingCount,
      totalStockCount,
    },
  };
}

// ── 들여오기: 적용 ──

export function applyImportData(data: ExportData, mode: "replace" | "merge"): ImportApplyResult {
  if (mode === "replace") {
    localStorage.setItem(PORTFOLIOS_KEY, JSON.stringify(data.portfolios));
    localStorage.setItem(HOLDINGS_KEY, JSON.stringify(data.holdings));
    localStorage.setItem(THEME_KEY, data.settings.theme);
    localStorage.setItem(HELP_KEY, String(data.settings.helpEnabled));

    return {
      portfoliosAdded: data.portfolios.length,
      holdingsAdded: data.holdings.reduce((s, h) => s + h.items.length, 0),
      skipped: 0,
    };
  }

  // 병합 모드
  let existingPortfolios: Portfolio[] = [];
  let existingHoldings: PortfolioHoldings[] = [];
  try {
    const p = localStorage.getItem(PORTFOLIOS_KEY);
    if (p) existingPortfolios = JSON.parse(p);
  } catch {}
  try {
    const h = localStorage.getItem(HOLDINGS_KEY);
    if (h) existingHoldings = JSON.parse(h);
  } catch {}

  const existingPortfolioIds = new Set(existingPortfolios.map((p) => p.id));
  const existingHoldingIds = new Set(existingHoldings.map((h) => h.portfolioId));

  let portfoliosAdded = 0;
  let holdingsAdded = 0;
  let skipped = 0;

  for (const p of data.portfolios) {
    if (existingPortfolioIds.has(p.id)) {
      skipped++;
    } else {
      existingPortfolios.push(p);
      portfoliosAdded++;
    }
  }

  for (const h of data.holdings) {
    if (existingHoldingIds.has(h.portfolioId)) {
      // skip
    } else {
      existingHoldings.push(h);
      holdingsAdded += h.items.length;
    }
  }

  localStorage.setItem(PORTFOLIOS_KEY, JSON.stringify(existingPortfolios));
  localStorage.setItem(HOLDINGS_KEY, JSON.stringify(existingHoldings));

  // 설정은 병합 모드에서 변경하지 않음

  return { portfoliosAdded, holdingsAdded, skipped };
}
