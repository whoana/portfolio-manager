"use client";

import { useState, useEffect, useRef } from "react";
import { PortfolioStock } from "@/app/lib/types";
import { getStockPrice } from "@/app/lib/naverFinance";
import { formatNumber, formatPercent } from "@/app/lib/portfolioCalc";

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
    <div className="bg-card-bg rounded-xl border border-card-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-primary">자산배분 전략</h2>
          {weightOver && (
            <span className="text-xs font-medium text-accent-red bg-accent-red-bg px-2 py-0.5 rounded-full">
              비중 합계 {formatPercent(totalWeight)} 초과
            </span>
          )}
          {!weightOver && stocks.length > 0 && (
            <span className="text-xs text-muted">
              비중 합계: {formatPercent(totalWeight)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {stocks.length > 0 && (
            <button
              onClick={refreshAllPrices}
              className="text-xs px-3 py-1.5 rounded-lg border border-card-border hover:bg-table-hover text-muted-foreground transition-colors"
            >
              전체 시세 갱신
            </button>
          )}
          <button
            onClick={onAddClick}
            className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-fg hover:bg-primary/90 font-medium transition-colors"
          >
            + 종목 추가
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

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-card-border">
            {stocks.map((stock) => {
              const isLoading = loadingCodes.has(stock.code);
              return (
                <div
                  key={stock.id}
                  onClick={() => onEditClick(stock)}
                  className="px-4 py-3 active:bg-table-hover/50 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-medium text-primary-fg bg-primary px-1.5 py-0.5 rounded flex-shrink-0">
                        {stock.category}
                      </span>
                      <span className="text-xs font-medium text-foreground truncate">{stock.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteStock(stock.id);
                      }}
                      className="text-muted hover:text-accent-red text-xs ml-2 flex-shrink-0"
                    >
                      x
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="font-mono">{stock.code}</span>
                      <span className={weightOver ? "text-accent-red" : ""}>{formatPercent(stock.targetWeight)}</span>
                      <span className="text-accent-green">{formatPercent(stock.dividendRate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">
                        {isLoading ? (
                          <span className="inline-block w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        ) : stock.currentPrice ? (
                          formatNumber(stock.currentPrice) + "원"
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          refreshPrice(stock);
                        }}
                        disabled={isLoading}
                        className="text-muted hover:text-primary disabled:opacity-30 text-sm"
                      >
                        ↻
                      </button>
                    </div>
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
