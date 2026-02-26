import { describe, it, expect } from "vitest";
import {
  evaluateHolding,
  evaluateAllHoldings,
  calcCategoryEvaluations,
  compareWeightsByCategory,
  compareWeightsByStock,
} from "@/app/lib/holdingsCalc";
import type { HoldingItem, PortfolioStock } from "@/app/lib/types";

function makeHolding(overrides: Partial<HoldingItem> = {}): HoldingItem {
  return {
    id: "h1",
    category: "배당성장",
    name: "TIGER 미국배당다우존스",
    code: "458730",
    quantity: 100,
    avgPrice: 12000,
    currentPrice: 13000,
    ...overrides,
  };
}

function makeStock(overrides: Partial<PortfolioStock> = {}): PortfolioStock {
  return {
    id: "s1",
    category: "배당성장",
    name: "TIGER 미국배당다우존스",
    code: "458730",
    targetWeight: 0.3,
    dividendRate: 0.035,
    strategy: "",
    analysis: "",
    rationale: "",
    ...overrides,
  };
}

describe("evaluateHolding", () => {
  it("투자원금, 평가액, 손익, 수익률 계산", () => {
    const item = makeHolding({ quantity: 100, avgPrice: 12000, currentPrice: 13000 });
    const ev = evaluateHolding(item);

    expect(ev.investAmount).toBe(1_200_000);
    expect(ev.evalAmount).toBe(1_300_000);
    expect(ev.profitLoss).toBe(100_000);
    expect(ev.returnRate).toBeCloseTo(100_000 / 1_200_000);
  });

  it("currentPrice 미설정 시 평가액 0", () => {
    const item = makeHolding({ currentPrice: undefined });
    const ev = evaluateHolding(item);

    expect(ev.evalAmount).toBe(0);
    expect(ev.profitLoss).toBe(-ev.investAmount);
  });

  it("수량 0이면 모두 0", () => {
    const item = makeHolding({ quantity: 0 });
    const ev = evaluateHolding(item);

    expect(ev.investAmount).toBe(0);
    expect(ev.evalAmount).toBe(0);
    expect(ev.returnRate).toBe(0);
  });
});

describe("evaluateAllHoldings", () => {
  it("빈 배열이면 모두 0", () => {
    const result = evaluateAllHoldings([]);

    expect(result.totalInvest).toBe(0);
    expect(result.totalEval).toBe(0);
    expect(result.totalReturnRate).toBe(0);
  });

  it("복수 종목 합산", () => {
    const items = [
      makeHolding({ id: "h1", quantity: 100, avgPrice: 10000, currentPrice: 12000 }),
      makeHolding({ id: "h2", quantity: 50, avgPrice: 20000, currentPrice: 22000 }),
    ];
    const result = evaluateAllHoldings(items);

    expect(result.totalInvest).toBe(100 * 10000 + 50 * 20000);
    expect(result.totalEval).toBe(100 * 12000 + 50 * 22000);
    expect(result.totalProfitLoss).toBe(result.totalEval - result.totalInvest);
  });
});

describe("calcCategoryEvaluations", () => {
  it("카테고리별 집계", () => {
    const items = [
      makeHolding({ id: "h1", category: "배당성장", quantity: 100, avgPrice: 10000, currentPrice: 11000 }),
      makeHolding({ id: "h2", category: "배당성장", quantity: 50, avgPrice: 12000, currentPrice: 13000 }),
      makeHolding({ id: "h3", category: "성장동력", quantity: 200, avgPrice: 5000, currentPrice: 6000 }),
    ];
    const result = calcCategoryEvaluations(items);

    expect(result).toHaveLength(2);
    const dividend = result.find((r) => r.category === "배당성장");
    expect(dividend!.investAmount).toBe(100 * 10000 + 50 * 12000);
    expect(dividend!.evalAmount).toBe(100 * 11000 + 50 * 13000);
  });

  it("빈 배열이면 빈 배열", () => {
    expect(calcCategoryEvaluations([])).toHaveLength(0);
  });
});

describe("compareWeightsByCategory", () => {
  it("목표비중과 실제비중 비교", () => {
    const stocks = [
      makeStock({ category: "배당성장", targetWeight: 0.5 }),
      makeStock({ id: "s2", category: "성장동력", targetWeight: 0.5 }),
    ];
    const holdings = [
      makeHolding({ id: "h1", category: "배당성장", quantity: 100, currentPrice: 10000 }),
      makeHolding({ id: "h2", category: "성장동력", quantity: 300, currentPrice: 10000 }),
    ];
    const result = compareWeightsByCategory(stocks, holdings);

    const dividend = result.find((r) => r.label === "배당성장")!;
    const growth = result.find((r) => r.label === "성장동력")!;

    expect(dividend.targetWeight).toBeCloseTo(0.5);
    expect(dividend.actualWeight).toBeCloseTo(0.25);
    expect(growth.targetWeight).toBeCloseTo(0.5);
    expect(growth.actualWeight).toBeCloseTo(0.75);
  });

  it("빈 배열이면 빈 결과", () => {
    expect(compareWeightsByCategory([], [])).toHaveLength(0);
  });
});

describe("compareWeightsByStock", () => {
  it("종목별 비중 비교", () => {
    const stocks = [
      makeStock({ code: "111", targetWeight: 0.6, name: "A종목" }),
      makeStock({ id: "s2", code: "222", targetWeight: 0.4, name: "B종목" }),
    ];
    const holdings = [
      makeHolding({ id: "h1", code: "111", quantity: 100, currentPrice: 10000 }),
      makeHolding({ id: "h2", code: "222", quantity: 100, currentPrice: 10000 }),
    ];
    const result = compareWeightsByStock(stocks, holdings);

    expect(result).toHaveLength(2);
    const a = result.find((r) => r.label === "A종목")!;
    expect(a.targetWeight).toBeCloseTo(0.6);
    expect(a.actualWeight).toBeCloseTo(0.5);
  });

  it("holdings에만 있는 종목도 포함", () => {
    const stocks = [makeStock({ code: "111", targetWeight: 1.0 })];
    const holdings = [
      makeHolding({ id: "h1", code: "111", quantity: 50, currentPrice: 10000 }),
      makeHolding({ id: "h2", code: "999", name: "미등록종목", quantity: 50, currentPrice: 10000 }),
    ];
    const result = compareWeightsByStock(stocks, holdings);

    expect(result).toHaveLength(2);
    const unknown = result.find((r) => r.label === "미등록종목")!;
    expect(unknown.targetWeight).toBe(0);
    expect(unknown.actualWeight).toBeCloseTo(0.5);
  });
});
