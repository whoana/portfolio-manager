export interface GrowthParams {
  dividendGrowthRate: number;  // 연배당성장율 (소수, e.g., 0.04)
  annualAddition: number;      // 연추가투자금액 (원, e.g., 12_000_000)
  assetGrowthRate: number;     // 자산상승율 (소수, e.g., 0.07)
}

export interface YearlyGrowthRow {
  year: number;
  assetValue: number;          // 평가금 (원)
  totalInvested: number;       // 누적투자금 (원)
  annualDividend: number;      // 연배당금 (원)
  monthlyDividend: number;     // 월배당금 (원)
  dividendRate: number;        // 배당률 (소수)
}

export const DEFAULT_GROWTH_PARAMS: GrowthParams = {
  dividendGrowthRate: 0.04,
  annualAddition: 12_000_000,
  assetGrowthRate: 0.07,
};

export function calcGrowthReport(
  initialAmount: number,
  initialDividendRate: number,
  params: GrowthParams,
  years = 10
): YearlyGrowthRow[] {
  const rows: YearlyGrowthRow[] = [];
  let asset = initialAmount;
  let totalInvested = initialAmount;

  for (let year = 1; year <= years; year++) {
    // 전년도 자산 상승 후 추가 투자
    asset = asset * (1 + params.assetGrowthRate) + params.annualAddition;
    totalInvested += params.annualAddition;

    // 배당률은 매년 복리로 성장
    const dividendRate = initialDividendRate * Math.pow(1 + params.dividendGrowthRate, year);

    const annualDividend = Math.round(asset * dividendRate);
    const monthlyDividend = Math.round(annualDividend / 12);

    rows.push({
      year,
      assetValue: Math.round(asset),
      totalInvested: Math.round(totalInvested),
      annualDividend,
      monthlyDividend,
      dividendRate,
    });
  }

  return rows;
}
