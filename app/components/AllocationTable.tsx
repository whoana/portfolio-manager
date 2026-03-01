"use client";

import { useState } from "react";
import { Portfolio } from "@/app/lib/types";
import { calcStockAllocation, formatNumber, formatPercent } from "@/app/lib/portfolioCalc";

interface AllocationTableProps {
  portfolio: Portfolio;
  onInvestmentAmountChange: (amount: number) => void;
}

type SortKey = "category" | "name" | "currentPrice" | "targetWeight" | "investAmount" | "quantity" | "monthlyDividend" | "annualDividend" | "dividendRate";
type SortDir = "asc" | "desc";

const SORT_LABELS: Record<SortKey, string> = {
  category: "구분",
  name: "종목명",
  currentPrice: "현재가",
  targetWeight: "비중",
  investAmount: "투자금액",
  quantity: "수량",
  monthlyDividend: "월배당",
  annualDividend: "연배당",
  dividendRate: "배당률",
};

export default function AllocationTable({
  portfolio,
  onInvestmentAmountChange,
}: AllocationTableProps) {
  const [inputValue, setInputValue] = useState(
    portfolio.investmentAmount.toLocaleString("ko-KR")
  );
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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "");
    if (raw === "" || /^\d+$/.test(raw)) {
      setInputValue(raw ? Number(raw).toLocaleString("ko-KR") : "");
      const num = parseInt(raw || "0", 10);
      if (!isNaN(num) && num >= 0) {
        onInvestmentAmountChange(num);
      }
    }
  };

  const { stocks, investmentAmount } = portfolio;

  if (stocks.length === 0) {
    return (
      <div className="bg-card-bg rounded-xl border border-card-border px-6 py-12 text-center text-muted text-sm">
        종목을 추가하면 투자금액별 계산표가 표시됩니다.
      </div>
    );
  }

  const calcResultsRaw = stocks.map((stock) => ({
    stock,
    calc: calcStockAllocation(stock, investmentAmount),
  }));

  const calcResults = (() => {
    if (!sortKey) return calcResultsRaw;
    return [...calcResultsRaw].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "category" || sortKey === "name") {
        cmp = a.stock[sortKey].localeCompare(b.stock[sortKey]);
      } else if (sortKey === "currentPrice" || sortKey === "targetWeight" || sortKey === "dividendRate") {
        cmp = (a.stock[sortKey] || 0) - (b.stock[sortKey] || 0);
      } else {
        cmp = (a.calc[sortKey] || 0) - (b.calc[sortKey] || 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  })();

  const totals = calcResultsRaw.reduce(
    (acc, { calc }) => ({
      investAmount: acc.investAmount + calc.investAmount,
      quantity: acc.quantity + calc.quantity,
      actualAmount: acc.actualAmount + calc.actualAmount,
      monthlyDividend: acc.monthlyDividend + calc.monthlyDividend,
      annualDividend: acc.annualDividend + calc.annualDividend,
    }),
    { investAmount: 0, quantity: 0, actualAmount: 0, monthlyDividend: 0, annualDividend: 0 }
  );

  const totalWeight = stocks.reduce((sum, s) => sum + s.targetWeight, 0);
  const avgDividendRate =
    totals.actualAmount > 0 ? totals.annualDividend / totals.actualAmount : 0;

  return (
    <div className="bg-card-bg rounded-2xl md:rounded-xl md:border border-card-border overflow-hidden shadow-sm md:shadow-none">
      <div className="px-5 py-4 border-b border-card-border">
        <h2 className="text-base font-bold text-primary mb-3">투자금액별 구성표</h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            투자금액:
          </label>
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={handleAmountChange}
              className="px-3 py-2.5 pr-6 text-sm font-bold border border-input-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-40 sm:w-48 text-right bg-input-highlight"
              placeholder="0"
            />
            <span className="absolute right-2.5 top-3 text-muted text-xs">원</span>
          </div>
          <span className="text-xs text-muted">
            (= {(investmentAmount / 100000000).toFixed(1)}억원)
          </span>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-primary text-primary-fg">
              <th className="px-3 py-3 text-left font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("category")}>구분{sortIndicator("category")}</th>
              <th className="px-3 py-3 text-left font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("name")}>ETF 종목명{sortIndicator("name")}</th>
              <th className="px-3 py-3 text-right font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("currentPrice")}>현재가{sortIndicator("currentPrice")}</th>
              <th className="px-3 py-3 text-center font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("targetWeight")}>비중{sortIndicator("targetWeight")}</th>
              <th className="px-3 py-3 text-right font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("investAmount")}>투자금액{sortIndicator("investAmount")}</th>
              <th className="px-3 py-3 text-right font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("quantity")}>매수수량{sortIndicator("quantity")}</th>
              <th className="px-3 py-3 text-right font-semibold">실투자금액</th>
              <th className="px-3 py-3 text-right font-semibold bg-thead-accent cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("monthlyDividend")}>월배당{sortIndicator("monthlyDividend")}</th>
              <th className="px-3 py-3 text-right font-semibold bg-thead-accent cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("annualDividend")}>연배당{sortIndicator("annualDividend")}</th>
              <th className="px-3 py-3 text-center font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("dividendRate")}>배당률{sortIndicator("dividendRate")}</th>
            </tr>
          </thead>
          <tbody>
            {calcResults.map(({ stock, calc }) => (
              <tr key={stock.id} className="border-t border-card-border hover:bg-table-hover/50">
                <td className="px-3 py-3">{stock.category}</td>
                <td className="px-3 py-3 font-medium text-foreground">{stock.name}</td>
                <td className="px-3 py-3 text-right">
                  {stock.currentPrice ? (
                    formatNumber(stock.currentPrice) + "원"
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td className="px-3 py-3 text-center">{formatPercent(stock.targetWeight)}</td>
                <td className="px-3 py-3 text-right">{formatNumber(calc.investAmount)}원</td>
                <td className="px-3 py-3 text-right font-mono">
                  {stock.currentPrice ? (
                    formatNumber(calc.quantity) + "주"
                  ) : (
                    <span className="text-muted">현재가 필요</span>
                  )}
                </td>
                <td className="px-3 py-3 text-right">{formatNumber(calc.actualAmount)}원</td>
                <td className="px-3 py-3 text-right bg-accent-green-bg text-accent-green">
                  {formatNumber(calc.monthlyDividend)}원
                </td>
                <td className="px-3 py-3 text-right bg-accent-green-bg text-accent-green">
                  {formatNumber(calc.annualDividend)}원
                </td>
                <td className="px-3 py-3 text-center">{formatPercent(stock.dividendRate)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-primary/10 border-t-2 border-primary/30 font-bold">
              <td className="px-3 py-3 text-primary" colSpan={2}>
                합계
              </td>
              <td className="px-3 py-3" />
              <td className="px-3 py-3 text-center text-primary">
                {formatPercent(totalWeight)}
              </td>
              <td className="px-3 py-3 text-right text-primary">
                {formatNumber(totals.investAmount)}원
              </td>
              <td className="px-3 py-3 text-right text-primary">
                {formatNumber(totals.quantity)}주
              </td>
              <td className="px-3 py-3 text-right text-primary">
                {formatNumber(totals.actualAmount)}원
              </td>
              <td className="px-3 py-3 text-right text-accent-green bg-accent-green-bg">
                {formatNumber(totals.monthlyDividend)}원
              </td>
              <td className="px-3 py-3 text-right text-accent-green bg-accent-green-bg">
                {formatNumber(totals.annualDividend)}원
              </td>
              <td className="px-3 py-3 text-center text-primary">
                {formatPercent(avgDividendRate)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile sort chips */}
      <div className="md:hidden flex items-center gap-2 px-5 py-2.5 overflow-x-auto border-b border-card-border bg-table-hover/30">
        {(["category", "name", "targetWeight", "investAmount", "annualDividend", "dividendRate"] as SortKey[]).map((key) => (
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

      {/* Mobile card list — 3-line layout */}
      <div className="md:hidden divide-y divide-card-border">
        {calcResults.map(({ stock, calc }) => {
          const catLines = stock.category.length > 2
            ? [stock.category.slice(0, Math.ceil(stock.category.length / 2)), stock.category.slice(Math.ceil(stock.category.length / 2))]
            : [stock.category];
          return (
            <div key={stock.id} className="px-5 py-[18px]">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0 mt-0.5">
                  {catLines.map((line, i) => (
                    <span key={i} className="text-[11px] font-bold text-primary leading-tight">{line}</span>
                  ))}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Line 1: stock name */}
                  <div className="text-[17px] font-semibold text-foreground truncate">{stock.name}</div>
                  {/* Line 2: investment amount right-aligned */}
                  <div className="text-[17px] font-bold text-foreground text-right">{formatNumber(calc.investAmount)}원</div>
                  {/* Line 3: weight · quantity */}
                  <div className="text-[13px] text-muted-foreground">
                    {formatPercent(stock.targetWeight)} · {stock.currentPrice ? formatNumber(calc.quantity) + "주" : "현재가 필요"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-[72px]">
                <div className="flex-1 bg-accent-green-bg rounded-xl px-3 py-3 text-center">
                  <div className="text-xs text-muted mb-1">월배당</div>
                  <div className="text-base font-bold text-accent-green">{formatNumber(calc.monthlyDividend)}원</div>
                </div>
                <div className="flex-1 bg-accent-green-bg rounded-xl px-3 py-3 text-center">
                  <div className="text-xs text-muted mb-1">연배당</div>
                  <div className="text-base font-bold text-accent-green">{formatNumber(calc.annualDividend)}원</div>
                </div>
              </div>
            </div>
          );
        })}
        {/* Mobile totals — Toss style large summary */}
        <div className="px-5 py-6 bg-primary/5">
          <div className="text-sm font-bold text-primary mb-4">합계</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted mb-1">총 투자금액</div>
              <div className="text-xl font-bold text-primary">{formatNumber(totals.investAmount)}원</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">총 매수수량</div>
              <div className="text-xl font-bold text-primary font-mono">{formatNumber(totals.quantity)}주</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">월배당 합계</div>
              <div className="text-xl font-bold text-accent-green">{formatNumber(totals.monthlyDividend)}원</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">연배당 합계</div>
              <div className="text-xl font-bold text-accent-green">{formatNumber(totals.annualDividend)}원</div>
            </div>
          </div>
        </div>
      </div>

      {stocks.some((s) => !s.currentPrice) && (
        <div className="px-5 py-3 bg-warning-bg text-warning-fg text-xs border-t border-warning-border">
          일부 종목의 현재가가 없어 매수수량 및 실투자금액 계산이 정확하지 않을 수 있습니다.
          위 자산배분 전략 표에서 시세 갱신 버튼을 눌러주세요.
        </div>
      )}
    </div>
  );
}
