import { describe, it, expect } from "vitest";
import {
  calcStockAllocation,
  calcPortfolioTotals,
  calcCategoryPositions,
  formatNumber,
  formatPercent,
} from "@/app/lib/portfolioCalc";
import type { PortfolioStock } from "@/app/lib/types";

function makeStock(overrides: Partial<PortfolioStock> = {}): PortfolioStock {
  return {
    id: "stock_1",
    category: "배당성장",
    name: "TIGER 미국S&P500",
    code: "360750",
    targetWeight: 0.3,
    dividendRate: 0.02,
    strategy: "",
    analysis: "",
    rationale: "",
    currentPrice: 12000,
    ...overrides,
  };
}

describe("calcStockAllocation", () => {
  it("정상 케이스: 투자금 1억, 목표비중 30%, 현재가 12000", () => {
    const stock = makeStock({ targetWeight: 0.3, currentPrice: 12000 });
    const result = calcStockAllocation(stock, 100_000_000);

    expect(result.investAmount).toBe(30_000_000);
    expect(result.quantity).toBe(2500);
    expect(result.actualAmount).toBe(30_000_000);
  });

  it("월/연 배당금 계산", () => {
    const stock = makeStock({
      targetWeight: 0.3,
      currentPrice: 12000,
      dividendRate: 0.04,
    });
    const result = calcStockAllocation(stock, 100_000_000);

    expect(result.annualDividend).toBe(Math.round(result.actualAmount * 0.04));
    expect(result.monthlyDividend).toBe(
      Math.round((result.actualAmount * 0.04) / 12)
    );
  });

  it("버그 회귀: currentPrice=0 이면 quantity=0, Infinity 아님", () => {
    const stock = makeStock({ currentPrice: 0, targetWeight: 0.3 });
    const result = calcStockAllocation(stock, 100_000_000);

    expect(result.quantity).toBe(0);
    expect(result.actualAmount).toBe(0);
    expect(Number.isFinite(result.quantity)).toBe(true);
  });

  it("currentPrice 미설정(undefined) 이면 quantity=0", () => {
    const stock = makeStock({ currentPrice: undefined, targetWeight: 0.3 });
    const result = calcStockAllocation(stock, 100_000_000);

    expect(result.quantity).toBe(0);
    expect(result.actualAmount).toBe(0);
  });

  it("경계값: totalAmount=0 이면 모두 0", () => {
    const stock = makeStock({ targetWeight: 0.3, currentPrice: 12000 });
    const result = calcStockAllocation(stock, 0);

    expect(result.investAmount).toBe(0);
    expect(result.quantity).toBe(0);
    expect(result.actualAmount).toBe(0);
    expect(result.monthlyDividend).toBe(0);
    expect(result.annualDividend).toBe(0);
  });

  it("경계값: targetWeight=0 이면 모두 0", () => {
    const stock = makeStock({ targetWeight: 0, currentPrice: 12000 });
    const result = calcStockAllocation(stock, 100_000_000);

    expect(result.investAmount).toBe(0);
    expect(result.quantity).toBe(0);
    expect(result.actualAmount).toBe(0);
  });

  it("경계값: dividendRate=0 이면 배당금 0", () => {
    const stock = makeStock({
      targetWeight: 0.3,
      currentPrice: 12000,
      dividendRate: 0,
    });
    const result = calcStockAllocation(stock, 100_000_000);

    expect(result.monthlyDividend).toBe(0);
    expect(result.annualDividend).toBe(0);
  });

  it("수량은 소수점 버림 (floor)", () => {
    // investAmount=10_000_000, currentPrice=3000 → 3333.33...→ 3333
    const stock = makeStock({ targetWeight: 0.1, currentPrice: 3000 });
    const result = calcStockAllocation(stock, 100_000_000);

    expect(result.quantity).toBe(3333);
    expect(result.actualAmount).toBe(3333 * 3000);
  });
});

