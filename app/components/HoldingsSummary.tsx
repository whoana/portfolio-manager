"use client";

import { HoldingItem } from "@/app/lib/types";
import { formatNumber } from "@/app/lib/portfolioCalc";
import { evaluateAllHoldings, calcCategoryEvaluations } from "@/app/lib/holdingsCalc";
import PieChart from "./PieChart";
import { CATEGORY_COLORS } from "@/app/lib/constants";

interface HoldingsSummaryProps {
  items: HoldingItem[];
}

export default function HoldingsSummary({ items }: HoldingsSummaryProps) {
  const { totalInvest, totalEval, totalProfitLoss, totalReturnRate } = evaluateAllHoldings(items);
  const categoryEvals = calcCategoryEvaluations(items);

  const chartData = categoryEvals.map((ce, i) => ({
    label: ce.category,
    value: ce.evalAmount,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const formatAmountShort = (amount: number): string => {
    if (amount >= 100_000_000) {
      const eok = amount / 100_000_000;
      return eok % 1 === 0 ? `${eok}억원` : `${eok.toFixed(1)}억원`;
    }
    if (amount >= 10_000) {
      const man = Math.round(amount / 10_000);
      return `${formatNumber(man)}만원`;
    }
    return `${formatNumber(amount)}원`;
  };

  const profitColor = (value: number) =>
    value > 0 ? "text-accent-red" : value < 0 ? "text-blue-500" : "text-muted-foreground";

  const formatPL = (value: number) => {
    if (value > 0) return `+${formatNumber(value)}`;
    return formatNumber(value);
  };

  const formatRate = (rate: number) => {
    const pct = (rate * 100).toFixed(2);
    return rate > 0 ? `+${pct}%` : `${pct}%`;
  };

  return (
    <div className="bg-card-bg rounded-2xl md:rounded-xl md:border border-card-border overflow-hidden shadow-sm md:shadow-none">
      <div className="px-5 py-3 sm:py-4 border-b border-card-border">
        <h2 className="text-sm font-bold text-primary">보유 현황 요약</h2>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block px-5 py-4">
        <div className="flex items-center gap-8 mb-6 pb-6 border-b border-card-border">
          <PieChart
            data={chartData}
            size={180}
            centerLabel="총 평가액"
            centerValue={formatAmountShort(totalEval)}
          />
          <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-3">
            {chartData.map((item) => {
              const ce = categoryEvals.find((c) => c.category === item.label);
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
                        {ce && totalEval > 0 ? ((ce.evalAmount / totalEval) * 100).toFixed(1) + "%" : ""}
                      </span>
                    </div>
                    <div className="text-xs text-muted">
                      {ce ? formatNumber(ce.evalAmount) + "원" : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">투자원금</span>
            <span className="text-lg font-bold text-primary">{formatNumber(totalInvest)}원</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">평가액</span>
            <span className="text-lg font-bold text-primary">{formatNumber(totalEval)}원</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">총 손익</span>
            <span className={`text-lg font-bold ${profitColor(totalProfitLoss)}`}>
              {formatPL(totalProfitLoss)}원
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">총 수익률</span>
            <span className={`text-lg font-bold ${profitColor(totalReturnRate)}`}>
              {formatRate(totalReturnRate)}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile — Toss style */}
      <div className="md:hidden px-5 py-6 space-y-5">
        {/* Pie chart */}
        <div className="flex flex-col items-center gap-4">
          <PieChart
            data={chartData}
            size={180}
            centerLabel="총 평가액"
            centerValue={formatAmountShort(totalEval)}
          />
          {/* Legend */}
          <div className="w-full space-y-2">
            {chartData.map((item) => {
              const ce = categoryEvals.find((c) => c.category === item.label);
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
                      {ce && totalEval > 0 ? ((ce.evalAmount / totalEval) * 100).toFixed(1) + "%" : ""}
                    </span>
                    <span className="text-xs text-muted">
                      {ce ? formatNumber(ce.evalAmount) + "원" : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/5 rounded-2xl p-5 text-center">
            <div className="text-[11px] text-muted mb-2">투자원금</div>
            <div className="text-xl font-bold text-primary">{formatAmountShort(totalInvest)}</div>
          </div>
          <div className="bg-primary/5 rounded-2xl p-5 text-center">
            <div className="text-[11px] text-muted mb-2">평가액</div>
            <div className="text-xl font-bold text-primary">{formatAmountShort(totalEval)}</div>
          </div>
        </div>
        {/* P&L row */}
        <div className="bg-table-hover rounded-2xl px-5 py-4">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-muted-foreground">총 손익</span>
            <span className={`text-sm font-bold ${profitColor(totalProfitLoss)}`}>
              {formatPL(totalProfitLoss)}원
            </span>
          </div>
          <div className="border-t border-card-border" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-muted-foreground">총 수익률</span>
            <span className={`text-sm font-bold ${profitColor(totalReturnRate)}`}>
              {formatRate(totalReturnRate)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
