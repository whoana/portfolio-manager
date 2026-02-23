"use client";

import { Portfolio } from "@/app/lib/types";
import { formatPercent, formatNumber, calcCategoryPositions } from "@/app/lib/portfolioCalc";
import PieChart from "./PieChart";

const CATEGORY_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];

interface PortfolioSummaryProps {
  portfolio: Portfolio;
}

export default function PortfolioSummary({ portfolio }: PortfolioSummaryProps) {
  const { stocks, investmentAmount } = portfolio;

  const totalWeight = stocks.reduce((sum, s) => sum + s.targetWeight, 0);

  const weightedDividendRate =
    stocks.length > 0
      ? stocks.reduce((sum, s) => sum + s.targetWeight * s.dividendRate, 0) /
        (totalWeight || 1)
      : 0;

  const estAnnualDividend = Math.round(investmentAmount * weightedDividendRate);
  const estMonthlyDividend = Math.round(estAnnualDividend / 12);

  const categoryPositions = calcCategoryPositions(stocks, investmentAmount);
  const chartData = categoryPositions.map((cp, i) => ({
    label: cp.category,
    value: cp.amount,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const formatAmountShort = (amount: number): string => {
    if (amount >= 100_000_000) {
      const eok = amount / 100_000_000;
      return eok % 1 === 0 ? `${eok}억원` : `${eok.toFixed(1)}억원`;
    }
    if (amount >= 10_000) {
      const man = amount / 10_000;
      return man % 1 === 0 ? `${formatNumber(man)}만원` : `${man.toFixed(0)}만원`;
    }
    return `${formatNumber(amount)}원`;
  };

  const statsItems = [
    {
      label: "종목 수",
      value: `${stocks.length}개`,
      sub: "포트폴리오 종목",
    },
    {
      label: "총 비중",
      value: formatPercent(totalWeight),
      sub: totalWeight > 1.001 ? "경고: 100% 초과" : totalWeight < 0.999 && stocks.length > 0 ? "미배분 잔여 있음" : "",
      warn: totalWeight > 1.001,
    },
    {
      label: "가중평균 배당률",
      value: formatPercent(weightedDividendRate),
      sub: "목표비중 기준",
    },
    {
      label: "예상 월배당",
      value: formatNumber(estMonthlyDividend) + "원",
      sub: "투자금액 기준 추정",
    },
    {
      label: "예상 연배당",
      value: formatNumber(estAnnualDividend) + "원",
      sub: "투자금액 기준 추정",
    },
  ];

  return (
    <div className="bg-card-bg rounded-2xl md:rounded-xl md:border border-card-border overflow-hidden shadow-sm md:shadow-none">
      <div className="px-5 py-3 sm:py-4 border-b border-card-border">
        <h2 className="text-sm font-bold text-primary">포트폴리오 요약</h2>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block px-5 py-4">
        {/* Chart + Legend */}
        {stocks.length > 0 && (
          <div className="flex items-center gap-8 mb-6 pb-6 border-b border-card-border">
            <PieChart
              data={chartData}
              size={180}
              centerLabel="총 투자금"
              centerValue={formatAmountShort(investmentAmount)}
            />
            <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-3">
              {chartData.map((item) => {
                const pos = categoryPositions.find((p) => p.category === item.label);
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-foreground">{item.label}</span>
                        <span className="text-xs text-muted">
                          {pos ? (pos.weight * 100).toFixed(1) + "%" : ""}
                        </span>
                      </div>
                      <div className="text-xs text-muted">
                        {pos ? formatNumber(pos.amount) + "원" : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Stats grid */}
        <div className="grid grid-cols-5 gap-4">
          {statsItems.map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <span className="text-xs text-muted">{item.label}</span>
              <span className={`text-lg font-bold ${item.warn ? "text-accent-red" : "text-primary"}`}>
                {item.value}
              </span>
              {item.sub && (
                <span className={`text-xs ${item.warn ? "text-accent-red" : "text-muted"}`}>{item.sub}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile — Toss style */}
      <div className="md:hidden px-5 py-6 space-y-5">
        {/* Pie chart section */}
        {stocks.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            <PieChart
              data={chartData}
              size={180}
              centerLabel="총 투자금"
              centerValue={formatAmountShort(investmentAmount)}
            />
            {/* Legend */}
            <div className="w-full space-y-2">
              {chartData.map((item) => {
                const pos = categoryPositions.find((p) => p.category === item.label);
                return (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-foreground">{item.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {pos ? (pos.weight * 100).toFixed(1) + "%" : ""}
                      </span>
                      <span className="text-xs text-muted">
                        {pos ? formatNumber(pos.amount) + "원" : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Key metrics — Toss-style large cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-accent-green-bg rounded-2xl p-5 text-center">
            <div className="text-[11px] text-muted mb-2">예상 월배당</div>
            <div className="text-2xl font-bold text-accent-green">{formatNumber(estMonthlyDividend)}원</div>
          </div>
          <div className="bg-accent-green-bg rounded-2xl p-5 text-center">
            <div className="text-[11px] text-muted mb-2">예상 연배당</div>
            <div className="text-2xl font-bold text-accent-green">{formatNumber(estAnnualDividend)}원</div>
          </div>
        </div>
        {/* Secondary metrics — Toss ListRow style */}
        <div className="bg-table-hover rounded-2xl px-5 py-4">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-muted-foreground">종목 수</span>
            <span className="text-sm font-bold text-foreground">{stocks.length}개</span>
          </div>
          <div className="border-t border-card-border" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-muted-foreground">총 비중</span>
            <span className={`text-sm font-bold ${totalWeight > 1.001 ? "text-accent-red" : "text-foreground"}`}>
              {formatPercent(totalWeight)}
            </span>
          </div>
          <div className="border-t border-card-border" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-muted-foreground">가중평균 배당률</span>
            <span className="text-sm font-bold text-foreground">{formatPercent(weightedDividendRate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
