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

type SortKey = "year" | "assetValue" | "totalInvested" | "annualDividend" | "monthlyDividend" | "dividendRate";
type SortDir = "asc" | "desc";

const SORT_LABELS: Record<SortKey, string> = {
  year: "연차",
  assetValue: "평가금",
  totalInvested: "누적투자금",
  annualDividend: "연배당금",
  monthlyDividend: "월배당금",
  dividendRate: "배당률",
};

export default function GrowthReport({ portfolio }: GrowthReportProps) {
  const [params, setParams] = useState<GrowthParams>(DEFAULT_GROWTH_PARAMS);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

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

  const sortedRows = (() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const cmp = a[sortKey] - b[sortKey];
      return sortDir === "asc" ? cmp : -cmp;
    });
  })();

  return (
    <div className="bg-card-bg rounded-2xl md:rounded-xl md:border border-card-border overflow-hidden shadow-sm md:shadow-none">
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-card-border">
        <h2 className="text-base font-bold text-primary mb-3 md:mb-0">
          자산성장 전망 (1~10년)
        </h2>
        {/* Parameter Inputs — Toss-style cards on mobile */}
        <div className="grid grid-cols-3 md:flex md:flex-wrap md:items-center gap-2 md:gap-x-4 md:gap-y-2 md:justify-end md:mt-0 mt-3">
          <div className="md:flex md:items-center md:gap-1.5 bg-table-hover md:bg-transparent rounded-xl md:rounded-none px-3 md:px-0 py-2.5 md:py-0 text-center md:text-left">
            <label className="text-xs md:text-xs text-muted-foreground block md:inline md:whitespace-nowrap mb-1 md:mb-0">배당성장</label>
            <div className="flex items-center justify-center md:justify-start gap-0.5">
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
                className="w-14 md:w-16 px-1.5 md:px-2 py-1 text-xs text-right border border-input-border rounded-lg md:rounded focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary bg-input-highlight"
              />
              <span className="text-xs text-muted">%</span>
            </div>
          </div>

          <div className="md:flex md:items-center md:gap-1.5 bg-table-hover md:bg-transparent rounded-xl md:rounded-none px-3 md:px-0 py-2.5 md:py-0 text-center md:text-left">
            <label className="text-xs md:text-xs text-muted-foreground block md:inline md:whitespace-nowrap mb-1 md:mb-0">추가투자</label>
            <div className="flex items-center justify-center md:justify-start gap-0.5">
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
                className="w-20 md:w-28 px-1.5 md:px-2 py-1 text-xs text-right border border-input-border rounded-lg md:rounded focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary bg-input-highlight"
              />
              <span className="text-xs text-muted">원</span>
            </div>
          </div>

          <div className="md:flex md:items-center md:gap-1.5 bg-table-hover md:bg-transparent rounded-xl md:rounded-none px-3 md:px-0 py-2.5 md:py-0 text-center md:text-left">
            <label className="text-xs md:text-xs text-muted-foreground block md:inline md:whitespace-nowrap mb-1 md:mb-0">자산상승</label>
            <div className="flex items-center justify-center md:justify-start gap-0.5">
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
                className="w-14 md:w-16 px-1.5 md:px-2 py-1 text-xs text-right border border-input-border rounded-lg md:rounded focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary bg-input-highlight"
              />
              <span className="text-xs text-muted">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-primary text-primary-fg">
              <th className="px-3 py-3 text-center font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("year")}>연차{sortIndicator("year")}</th>
              <th className="px-3 py-3 text-right font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("assetValue")}>평가금{sortIndicator("assetValue")}</th>
              <th className="px-3 py-3 text-right font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("totalInvested")}>누적투자금{sortIndicator("totalInvested")}</th>
              <th className="px-3 py-3 text-right font-semibold bg-thead-accent cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("annualDividend")}>연배당금{sortIndicator("annualDividend")}</th>
              <th className="px-3 py-3 text-right font-semibold bg-thead-accent cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("monthlyDividend")}>월배당금{sortIndicator("monthlyDividend")}</th>
              <th className="px-3 py-3 text-center font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("dividendRate")}>배당률{sortIndicator("dividendRate")}</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
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

      {/* Mobile sort chips */}
      <div className="md:hidden flex items-center gap-2 px-5 py-2.5 overflow-x-auto border-b border-card-border bg-table-hover/30">
        {(["year", "assetValue", "annualDividend", "monthlyDividend", "dividendRate"] as SortKey[]).map((key) => (
          <button
            key={key}
            onClick={() => toggleSort(key)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              sortKey === key
                ? "bg-primary text-primary-fg border-primary font-bold"
                : "bg-card-bg text-muted-foreground border-card-border"
            }`}
          >
            {SORT_LABELS[key]}{sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
          </button>
        ))}
      </div>

      {/* Mobile card list — Toss style with progress */}
      <div className="md:hidden divide-y divide-card-border">
        {sortedRows.map((row) => {
          const maxAsset = rows[rows.length - 1]?.assetValue || 1;
          const barWidth = Math.max(8, (row.assetValue / maxAsset) * 100);
          const isLast = row.year === rows[rows.length - 1]?.year;
          return (
            <div key={row.year} className={`px-5 py-[18px] ${isLast ? "bg-primary/5" : ""}`}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${isLast ? "bg-primary" : "bg-primary/10"}`}>
                    <span className={`text-sm font-bold ${isLast ? "text-primary-fg" : "text-primary"}`}>{row.year}</span>
                  </div>
                  <span className={`text-[17px] font-medium text-foreground ${isLast ? "font-bold" : ""}`}>{row.year}년차</span>
                </div>
                <span className={`text-[17px] font-bold ${isLast ? "text-primary" : ""}`}>{formatNumber(row.assetValue)}원</span>
              </div>
              {/* Progress bar */}
              <div className="ml-[58px] mb-2.5">
                <div className="h-2 bg-card-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isLast ? "bg-primary" : "bg-primary/40"}`} style={{ width: `${barWidth}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-3 text-[13px] ml-[58px]">
                <span className="text-muted-foreground">누적 {formatNumber(row.totalInvested)}원</span>
                <span className="text-accent-green font-medium">월 {formatNumber(row.monthlyDividend)}원</span>
                <span className="text-muted-foreground">{formatPercent(row.dividendRate)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="px-4 sm:px-5 py-3 bg-table-hover border-t border-card-border text-xs text-muted">
        초기 가중평균 배당률 {formatPercent(weightedDividendRate)} 기준 &middot; 초기 투자금{" "}
        {formatNumber(portfolio.investmentAmount)}원 &middot; 매년 배당성장율/자산상승율 복리 적용
      </div>
    </div>
  );
}
