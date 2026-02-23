import { PortfolioStock, StockCalcResult } from "./types";

export function calcStockAllocation(
  stock: PortfolioStock,
  totalAmount: number
): StockCalcResult {
  const investAmount = Math.round(totalAmount * stock.targetWeight);
  const quantity = stock.currentPrice
    ? Math.floor(investAmount / stock.currentPrice)
    : 0;
  const actualAmount = quantity * (stock.currentPrice || 0);
  const monthlyDividend = Math.round((actualAmount * stock.dividendRate) / 12);
  const annualDividend = Math.round(actualAmount * stock.dividendRate);
  return { investAmount, quantity, actualAmount, monthlyDividend, annualDividend };
}

export function calcPortfolioTotals(
  stocks: PortfolioStock[],
  totalAmount: number
) {
  const results = stocks.map((stock) => ({
    stock,
    calc: calcStockAllocation(stock, totalAmount),
  }));

  const totalWeight = stocks.reduce((sum, s) => sum + s.targetWeight, 0);
  const totalActualAmount = results.reduce(
    (sum, r) => sum + r.calc.actualAmount,
    0
  );
  const totalMonthlyDividend = results.reduce(
    (sum, r) => sum + r.calc.monthlyDividend,
    0
  );
  const totalAnnualDividend = results.reduce(
    (sum, r) => sum + r.calc.annualDividend,
    0
  );

  const weightedDividendRate =
    totalActualAmount > 0
      ? stocks.reduce(
          (sum, s) =>
            sum +
            s.dividendRate *
              (calcStockAllocation(s, totalAmount).actualAmount /
                totalActualAmount),
          0
        )
      : 0;

  return {
    results,
    totalWeight,
    totalActualAmount,
    totalMonthlyDividend,
    totalAnnualDividend,
    weightedDividendRate,
  };
}

export interface CategoryPosition {
  category: string;
  amount: number;
  weight: number;
}

export function calcCategoryPositions(
  stocks: PortfolioStock[],
  investmentAmount: number
): CategoryPosition[] {
  const categoryMap = new Map<string, number>();
  stocks.forEach((s) => {
    const current = categoryMap.get(s.category) || 0;
    categoryMap.set(s.category, current + s.targetWeight);
  });

  const totalWeight = stocks.reduce((sum, s) => sum + s.targetWeight, 0);
  return Array.from(categoryMap.entries()).map(([category, weight]) => ({
    category,
    amount: Math.round(weight * investmentAmount),
    weight: totalWeight > 0 ? weight / totalWeight : 0,
  }));
}

export function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

export function formatPercent(n: number): string {
  return (n * 100).toFixed(1) + "%";
}
