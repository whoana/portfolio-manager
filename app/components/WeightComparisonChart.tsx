"use client";

import { useState } from "react";
import { PortfolioStock, HoldingItem } from "@/app/lib/types";
import { compareWeightsByCategory, compareWeightsByStock } from "@/app/lib/holdingsCalc";
import BarChart from "./BarChart";

interface WeightComparisonChartProps {
  stocks: PortfolioStock[];
  holdings: HoldingItem[];
}

export default function WeightComparisonChart({ stocks, holdings }: WeightComparisonChartProps) {
  const [mode, setMode] = useState<"category" | "stock">("category");

  const comparisons = mode === "category"
    ? compareWeightsByCategory(stocks, holdings)
    : compareWeightsByStock(stocks, holdings);

  const chartData = comparisons.map((c) => ({
    label: c.label,
    targetValue: c.targetWeight,
    actualValue: c.actualWeight,
  }));

  return (
    <div className="bg-card-bg rounded-2xl md:rounded-xl md:border border-card-border overflow-hidden shadow-sm md:shadow-none">
      <div className="flex items-center justify-between px-5 py-3 sm:py-4 border-b border-card-border">
        <h2 className="text-sm font-bold text-primary">목표 vs 실제 비중</h2>
        <div className="flex items-center rounded-lg bg-table-hover p-0.5">
          <button
            onClick={() => setMode("category")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === "category"
                ? "bg-card-bg text-primary shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            구분별
          </button>
          <button
            onClick={() => setMode("stock")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === "stock"
                ? "bg-card-bg text-primary shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            종목별
          </button>
        </div>
      </div>
      <div className="px-5 py-4">
        {chartData.length > 0 ? (
          <BarChart data={chartData} />
        ) : (
          <p className="text-sm text-muted text-center py-8">비교 데이터가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
