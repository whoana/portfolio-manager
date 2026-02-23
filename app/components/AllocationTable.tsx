"use client";

import { useState } from "react";
import { Portfolio } from "@/app/lib/types";
import { calcStockAllocation, formatNumber, formatPercent } from "@/app/lib/portfolioCalc";

interface AllocationTableProps {
  portfolio: Portfolio;
  onInvestmentAmountChange: (amount: number) => void;
}

export default function AllocationTable({
  portfolio,
  onInvestmentAmountChange,
}: AllocationTableProps) {
  const [inputValue, setInputValue] = useState(
    portfolio.investmentAmount.toLocaleString("ko-KR")
  );

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

  const calcResults = stocks.map((stock) => ({
    stock,
    calc: calcStockAllocation(stock, investmentAmount),
  }));

  const totals = calcResults.reduce(
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
        <h2 className="text-sm font-bold text-primary mb-3">투자금액별 구성표</h2>
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
              <th className="px-3 py-3 text-left font-semibold">구분</th>
              <th className="px-3 py-3 text-left font-semibold">ETF 종목명</th>
              <th className="px-3 py-3 text-right font-semibold">현재가</th>
              <th className="px-3 py-3 text-center font-semibold">비중</th>
              <th className="px-3 py-3 text-right font-semibold">투자금액</th>
              <th className="px-3 py-3 text-right font-semibold">매수수량</th>
              <th className="px-3 py-3 text-right font-semibold">실투자금액</th>
              <th className="px-3 py-3 text-right font-semibold bg-thead-accent">월배당</th>
              <th className="px-3 py-3 text-right font-semibold bg-thead-accent">연배당</th>
              <th className="px-3 py-3 text-center font-semibold">배당률</th>
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

      {/* Mobile card list — Toss style enlarged */}
      <div className="md:hidden divide-y divide-card-border">
        {calcResults.map(({ stock, calc }) => (
          <div key={stock.id} className="px-5 py-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-bold text-primary leading-none">{stock.category}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-foreground truncate">{stock.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{formatPercent(stock.targetWeight)} · {stock.currentPrice ? formatNumber(calc.quantity) + "주" : "현재가 필요"}</div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[15px] font-bold">{formatNumber(calc.investAmount)}원</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs ml-[52px]">
              <div className="flex-1 bg-accent-green-bg rounded-xl px-3 py-2.5 text-center">
                <div className="text-[10px] text-muted mb-0.5">월배당</div>
                <div className="text-sm font-bold text-accent-green">{formatNumber(calc.monthlyDividend)}원</div>
              </div>
              <div className="flex-1 bg-accent-green-bg rounded-xl px-3 py-2.5 text-center">
                <div className="text-[10px] text-muted mb-0.5">연배당</div>
                <div className="text-sm font-bold text-accent-green">{formatNumber(calc.annualDividend)}원</div>
              </div>
            </div>
          </div>
        ))}
        {/* Mobile totals — Toss style large summary */}
        <div className="px-5 py-6 bg-primary/5">
          <div className="text-xs font-bold text-primary mb-4">합계</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] text-muted mb-1">총 투자금액</div>
              <div className="text-lg font-bold text-primary">{formatNumber(totals.investAmount)}원</div>
            </div>
            <div>
              <div className="text-[11px] text-muted mb-1">총 매수수량</div>
              <div className="text-lg font-bold text-primary font-mono">{formatNumber(totals.quantity)}주</div>
            </div>
            <div>
              <div className="text-[11px] text-muted mb-1">월배당 합계</div>
              <div className="text-lg font-bold text-accent-green">{formatNumber(totals.monthlyDividend)}원</div>
            </div>
            <div>
              <div className="text-[11px] text-muted mb-1">연배당 합계</div>
              <div className="text-lg font-bold text-accent-green">{formatNumber(totals.annualDividend)}원</div>
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
