"use client";

import { Portfolio } from "@/app/lib/types";
import { formatPercent, formatNumber } from "@/app/lib/portfolioCalc";

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
    <div className="bg-card-bg rounded-xl border border-card-border overflow-hidden">
      <div className="px-5 py-4 border-b border-card-border">
        <h2 className="text-sm font-bold text-primary">포트폴리오 요약</h2>
      </div>

      <div className="px-5 py-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
          {statsItems.map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <span className="text-xs text-muted">{item.label}</span>
              <span
                className={`text-lg font-bold ${
                  item.warn ? "text-accent-red" : "text-primary"
                }`}
              >
                {item.value}
              </span>
              {item.sub && (
                <span
                  className={`text-xs ${item.warn ? "text-accent-red" : "text-muted"}`}
                >
                  {item.sub}
                </span>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
