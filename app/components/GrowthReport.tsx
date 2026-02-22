"use client";

import { useState } from "react";
import { Portfolio } from "@/app/lib/types";
import { formatNumber, formatPercent } from "@/app/lib/portfolioCalc";
import {
  calcGrowthReport,
  DEFAULT_GROWTH_PARAMS,
  GrowthParams,
} from "@/app/lib/growthCalc";

interface GrowthReportProps {
  portfolio: Portfolio;
}

export default function GrowthReport({ portfolio }: GrowthReportProps) {
  const [params, setParams] = useState<GrowthParams>(DEFAULT_GROWTH_PARAMS);

  const { stocks } = portfolio;

  if (stocks.length === 0) {
    return null;
  }

  const totalWeight = stocks.reduce((sum, s) => sum + s.targetWeight, 0);
  const weightedDividendRate =
    stocks.reduce((sum, s) => sum + s.targetWeight * s.dividendRate, 0) /
    (totalWeight || 1);

  const rows = calcGrowthReport(
    portfolio.investmentAmount,
    weightedDividendRate,
    params
  );

  return (
    <div className="bg-card-bg rounded-xl border border-card-border overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-card-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-sm font-bold text-primary whitespace-nowrap">
          자산성장 전망 (1~10년)
        </h2>
        {/* Parameter Inputs */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 justify-end">
          {/* 연배당성장율 */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground whitespace-nowrap">연배당성장율</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={(params.dividendGrowthRate * 100).toFixed(1)}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) {
                  setParams((p) => ({ ...p, dividendGrowthRate: v / 100 }));
                }
              }}
              className="w-16 px-2 py-1 text-xs text-right border border-input-border rounded focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary bg-input-highlight"
            />
            <span className="text-xs text-muted">%</span>
          </div>

          {/* 연추가투자 */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground whitespace-nowrap">연추가투자</label>
            <input
              type="number"
              step="1000000"
              min="0"
              value={params.annualAddition}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v >= 0) {
                  setParams((p) => ({ ...p, annualAddition: v }));
                }
              }}
              className="w-28 px-2 py-1 text-xs text-right border border-input-border rounded focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary bg-input-highlight"
            />
            <span className="text-xs text-muted">원</span>
          </div>

          {/* 자산상승율 */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground whitespace-nowrap">자산상승율</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={(params.assetGrowthRate * 100).toFixed(1)}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) {
                  setParams((p) => ({ ...p, assetGrowthRate: v / 100 }));
                }
              }}
              className="w-16 px-2 py-1 text-xs text-right border border-input-border rounded focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary bg-input-highlight"
            />
            <span className="text-xs text-muted">%</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-primary text-primary-fg">
              <th className="px-3 py-3 text-center font-semibold">연차</th>
              <th className="px-3 py-3 text-right font-semibold">평가금</th>
              <th className="px-3 py-3 text-right font-semibold">누적투자금</th>
              <th className="px-3 py-3 text-right font-semibold bg-thead-accent">연배당금</th>
              <th className="px-3 py-3 text-right font-semibold bg-thead-accent">월배당금</th>
              <th className="px-3 py-3 text-center font-semibold">배당률</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.year} className="border-t border-card-border hover:bg-table-hover/50">
                <td className="px-3 py-3 text-xs text-center font-medium text-muted-foreground">
                  {row.year}년차
                </td>
                <td className="px-3 py-3 text-xs text-right">
                  {formatNumber(row.assetValue)}원
                </td>
                <td className="px-3 py-3 text-xs text-right text-muted-foreground">
                  {formatNumber(row.totalInvested)}원
                </td>
                <td className="px-3 py-3 text-xs text-right bg-accent-green-bg text-accent-green">
                  {formatNumber(row.annualDividend)}원
                </td>
                <td className="px-3 py-3 text-xs text-right bg-accent-green-bg text-accent-green">
                  {formatNumber(row.monthlyDividend)}원
                </td>
                <td className="px-3 py-3 text-xs text-center">
                  {formatPercent(row.dividendRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div className="px-5 py-3 bg-table-hover border-t border-card-border text-xs text-muted">
        초기 가중평균 배당률 {formatPercent(weightedDividendRate)} 기준 &middot; 초기 투자금{" "}
        {formatNumber(portfolio.investmentAmount)}원 &middot; 매년 배당성장율/자산상승율 복리 적용
      </div>
    </div>
  );
}
