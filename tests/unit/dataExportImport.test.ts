import { describe, it, expect, beforeEach } from "vitest";
import {
  collectExportData,
  parseImportJson,
  applyImportData,
  type ExportFileFormat,
  type ExportData,
} from "@/app/lib/dataExportImport";

function makeValidExportFile(overrides?: Partial<ExportFileFormat>): ExportFileFormat {
  return {
    appName: "etf-portfolio-manager",
    version: 1,
    exportedAt: "2026-02-26T12:00:00.000Z",
    data: {
      portfolios: [
        {
          id: "p1",
          name: "테스트 포트폴리오",
          stocks: [
            {
              id: "s1",
              category: "배당성장",
              name: "TIGER 미국배당",
              code: "458730",
              targetWeight: 0.3,
              dividendRate: 0.035,
              strategy: "전략",
              analysis: "분석",
              rationale: "근거",
            },
          ],
          investmentAmount: 100000000,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-02-26T00:00:00.000Z",
        },
      ],
      holdings: [
        {
          portfolioId: "p1",
          items: [
            { id: "h1", category: "배당성장", name: "TIGER 미국배당", code: "458730", quantity: 100, avgPrice: 12000 },
          ],
          updatedAt: "2026-02-26T00:00:00.000Z",
        },
      ],
      settings: { theme: "toss", helpEnabled: true },
    },
    ...overrides,
  };
}

describe("dataExportImport", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("collectExportData", () => {
    it("빈 localStorage에서 기본값 반환", () => {
      const data = collectExportData();
      expect(data.portfolios).toEqual([]);
      expect(data.holdings).toEqual([]);
      expect(data.settings.theme).toBe("toss");
      expect(data.settings.helpEnabled).toBe(true);
    });

    it("저장된 데이터를 올바르게 수집", () => {
      localStorage.setItem("etf_portfolios", JSON.stringify([{ id: "p1", name: "Test" }]));
      localStorage.setItem("etf_holdings", JSON.stringify([{ portfolioId: "p1", items: [] }]));
      localStorage.setItem("etf_theme", "dark");
      localStorage.setItem("etf_help_enabled", "false");

      const data = collectExportData();
      expect(data.portfolios).toHaveLength(1);
      expect(data.holdings).toHaveLength(1);
      expect(data.settings.theme).toBe("dark");
      expect(data.settings.helpEnabled).toBe(false);
    });
  });

  describe("parseImportJson", () => {
    it("유효한 JSON 파싱 성공", () => {
      const result = parseImportJson(JSON.stringify(makeValidExportFile()));
      expect(result.success).toBe(true);
      expect(result.stats?.portfolioCount).toBe(1);
      expect(result.stats?.totalStockCount).toBe(1);
      expect(result.stats?.holdingCount).toBe(1);
    });

    it("잘못된 JSON 형식 거부", () => {
      const result = parseImportJson("{invalid json}");
      expect(result.success).toBe(false);
      expect(result.error).toContain("JSON 형식");
    });

    it("appName 불일치 거부", () => {
      const data = { ...makeValidExportFile(), appName: "wrong-app" };
      const result = parseImportJson(JSON.stringify(data));
      expect(result.success).toBe(false);
      expect(result.error).toContain("백업 파일이 아닙니다");
    });

    it("portfolios가 배열이 아니면 거부", () => {
      const data = makeValidExportFile();
      (data.data as unknown as Record<string, unknown>).portfolios = "not array";
      const result = parseImportJson(JSON.stringify(data));
      expect(result.success).toBe(false);
      expect(result.error).toContain("포트폴리오");
    });

    it("포트폴리오 필수 필드 누락 시 거부", () => {
      const data = makeValidExportFile();
      data.data.portfolios = [{ id: "p1" } as never];
      const result = parseImportJson(JSON.stringify(data));
      expect(result.success).toBe(false);
      expect(result.error).toContain("유효하지 않습니다");
    });

    it("settings 없어도 기본값으로 처리", () => {
      const data = makeValidExportFile();
      delete (data.data as unknown as Record<string, unknown>).settings;
      const result = parseImportJson(JSON.stringify(data));
      expect(result.success).toBe(true);
      expect(result.data?.settings.theme).toBe("toss");
    });

    it("version 누락 시 거부", () => {
      const data = makeValidExportFile();
      delete (data as unknown as Record<string, unknown>).version;
      const result = parseImportJson(JSON.stringify(data));
      expect(result.success).toBe(false);
      expect(result.error).toContain("버전");
    });
  });

  describe("applyImportData - 덮어쓰기", () => {
    it("기존 데이터를 완전히 교체", () => {
      localStorage.setItem("etf_portfolios", JSON.stringify([{ id: "old", name: "Old" }]));

      const data = makeValidExportFile().data;
      const result = applyImportData(data, "replace");

      expect(result.portfoliosAdded).toBe(1);
      expect(result.skipped).toBe(0);

      const stored = JSON.parse(localStorage.getItem("etf_portfolios")!);
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe("p1");

      expect(localStorage.getItem("etf_theme")).toBe("toss");
      expect(localStorage.getItem("etf_help_enabled")).toBe("true");
    });
  });

  describe("applyImportData - 병합", () => {
    it("새 항목만 추가, 중복 ID는 스킵", () => {
      localStorage.setItem("etf_portfolios", JSON.stringify([{ id: "p1", name: "Existing" }]));
      localStorage.setItem("etf_holdings", JSON.stringify([]));

      const data: ExportData = {
        ...makeValidExportFile().data,
        portfolios: [
          { id: "p1", name: "Duplicate", stocks: [], investmentAmount: 0, createdAt: "", updatedAt: "" },
          { id: "p2", name: "New", stocks: [], investmentAmount: 0, createdAt: "", updatedAt: "" },
        ],
      };

      const result = applyImportData(data, "merge");
      expect(result.portfoliosAdded).toBe(1);
      expect(result.skipped).toBe(1);

      const stored = JSON.parse(localStorage.getItem("etf_portfolios")!);
      expect(stored).toHaveLength(2);
      expect(stored[0].name).toBe("Existing"); // 기존 유지
      expect(stored[1].name).toBe("New");
    });

    it("병합 모드에서 설정은 변경하지 않음", () => {
      localStorage.setItem("etf_theme", "dark");

      const data = makeValidExportFile().data;
      data.settings.theme = "classic";
      applyImportData(data, "merge");

      expect(localStorage.getItem("etf_theme")).toBe("dark");
    });
  });
});