describe("calcPortfolioTotals", () => {
  it("빈 배열이면 모두 0", () => {
    const totals = calcPortfolioTotals([], 100_000_000);

    expect(totals.totalWeight).toBe(0);
    expect(totals.totalActualAmount).toBe(0);
    expect(totals.totalMonthlyDividend).toBe(0);
    expect(totals.totalAnnualDividend).toBe(0);
    expect(totals.weightedDividendRate).toBe(0);
    expect(totals.results).toHaveLength(0);
  });

  it("현재가가 모두 0일 때 weightedDividendRate 0 나누기 방어", () => {
    const stocks = [
      makeStock({ currentPrice: 0, targetWeight: 0.5, dividendRate: 0.04 }),
      makeStock({ id: "stock_2", currentPrice: 0, targetWeight: 0.5, dividendRate: 0.02 }),
    ];
    const totals = calcPortfolioTotals(stocks, 100_000_000);

    expect(totals.totalActualAmount).toBe(0);
    expect(totals.weightedDividendRate).toBe(0);
  });

  it("복수 종목 totalWeight 합산", () => {
    const stocks = [
      makeStock({ targetWeight: 0.3, currentPrice: 12000 }),
      makeStock({ id: "stock_2", targetWeight: 0.5, currentPrice: 5000 }),
    ];
    const totals = calcPortfolioTotals(stocks, 100_000_000);

    expect(totals.totalWeight).toBeCloseTo(0.8);
    expect(totals.results).toHaveLength(2);
  });
});

describe("calcCategoryPositions", () => {
  it("카테고리별 투자금액과 비중을 정확히 계산", () => {
    const stocks = [
      makeStock({ category: "배당성장", targetWeight: 0.3 }),
      makeStock({ id: "s2", category: "배당성장", targetWeight: 0.2 }),
      makeStock({ id: "s3", category: "성장동력", targetWeight: 0.5 }),
    ];
    const result = calcCategoryPositions(stocks, 100_000_000);

    expect(result).toHaveLength(2);
    const dividend = result.find((r) => r.category === "배당성장");
    const growth = result.find((r) => r.category === "성장동력");

    expect(dividend?.amount).toBe(50_000_000);
    expect(dividend?.weight).toBeCloseTo(0.5);
    expect(growth?.amount).toBe(50_000_000);
    expect(growth?.weight).toBeCloseTo(0.5);
  });

  it("빈 배열이면 빈 배열 반환", () => {
    const result = calcCategoryPositions([], 100_000_000);
    expect(result).toHaveLength(0);
  });

  it("단일 카테고리면 비중 100%", () => {
    const stocks = [
      makeStock({ category: "안전판", targetWeight: 0.4 }),
      makeStock({ id: "s2", category: "안전판", targetWeight: 0.6 }),
    ];
    const result = calcCategoryPositions(stocks, 50_000_000);

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("안전판");
    expect(result[0].amount).toBe(50_000_000);
    expect(result[0].weight).toBeCloseTo(1.0);
  });

  it("투자금액 0이면 amount 모두 0, weight는 정상 계산", () => {
    const stocks = [
      makeStock({ category: "배당성장", targetWeight: 0.5 }),
      makeStock({ id: "s2", category: "성장동력", targetWeight: 0.5 }),
    ];
    const result = calcCategoryPositions(stocks, 0);

    expect(result).toHaveLength(2);
    result.forEach((r) => expect(r.amount).toBe(0));
    result.forEach((r) => expect(r.weight).toBeCloseTo(0.5));
  });

  it("targetWeight 합이 1 미만이어도 비중은 정규화", () => {
    const stocks = [
      makeStock({ category: "배당성장", targetWeight: 0.1 }),
      makeStock({ id: "s2", category: "성장동력", targetWeight: 0.3 }),
    ];
    const result = calcCategoryPositions(stocks, 100_000_000);

    const dividend = result.find((r) => r.category === "배당성장");
    const growth = result.find((r) => r.category === "성장동력");

    expect(dividend?.weight).toBeCloseTo(0.25);
    expect(growth?.weight).toBeCloseTo(0.75);
    expect(dividend?.amount).toBe(10_000_000);
    expect(growth?.amount).toBe(30_000_000);
  });
});

describe("formatPercent", () => {
  it("0.3 → '30.0%'", () => {
    expect(formatPercent(0.3)).toBe("30.0%");
  });

  it("1.0 → '100.0%'", () => {
    expect(formatPercent(1.0)).toBe("100.0%");
  });

  it("0 → '0.0%'", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });

  it("0.035 → '3.5%'", () => {
    expect(formatPercent(0.035)).toBe("3.5%");
  });
});

describe("formatNumber", () => {
  it("1000000 → '1,000,000'", () => {
    expect(formatNumber(1_000_000)).toBe("1,000,000");
  });

  it("0 → '0'", () => {
    expect(formatNumber(0)).toBe("0");
  });
});
