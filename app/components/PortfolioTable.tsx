"use client";

import { useState, useEffect, useRef } from "react";
import { PortfolioStock } from "@/app/lib/types";
import { getStockPrice } from "@/app/lib/naverFinance";
import { formatNumber, formatPercent } from "@/app/lib/portfolioCalc";
import { CATEGORY_BG_COLORS } from "@/app/lib/constants";

interface PortfolioTableProps {
  stocks: PortfolioStock[];
  onUpdate: (stocks: PortfolioStock[]) => void;
  onAddClick: () => void;
  onEditClick: (stock: PortfolioStock) => void;
}

export default function PortfolioTable({
  stocks,
  onUpdate,
  onAddClick,
  onEditClick,
}: PortfolioTableProps) {
  const [loadingCodes, setLoadingCodes] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState("");
  const autoRefreshDone = useRef(false);

  useEffect(() => {
    if (stocks.length > 0 && !autoRefreshDone.current) {
      autoRefreshDone.current = true;
      refreshAllPrices();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalWeight = stocks.reduce((sum, s) => sum + s.targetWeight, 0);
  const weightOver = totalWeight > 1.001;

  const deleteStock = (id: string) => {
    onUpdate(stocks.filter((s) => s.id !== id));
  };

  const refreshPrice = async (stock: PortfolioStock) => {
    setLoadingCodes((prev) => new Set(prev).add(stock.code));
    setErrorMsg("");
    try {
      const result = await getStockPrice(stock.code);
      const updated = stocks.map((s) =>
        s.id === stock.id ? { ...s, currentPrice: result.price } : s
      );
      onUpdate(updated);
    } catch {
      setErrorMsg(`${stock.name} 현재가 조회 실패`);
    } finally {
      setLoadingCodes((prev) => {
        const next = new Set(prev);
        next.delete(stock.code);
        return next;
      });
    }
  };

  const refreshAllPrices = async () => {
    setErrorMsg("");
    const codes = stocks.map((s) => s.code);
    setLoadingCodes(new Set(codes));
    const updatedStocks = [...stocks];
    await Promise.all(
      stocks.map(async (stock, i) => {
        try {
          const result = await getStockPrice(stock.code);
          updatedStocks[i] = { ...stock, currentPrice: result.price };
        } catch {
          // keep existing price
        } finally {
          setLoadingCodes((prev) => {
            const next = new Set(prev);
            next.delete(stock.code);
            return next;
          });
        }
      })
    );
    onUpdate(updatedStocks);
  };

  return (
    <div className="bg-card-bg rounded-xl md:rounded-xl rounded-2xl md:border border-card-border overflow-hidden md:shadow-none shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-primary">자산배분 전략</h2>
          {weightOver && (
            <span className="text-xs font-medium text-accent-red bg-accent-red-bg px-2 py-0.5 rounded-full">
              비중 합계 {formatPercent(totalWeight)} 초과
            </span>
          )}
          {!weightOver && stocks.length > 0 && (
            <span className="hidden md:inline text-xs text-muted">
              비중 합계: {formatPercent(totalWeight)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {stocks.length > 0 && (
            <button
              onClick={refreshAllPrices}
              aria-label="전체 시세 갱신"
              className="text-xs px-3 py-1.5 rounded-lg border border-card-border hover:bg-table-hover text-muted-foreground transition-colors"
            >
              <span className="hidden md:inline">전체 시세 갱신</span>
              <span className="md:hidden">갱신</span>
            </button>
          )}
          <button
            onClick={onAddClick}
            className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-fg hover:bg-primary/90 font-medium transition-colors"
          >
            + <span className="hidden md:inline">종목 </span>추가
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="px-5 py-2 bg-accent-red-bg text-accent-red text-xs border-b border-accent-red/20">
          {errorMsg}
        </div>
      )}

      {stocks.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-muted">
          <p className="text-sm">아직 종목이 없습니다.</p>
          <button
            onClick={onAddClick}
            className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-fg hover:bg-primary/90 font-medium transition-colors"
          >
            첫 종목 추가하기
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div data-testid="desktop-table" className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-primary text-primary-fg">
                  <th className="px-3 py-3 text-left font-semibold">구분</th>
                  <th className="px-3 py-3 text-left font-semibold">ETF 종목명</th>
                  <th className="px-3 py-3 text-center font-semibold">종목코드</th>
                  <th className="px-3 py-3 text-center font-semibold">목표비중</th>
                  <th className="px-3 py-3 text-center font-semibold">연배당률</th>
                  <th className="px-3 py-3 text-right font-semibold">현재가</th>
                  <th className="px-3 py-3 text-left font-semibold">전략특성</th>
                  <th className="px-3 py-3 text-center font-semibold">시세</th>
                  <th className="px-3 py-3 text-center font-semibold">삭제</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => {
                  const isLoading = loadingCodes.has(stock.code);
                  return (
                    <tr
                      key={stock.id}
                      onDoubleClick={() => onEditClick(stock)}
                      className="border-t border-card-border hover:bg-table-hover/50 cursor-pointer"
                    >
                      <td className="px-3 py-3">
                        {stock.category}
                      </td>
                      <td className="px-3 py-3 font-medium text-foreground">
                        {stock.name}
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-muted-foreground">
                        {stock.code}
                      </td>
                      <td className={`px-3 py-3 text-center${weightOver ? " text-accent-red" : ""}`}>
                        {formatPercent(stock.targetWeight)}
                      </td>
                      <td className="px-3 py-3 text-center text-accent-green">
                        {formatPercent(stock.dividendRate)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {isLoading ? (
                          <span className="inline-block w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        ) : stock.currentPrice ? (
                          formatNumber(stock.currentPrice) + "원"
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground max-w-xs truncate">
                        {stock.strategy || "-"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            refreshPrice(stock);
                          }}
                          disabled={isLoading}
                          title="현재가 조회"
                          className="text-muted hover:text-primary disabled:opacity-30 transition-colors"
                        >
                          {isLoading ? (
                            <span className="inline-block w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          ) : (
                            "↻"
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteStock(stock.id);
                          }}
                          className="text-muted hover:text-accent-red transition-colors font-medium"
                          title="삭제"
                        >
                          x
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list — Toss ListRow style */}
          <div className="md:hidden divide-y divide-card-border">
            {stocks.map((stock) => {
              const isLoading = loadingCodes.has(stock.code);
              const dotColor = CATEGORY_BG_COLORS[stock.category] || "bg-primary";
              return (
                <div
                  key={stock.id}
                  onClick={() => onEditClick(stock)}
                  className="flex items-center gap-3.5 px-5 py-5 active:bg-table-hover/50 cursor-pointer transition-colors"
                >
                  {/* Left: colored category circle */}
                  <div className={`w-11 h-11 rounded-full ${dotColor} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-[10px] font-bold text-white leading-none">{stock.category}</span>
                  </div>
                  {/* Center: name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-foreground truncate">{stock.name}</div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="font-mono">{stock.code}</span>
                      <span>·</span>
                      <span className={weightOver ? "text-accent-red font-medium" : ""}>{formatPercent(stock.targetWeight)}</span>
                      <span>·</span>
                      <span className="text-accent-green font-medium">{formatPercent(stock.dividendRate)}</span>
                    </div>
                  </div>
                  {/* Right: price + chevron */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-[15px] font-bold">
                        {isLoading ? (
                          <span className="inline-block w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        ) : stock.currentPrice ? (
                          formatNumber(stock.currentPrice) + "원"
                        ) : (
                          <span className="text-muted text-xs">-</span>
                        )}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-muted/50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {stocks.length > 0 && (
        <div className="px-4 sm:px-5 py-3 border-t border-card-border text-xs text-muted">
          <span className="hidden md:inline">행 더블클릭으로 종목 수정</span>
          <span className="md:hidden">종목 탭하여 수정</span>
        </div>
      )}
    </div>
  );
}
