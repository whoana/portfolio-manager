import { describe, it, expect } from "vitest";
import {
  parseCsvToHoldings,
  exportHoldingsTemplate,
  exportHoldingsToCsv,
} from "@/app/lib/csvUtils";
import type { HoldingItem } from "@/app/lib/types";

describe("parseCsvToHoldings", () => {
  it("헤더가 있는 CSV 파싱", () => {
    const csv = "구분,종목,종목코드,수량,평단가\n배당성장,TIGER,458730,100,12500\n성장동력,KODEX,379800,50,18000";
    const result = parseCsvToHoldings(csv);

    expect(result.items).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(result.items[0].category).toBe("배당성장");
    expect(result.items[0].quantity).toBe(100);
    expect(result.items[0].avgPrice).toBe(12500);
  });

  it("헤더 없는 CSV (데이터만)", () => {
    const csv = "배당성장,TIGER,458730,100,12500";
    const result = parseCsvToHoldings(csv);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe("TIGER");
  });

  it("BOM 제거", () => {
    const csv = "\uFEFF구분,종목,종목코드,수량,평단가\n배당성장,TIGER,458730,100,12500";
    const result = parseCsvToHoldings(csv);

    expect(result.items).toHaveLength(1);
  });

  it("탭 구분자 자동 감지", () => {
    const csv = "구분\t종목\t종목코드\t수량\t평단가\n배당성장\tTIGER\t458730\t100\t12500";
    const result = parseCsvToHoldings(csv);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe("TIGER");
  });

  it("쉼표 포함 숫자 처리 (12,500 → 12500)", () => {
    const csv = '배당성장,TIGER,458730,100,"12,500"';
    const result = parseCsvToHoldings(csv);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].avgPrice).toBe(12500);
  });

  it("필드 부족 시 에러 수집 (나머지는 정상 처리)", () => {
    const csv = "배당성장,TIGER,458730,100,12500\n성장동력,KODEX\n안전판,CD금리,459580,50,15000";
    const result = parseCsvToHoldings(csv);

    expect(result.items).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].line).toBe(2);
  });

  it("수량 0 이하는 에러", () => {
    const csv = "배당성장,TIGER,458730,0,12500";
    const result = parseCsvToHoldings(csv);

    expect(result.items).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it("평단가 음수는 에러", () => {
    const csv = "배당성장,TIGER,458730,100,-1000";
    const result = parseCsvToHoldings(csv);

    expect(result.items).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it("빈 문자열이면 빈 결과", () => {
    const result = parseCsvToHoldings("");
    expect(result.items).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("큰따옴표로 감싼 필드 처리", () => {
    const csv = '"배당성장","TIGER, 미국배당","458730","100","12500"';
    const result = parseCsvToHoldings(csv);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe("TIGER, 미국배당");
  });
});

describe("exportHoldingsTemplate", () => {
  it("종목 없이 호출 시 BOM + 헤더만 포함", () => {
    const template = exportHoldingsTemplate();
    expect(template).toContain("\uFEFF");
    expect(template).toContain("구분,종목,종목코드,수량,평단가");
  });

  it("포트폴리오 종목 전달 시 수량 0, 평단가 0으로 포함", () => {
    const stocks = [
      { id: "s1", category: "배당성장", name: "TIGER 미국배당", code: "458730", targetWeight: 0.3, dividendRate: 0.035, strategy: "", analysis: "", rationale: "" },
      { id: "s2", category: "성장동력", name: "KODEX S&P500", code: "379800", targetWeight: 0.2, dividendRate: 0.01, strategy: "", analysis: "", rationale: "" },
    ];
    const template = exportHoldingsTemplate(stocks);
    expect(template).toContain("구분,종목,종목코드,수량,평단가");
    expect(template).toContain("배당성장,TIGER 미국배당,458730,0,0");
    expect(template).toContain("성장동력,KODEX S&P500,379800,0,0");
    expect(template).not.toContain("해외코드");
  });
});

describe("exportHoldingsToCsv", () => {
  it("보유내역을 CSV로 변환", () => {
    const items: HoldingItem[] = [
      { id: "h1", category: "배당성장", name: "TIGER", code: "458730", quantity: 100, avgPrice: 12500 },
      { id: "h2", category: "성장동력", name: "KODEX", code: "379800", quantity: 50, avgPrice: 18000 },
    ];
    const csv = exportHoldingsToCsv(items);

    expect(csv).toContain("\uFEFF");
    expect(csv).toContain("구분,종목,종목코드,수량,평단가");
    expect(csv).toContain("배당성장,TIGER,458730,100,12500");
    expect(csv).toContain("성장동력,KODEX,379800,50,18000");
  });

  it("종목명에 쉼표 포함 시 큰따옴표 감싸기", () => {
    const items: HoldingItem[] = [
      { id: "h1", category: "배당성장", name: "TIGER, 미국배당", code: "458730", quantity: 100, avgPrice: 12500 },
    ];
    const csv = exportHoldingsToCsv(items);

    expect(csv).toContain('"TIGER, 미국배당"');
  });

  it("빈 배열이면 헤더만", () => {
    const csv = exportHoldingsToCsv([]);
    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(1); // header only
  });

  it("roundtrip: export → import 결과 일치", () => {
    const items: HoldingItem[] = [
      { id: "h1", category: "배당성장", name: "TIGER", code: "458730", quantity: 100, avgPrice: 12500 },
    ];
    const csv = exportHoldingsToCsv(items);
    const parsed = parseCsvToHoldings(csv);

    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].category).toBe("배당성장");
    expect(parsed.items[0].name).toBe("TIGER");
    expect(parsed.items[0].code).toBe("458730");
    expect(parsed.items[0].quantity).toBe(100);
    expect(parsed.items[0].avgPrice).toBe(12500);
  });
});
