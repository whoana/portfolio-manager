"use client";

import { useState, useEffect, useRef } from "react";
import { HoldingItem } from "@/app/lib/types";
import { getStockPrice } from "@/app/lib/naverFinance";
import { formatNumber } from "@/app/lib/portfolioCalc";
import { evaluateHolding, evaluateAllHoldings } from "@/app/lib/holdingsCalc";
import { CATEGORY_BG_COLORS } from "@/app/lib/constants";

interface HoldingsTableProps {
  items: HoldingItem[];
  onUpdate: (items: HoldingItem[]) => void;
  onAddClick: () => void;
  onEditClick: (item: HoldingItem) => void;
  onCsvImportClick: () => void;
  onExportTemplate: () => void;
  onExportData: () => void;
}

type SortKey = "category" | "name" | "quantity" | "avgPrice" | "currentPrice" | "evalAmount" | "profitLoss" | "returnRate";
type SortDir = "asc" | "desc";

const SORT_LABELS: Record<SortKey, string> = {
  category: "구분",
  name: "종목명",
  quantity: "수량",
  avgPrice: "평단가",
  currentPrice: "현재가",
  evalAmount: "평가액",
  profitLoss: "손익",
  returnRate: "수익률",
};

export default function HoldingsTable({
  items,
  onUpdate,
  onAddClick,
  onEditClick,
  onCsvImportClick,
  onExportTemplate,
  onExportData,
}: HoldingsTableProps) {
  const [loadingCodes, setLoadingCodes] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const autoRefreshDone = useRef(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (items.length > 0 && !autoRefreshDone.current) {
      autoRefreshDone.current = true;
      refreshAllPrices();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const refreshPrice = async (item: HoldingItem) => {
    setLoadingCodes((prev) => new Set(prev).add(item.code));
    setErrorMsg("");
    try {
      const result = await getStockPrice(item.reutersCode || item.code);
      onUpdate(items.map((h) => h.id === item.id ? { ...h, currentPrice: result.price } : h));
    } catch {
      setErrorMsg(`${item.name} 현재가 조회 실패`);
    } finally {
      setLoadingCodes((prev) => { const next = new Set(prev); next.delete(item.code); return next; });
    }
  };

  const refreshAllPrices = async () => {
    setErrorMsg("");
    const codes = items.map((h) => h.code);
    setLoadingCodes(new Set(codes));
    const updated = [...items];
    await Promise.all(
      items.map(async (item, i) => {
        try {
          const result = await getStockPrice(item.reutersCode || item.code);
          updated[i] = { ...item, currentPrice: result.price };
        } catch {
          // keep existing
        } finally {
          setLoadingCodes((prev) => { const next = new Set(prev); next.delete(item.code); return next; });
        }
      })
    );
    onUpdate(updated);
  };

  const deleteItem = (id: string) => {
    onUpdate(items.filter((h) => h.id !== id));
  };

  const { totalInvest, totalEval, totalProfitLoss, totalReturnRate } = evaluateAllHoldings(items);

  // Sort items: user sort or default by category
  const sortedItems = (() => {
    if (!sortKey) return [...items].sort((a, b) => a.category.localeCompare(b.category));
    return [...items].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "category" || sortKey === "name") {
        cmp = a[sortKey].localeCompare(b[sortKey]);
      } else if (sortKey === "evalAmount") {
        cmp = (a.quantity * (a.currentPrice || 0)) - (b.quantity * (b.currentPrice || 0));
      } else if (sortKey === "profitLoss") {
        const plA = a.quantity * ((a.currentPrice || 0) - a.avgPrice);
        const plB = b.quantity * ((b.currentPrice || 0) - b.avgPrice);
        cmp = plA - plB;
      } else if (sortKey === "returnRate") {
        const invA = a.quantity * a.avgPrice;
        const invB = b.quantity * b.avgPrice;
        const rateA = invA > 0 ? (a.quantity * ((a.currentPrice || 0) - a.avgPrice)) / invA : 0;
        const rateB = invB > 0 ? (b.quantity * ((b.currentPrice || 0) - b.avgPrice)) / invB : 0;
        cmp = rateA - rateB;
      } else {
        cmp = (a[sortKey] || 0) - (b[sortKey] || 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  })();

  const formatProfitLoss = (value: number) => {
    if (value > 0) return `+${formatNumber(value)}`;
    if (value < 0) return formatNumber(value);
    return "0";
  };

  const formatReturnRate = (rate: number) => {
    const pct = (rate * 100).toFixed(2);
    if (rate > 0) return `+${pct}%`;
    if (rate < 0) return `${pct}%`;
    return "0.00%";
  };

  const profitColor = (value: number) =>
    value > 0 ? "text-accent-red" : value < 0 ? "text-blue-500" : "text-muted-foreground";

  return (
    <div className="bg-card-bg rounded-xl md:rounded-xl rounded-2xl md:border border-card-border overflow-hidden md:shadow-none shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
        <h2 className="text-base font-bold text-primary">보유 내역</h2>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={refreshAllPrices}
              aria-label="전체 시세 갱신"
              className="text-xs px-3 py-1.5 rounded-lg border border-card-border hover:bg-table-hover text-muted-foreground transition-colors"
            >
              <span className="hidden md:inline">시세 갱신</span>
              <span className="md:hidden">갱신</span>
            </button>
          )}
          <button
            onClick={onCsvImportClick}
            className="text-xs px-3 py-1.5 rounded-lg border border-card-border hover:bg-table-hover text-muted-foreground transition-colors"
          >
            <span className="hidden md:inline">CSV 가져오기</span>
            <span className="md:hidden">CSV</span>
          </button>
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="text-xs px-3 py-1.5 rounded-lg border border-card-border hover:bg-table-hover text-muted-foreground transition-colors flex items-center gap-1"
            >
              <span className="hidden md:inline">내보내기</span>
              <span className="md:hidden">내보내기</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-card-bg border border-card-border rounded-lg shadow-lg z-10">
                <button
                  onClick={() => { onExportTemplate(); setShowExportMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-table-hover transition-colors rounded-t-lg"
                >
                  빈 양식 내보내기
                </button>
                <button
                  onClick={() => { onExportData(); setShowExportMenu(false); }}
                  disabled={items.length === 0}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-table-hover transition-colors rounded-b-lg disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  데이터 내보내기
                </button>
              </div>
            )}
          </div>
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

      {items.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-muted">
          <p className="text-sm">아직 보유 내역이 없습니다.</p>
          <div className="flex gap-2">
            <button
              onClick={onAddClick}
              className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-fg hover:bg-primary/90 font-medium transition-colors"
            >
              종목 추가하기
            </button>
            <button
              onClick={onCsvImportClick}
              className="text-sm px-4 py-2 rounded-lg border border-card-border hover:bg-table-hover text-muted-foreground transition-colors"
            >
              CSV 가져오기
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-primary text-primary-fg">
                  <th className="px-3 py-3 text-left font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("category")}>구분{sortIndicator("category")}</th>
                  <th className="px-3 py-3 text-left font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("name")}>종목{sortIndicator("name")}</th>
                  <th className="px-3 py-3 text-center font-semibold">종목코드</th>
                  <th className="px-3 py-3 text-right font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("quantity")}>수량{sortIndicator("quantity")}</th>
                  <th className="px-3 py-3 text-right font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("avgPrice")}>평단가{sortIndicator("avgPrice")}</th>
                  <th className="px-3 py-3 text-right font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("currentPrice")}>현재가{sortIndicator("currentPrice")}</th>
                  <th className="px-3 py-3 text-right font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("evalAmount")}>평가액{sortIndicator("evalAmount")}</th>
                  <th className="px-3 py-3 text-right font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("profitLoss")}>손익{sortIndicator("profitLoss")}</th>
                  <th className="px-3 py-3 text-right font-semibold cursor-pointer select-none hover:bg-primary/80 transition-colors" onClick={() => toggleSort("returnRate")}>수익률{sortIndicator("returnRate")}</th>
                  <th className="px-3 py-3 text-center font-semibold">시세</th>
                  <th className="px-3 py-3 text-center font-semibold">삭제</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const rows: React.ReactNode[] = [];
                  let lastCategory = "";
                  sortedItems.forEach((item) => {
                    // Category subtotal row
                    if (item.category !== lastCategory && lastCategory !== "") {
                      const catItems = sortedItems.filter((h) => h.category === lastCategory);
                      const catInvest = catItems.reduce((s, h) => s + h.quantity * h.avgPrice, 0);
                      const catEval = catItems.reduce((s, h) => s + h.quantity * (h.currentPrice || 0), 0);
                      const catPL = catEval - catInvest;
                      const catRate = catInvest > 0 ? catPL / catInvest : 0;
                      rows.push(
                        <tr key={`sub_${lastCategory}`} className="bg-table-hover/70 font-semibold">
                          <td colSpan={4} className="px-3 py-2 text-right text-muted-foreground">{lastCategory} 소계</td>
                          <td className="px-3 py-2 text-right">{formatNumber(catInvest)}원</td>
                          <td className="px-3 py-2"></td>
                          <td className="px-3 py-2 text-right">{formatNumber(catEval)}원</td>
                          <td className={`px-3 py-2 text-right ${profitColor(catPL)}`}>{formatProfitLoss(catPL)}원</td>
                          <td className={`px-3 py-2 text-right ${profitColor(catRate)}`}>{formatReturnRate(catRate)}</td>
                          <td colSpan={2}></td>
                        </tr>
                      );
                    }
                    lastCategory = item.category;

                    const ev = evaluateHolding(item);
                    const isLoading = loadingCodes.has(item.code);
                    rows.push(
                      <tr
                        key={item.id}
                        onDoubleClick={() => onEditClick(item)}
                        className="border-t border-card-border hover:bg-table-hover/50 cursor-pointer"
                      >
                        <td className="px-3 py-3">{item.category}</td>
                        <td className="px-3 py-3 font-medium text-foreground">{item.name}</td>
                        <td className="px-3 py-3 text-center font-mono text-muted-foreground">{item.code}</td>
                        <td className="px-3 py-3 text-right">{formatNumber(item.quantity)}</td>
                        <td className="px-3 py-3 text-right">{formatNumber(item.avgPrice)}원</td>
                        <td className="px-3 py-3 text-right">
                          {isLoading ? (
                            <span className="inline-block w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          ) : item.currentPrice ? (
                            formatNumber(item.currentPrice) + "원"
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-medium">{formatNumber(ev.evalAmount)}원</td>
                        <td className={`px-3 py-3 text-right ${profitColor(ev.profitLoss)}`}>
                          {formatProfitLoss(ev.profitLoss)}원
                        </td>
                        <td className={`px-3 py-3 text-right ${profitColor(ev.returnRate)}`}>
                          {formatReturnRate(ev.returnRate)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); refreshPrice(item); }}
                            disabled={isLoading}
                            title="현재가 조회"
                            className="text-muted hover:text-primary disabled:opacity-30 transition-colors"
                          >
                            {isLoading ? (
                              <span className="inline-block w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            ) : "↻"}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                            className="text-muted hover:text-accent-red transition-colors font-medium"
                            title="삭제"
                          >
                            x
                          </button>
                        </td>
                      </tr>
                    );
                  });
                  // Last category subtotal
                  if (lastCategory !== "") {
                    const catItems = sortedItems.filter((h) => h.category === lastCategory);
                    const catInvest = catItems.reduce((s, h) => s + h.quantity * h.avgPrice, 0);
                    const catEval = catItems.reduce((s, h) => s + h.quantity * (h.currentPrice || 0), 0);
                    const catPL = catEval - catInvest;
                    const catRate = catInvest > 0 ? catPL / catInvest : 0;
                    rows.push(
                      <tr key={`sub_${lastCategory}`} className="bg-table-hover/70 font-semibold">
                        <td colSpan={4} className="px-3 py-2 text-right text-muted-foreground">{lastCategory} 소계</td>
                        <td className="px-3 py-2 text-right">{formatNumber(catInvest)}원</td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 text-right">{formatNumber(catEval)}원</td>
                        <td className={`px-3 py-2 text-right ${profitColor(catPL)}`}>{formatProfitLoss(catPL)}원</td>
                        <td className={`px-3 py-2 text-right ${profitColor(catRate)}`}>{formatReturnRate(catRate)}</td>
                        <td colSpan={2}></td>
                      </tr>
                    );
                  }
                  return rows;
                })()}
              </tbody>
              <tfoot>
                <tr className="bg-primary/10 font-bold border-t-2 border-primary/30">
                  <td colSpan={4} className="px-3 py-3 text-right">합계</td>
                  <td className="px-3 py-3 text-right">{formatNumber(totalInvest)}원</td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3 text-right">{formatNumber(totalEval)}원</td>
                  <td className={`px-3 py-3 text-right ${profitColor(totalProfitLoss)}`}>{formatProfitLoss(totalProfitLoss)}원</td>
                  <td className={`px-3 py-3 text-right ${profitColor(totalReturnRate)}`}>{formatReturnRate(totalReturnRate)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile sort chips */}
          <div className="md:hidden flex items-center gap-2 px-5 py-2.5 overflow-x-auto border-b border-card-border bg-table-hover/30">
            {(["category", "name", "evalAmount", "profitLoss", "returnRate"] as SortKey[]).map((key) => (
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
            {sortedItems.map((item) => {
              const ev = evaluateHolding(item);
              const isLoading = loadingCodes.has(item.code);
              const dotColor = CATEGORY_BG_COLORS[item.category] || "bg-primary";
              const catLines = item.category.length > 2
                ? [item.category.slice(0, Math.ceil(item.category.length / 2)), item.category.slice(Math.ceil(item.category.length / 2))]
                : [item.category];
              return (
                <div
                  key={item.id}
                  onClick={() => onEditClick(item)}
                  className="flex items-start gap-4 px-5 py-[18px] active:bg-table-hover/50 cursor-pointer transition-colors"
                >
                  <div className={`w-14 h-14 rounded-xl ${dotColor} flex flex-col items-center justify-center flex-shrink-0 mt-0.5`}>
                    {catLines.map((line, i) => (
                      <span key={i} className="text-[11px] font-bold text-white leading-tight">{line}</span>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Line 1: stock name */}
                    <div className="text-[17px] font-semibold text-foreground truncate">{item.name}</div>
                    {/* Line 2: eval amount + P&L */}
                    <div className="flex items-baseline justify-end gap-2">
                      <div className="text-[17px] font-bold">
                        {isLoading ? (
                          <span className="inline-block w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        ) : (
                          formatNumber(ev.evalAmount) + "원"
                        )}
                      </div>
                      <span className={`text-[13px] font-medium ${profitColor(ev.profitLoss)}`}>
                        {formatReturnRate(ev.returnRate)}
                      </span>
                    </div>
                    {/* Line 3: code · quantity · P&L amount */}
                    <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <span className="font-mono">{item.code}</span>
                      <span>·</span>
                      <span>{formatNumber(item.quantity)}주</span>
                      <span>·</span>
                      <span className={`font-medium ${profitColor(ev.profitLoss)}`}>
                        {formatProfitLoss(ev.profitLoss)}원
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Mobile total */}
            <div className="px-5 py-5 bg-table-hover/50">
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-muted-foreground">투자원금</span>
                <span className="text-[15px] font-bold">{formatNumber(totalInvest)}원</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[15px] text-muted-foreground">평가액</span>
                <span className="text-[15px] font-bold">{formatNumber(totalEval)}원</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[15px] text-muted-foreground">총 손익</span>
                <span className={`text-[15px] font-bold ${profitColor(totalProfitLoss)}`}>
                  {formatProfitLoss(totalProfitLoss)}원 ({formatReturnRate(totalReturnRate)})
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {items.length > 0 && (
        <div className="px-4 sm:px-5 py-3 border-t border-card-border text-xs text-muted">
          <span className="hidden md:inline">행 더블클릭으로 수정</span>
          <span className="md:hidden">종목 탭하여 수정</span>
        </div>
      )}
    </div>
  );
}
