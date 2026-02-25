"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Portfolio, PortfolioStock, HoldingItem, PortfolioHoldings } from "@/app/lib/types";
import { formatNumber } from "@/app/lib/portfolioCalc";
import {
  getPortfolios,
  savePortfolio,
  deletePortfolio,
  createPortfolio,
} from "@/app/lib/portfolioStorage";
import {
  getHoldings,
  saveHoldings,
  deleteHoldings,
} from "@/app/lib/holdingsStorage";
import { exportPortfolioExcel } from "@/app/lib/exportExcel";
import { useHelp } from "@/app/components/HelpProvider";
import { MAIN_STEPS } from "@/app/lib/helpSteps";
import IntroPage from "@/app/components/IntroPage";
import PortfolioTable from "@/app/components/PortfolioTable";
import AllocationTable from "@/app/components/AllocationTable";
import PortfolioSummary from "@/app/components/PortfolioSummary";
import GrowthReport from "@/app/components/GrowthReport";
import AddStockModal from "@/app/components/AddStockModal";
import AddHoldingModal from "@/app/components/AddHoldingModal";
import HoldingsTable from "@/app/components/HoldingsTable";
import HoldingsSummary from "@/app/components/HoldingsSummary";
import WeightComparisonChart from "@/app/components/WeightComparisonChart";
import CsvImportModal from "@/app/components/CsvImportModal";
import BalloonTooltip from "@/app/components/BalloonTooltip";
import { exportHoldingsTemplate, exportHoldingsToCsv, downloadCsv } from "@/app/lib/csvUtils";

type MobileTab = "portfolio" | "allocation" | "summary" | "growth" | "holdings";

const DEFAULT_STOCKS: PortfolioStock[] = [
  {
    id: "demo_1",
    category: "배당",
    name: "TIGER 미국배당다우존스",
    code: "458730",
    targetWeight: 0.3,
    dividendRate: 0.035,
    strategy: "미국 배당 성장주 ETF (SCHD 추종)",
    analysis: "안정적인 배당 수익 확보",
    rationale: "장기 배당 성장 이력을 가진 미국 우량주 중심, 월배당",
  },
  {
    id: "demo_2",
    category: "배당",
    name: "TIGER 코리아배당다우존스",
    code: "0052D0",
    targetWeight: 0.15,
    dividendRate: 0.045,
    strategy: "국내 배당 성장주 ETF",
    analysis: "국내 배당 수익 + 원화 자산 비중 확보",
    rationale: "배당 성장 기업 중심으로 안정성과 수익성 균형",
  },
  {
    id: "demo_3",
    category: "고배당",
    name: "KODEX 미국배당커버드콜액티브",
    code: "441640",
    targetWeight: 0.15,
    dividendRate: 0.08,
    strategy: "커버드콜 전략으로 고배당 실현",
    analysis: "월 고배당 현금흐름 창출",
    rationale: "옵션 프리미엄 활용으로 높은 배당수익률 달성",
  },
  {
    id: "demo_4",
    category: "성장",
    name: "KODEX 미국S&P500",
    code: "379800",
    targetWeight: 0.12,
    dividendRate: 0.012,
    strategy: "미국 S&P500 인덱스 추종",
    analysis: "장기 자본 성장",
    rationale: "미국 시장 전반에 노출, 장기 성장 기대",
  },
  {
    id: "demo_5",
    category: "성장",
    name: "TIGER 미국테크TOP10 INDXX",
    code: "381170",
    targetWeight: 0.08,
    dividendRate: 0.003,
    strategy: "미국 빅테크 집중 투자",
    analysis: "고성장 기술주 노출",
    rationale: "AI/기술 섹터 성장 수혜를 위한 집중 투자",
  },
  {
    id: "demo_6",
    category: "안전판",
    name: "KODEX CD금리액티브(합성)",
    code: "459580",
    targetWeight: 0.2,
    dividendRate: 0.035,
    strategy: "CD금리 연동 안전 자산",
    analysis: "자본 보전 + 유동성 확보",
    rationale: "금리 연동 상품으로 하방 리스크 최소화",
  },
];

const MOBILE_TABS: { key: MobileTab; label: string; icon: string }[] = [
  { key: "portfolio", label: "종목", icon: "M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z" },
  { key: "allocation", label: "배분", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "summary", label: "요약", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { key: "growth", label: "성장", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
  { key: "holdings", label: "보유", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
];

export default function HomePage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStock, setEditingStock] = useState<PortfolioStock | null>(null);
  const [showNewPortfolioInput, setShowNewPortfolioInput] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [showIntro, setShowIntro] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("portfolio");
  const [holdings, setHoldings] = useState<PortfolioHoldings | null>(null);
  const [showAddHoldingModal, setShowAddHoldingModal] = useState(false);
  const [editingHolding, setEditingHolding] = useState<HoldingItem | null>(null);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const { resetGuide } = useHelp();

  useEffect(() => {
    setMounted(true);
    const stored = getPortfolios();
    if (stored.length > 0) {
      setPortfolios(stored);
      setActiveId(stored[0].id);
    } else {
      const demo = createPortfolio("내 ETF 포트폴리오");
      demo.stocks = DEFAULT_STOCKS;
      demo.investmentAmount = 100000000;
      savePortfolio(demo);
      setPortfolios([demo]);
      setActiveId(demo.id);
    }
  }, []);

  // Load holdings when activeId changes
  useEffect(() => {
    if (activeId) {
      const h = getHoldings(activeId);
      setHoldings(h);
    } else {
      setHoldings(null);
    }
  }, [activeId]);

  const activePortfolio = portfolios.find((p) => p.id === activeId) || null;
  const holdingItems = holdings?.items || [];

  const updateActive = (updated: Portfolio) => {
    const updatedList = portfolios.map((p) =>
      p.id === updated.id ? updated : p
    );
    setPortfolios(updatedList);
    savePortfolio(updated);
  };

  const handleStocksChange = (stocks: PortfolioStock[]) => {
    if (!activePortfolio) return;
    updateActive({ ...activePortfolio, stocks, updatedAt: new Date().toISOString() });
  };

  const handleAmountChange = (amount: number) => {
    if (!activePortfolio) return;
    updateActive({
      ...activePortfolio,
      investmentAmount: amount,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddStock = (stock: PortfolioStock) => {
    if (!activePortfolio) return;
    handleStocksChange([...activePortfolio.stocks, stock]);
    setShowAddModal(false);
  };

  const handleEditStock = (stock: PortfolioStock) => {
    setEditingStock(stock);
  };

  const handleUpdateStock = (updated: PortfolioStock) => {
    if (!activePortfolio) return;
    handleStocksChange(
      activePortfolio.stocks.map((s) => (s.id === updated.id ? updated : s))
    );
    setEditingStock(null);
  };

  const handleCreatePortfolio = () => {
    if (!newPortfolioName.trim()) return;
    const p = createPortfolio(newPortfolioName.trim());
    const updated = [...portfolios, p];
    setPortfolios(updated);
    savePortfolio(p);
    setActiveId(p.id);
    setNewPortfolioName("");
    setShowNewPortfolioInput(false);
  };

  const handleDeletePortfolio = (id: string) => {
    if (!confirm("이 포트폴리오를 삭제하시겠습니까?")) return;
    deletePortfolio(id);
    deleteHoldings(id);
    const updated = portfolios.filter((p) => p.id !== id);
    setPortfolios(updated);
    setActiveId(updated.length > 0 ? updated[0].id : null);
  };

  const handleRenamePortfolio = (id: string) => {
    const portfolio = portfolios.find((p) => p.id === id);
    if (!portfolio) return;
    const newName = prompt("새 포트폴리오 이름:", portfolio.name);
    if (newName && newName.trim()) {
      updateActive({ ...portfolio, name: newName.trim() });
    }
  };

  const handleHoldingsChange = (items: HoldingItem[]) => {
    if (!activeId) return;
    const updated: PortfolioHoldings = {
      portfolioId: activeId,
      items,
      updatedAt: new Date().toISOString(),
    };
    setHoldings(updated);
    saveHoldings(updated);
  };

  const handleAddHolding = (item: HoldingItem) => {
    handleHoldingsChange([...holdingItems, item]);
    setShowAddHoldingModal(false);
  };

  const handleEditHolding = (item: HoldingItem) => {
    setEditingHolding(item);
  };

  const handleUpdateHolding = (updated: HoldingItem) => {
    handleHoldingsChange(holdingItems.map((h) => h.id === updated.id ? updated : h));
    setEditingHolding(null);
  };

  const handleCsvImport = (items: HoldingItem[], mode: "append" | "replace") => {
    if (mode === "replace") {
      handleHoldingsChange(items);
    } else {
      handleHoldingsChange([...holdingItems, ...items]);
    }
    setShowCsvImportModal(false);
  };

  const handleExportTemplate = () => {
    downloadCsv(exportHoldingsTemplate(), "보유내역_양식.csv");
  };

  const handleExportData = () => {
    if (!activePortfolio || holdingItems.length === 0) return;
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const safeName = activePortfolio.name.replace(/[^a-zA-Z0-9가-힣]/g, "_");
    downloadCsv(exportHoldingsToCsv(holdingItems), `보유내역_${safeName}_${date}.csv`);
  };

  const handleSave = useCallback(() => {
    if (!activePortfolio) return;
    savePortfolio(activePortfolio);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  }, [activePortfolio]);

  const handleExport = useCallback(async () => {
    if (!activePortfolio || activePortfolio.stocks.length === 0) return;
    setExporting(true);
    try {
      await exportPortfolioExcel(activePortfolio, holdingItems.length > 0 ? holdingItems : undefined);
    } catch {
      // export error handled silently
    } finally {
      setExporting(false);
    }
  }, [activePortfolio, holdingItems]);

  const handleNext = () => {
    setShowIntro(false);
    resetGuide();
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (showIntro) {
    return <IntroPage onNext={handleNext} />;
  }

  return (
    <>
      <div className="min-h-screen bg-background md:pb-0 pb-20">
        {/* Header — Mobile: Toss-style minimal white / Desktop: full colored */}
        <header className="sticky top-0 z-30">
          {/* Desktop header */}
          <div className="hidden md:block bg-primary text-primary-fg shadow-md">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <Image src="/logo.jpg" alt="로고" width={32} height={32} className="w-full h-full object-cover mix-blend-multiply" />
                </div>
                <div>
                  <h1 className="text-sm font-bold leading-tight">ETF 포트폴리오 매니저</h1>
                  <p className="text-xs text-primary-fg-muted/60 leading-tight">
                    종목 검색 - 비중 설정 - 자동 계산 - Excel 내보내기
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Mobile header — Toss style clean white */}
          <div className="md:hidden bg-card-bg border-b border-card-border">
            <div className="px-5 py-3 flex items-center justify-between">
              <h1 className="text-base font-bold text-foreground">내 투자</h1>
              {activePortfolio && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSave}
                    className={`p-2 rounded-full transition-colors ${saveFlash ? "text-accent-green bg-accent-green-bg" : "text-muted-foreground hover:bg-table-hover"}`}
                  >
                    {saveFlash ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={exporting || activePortfolio.stocks.length === 0}
                    className="p-2 rounded-full text-muted-foreground hover:bg-table-hover disabled:opacity-30 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
          {/* Portfolio tabs — Desktop: full tabs + buttons / Mobile: horizontal scroll */}
          <div data-help-step="main-tabs" className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0 overflow-x-auto">
              {portfolios.map((p) => (
                <div key={p.id} className="flex items-center">
                  <button
                    onClick={() => setActiveId(p.id)}
                    onDoubleClick={() => handleRenamePortfolio(p.id)}
                    title="더블클릭으로 이름 변경"
                    className={`px-4 py-2 text-xs font-medium rounded-l-lg border transition-colors ${
                      activeId === p.id
                        ? "bg-primary text-primary-fg border-primary"
                        : "bg-card-bg text-muted-foreground border-card-border hover:bg-table-hover"
                    }`}
                  >
                    {p.name}
                  </button>
                  <button
                    onClick={() => handleDeletePortfolio(p.id)}
                    className={`px-2 py-2 text-xs rounded-r-lg border-t border-r border-b transition-colors ${
                      activeId === p.id
                        ? "bg-primary/80 text-primary-fg-muted/60 border-primary hover:text-primary-fg"
                        : "bg-card-bg text-muted border-card-border hover:text-accent-red hover:bg-table-hover"
                    }`}
                    title="삭제"
                  >
                    x
                  </button>
                </div>
              ))}

              {showNewPortfolioInput ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={newPortfolioName}
                    onChange={(e) => setNewPortfolioName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreatePortfolio();
                      if (e.key === "Escape") {
                        setShowNewPortfolioInput(false);
                        setNewPortfolioName("");
                      }
                    }}
                    placeholder="포트폴리오 이름"
                    className="px-3 py-2 text-xs border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <button
                    onClick={handleCreatePortfolio}
                    className="px-3 py-2 text-xs bg-primary text-primary-fg rounded-lg hover:bg-primary/90"
                  >
                    생성
                  </button>
                  <button
                    onClick={() => {
                      setShowNewPortfolioInput(false);
                      setNewPortfolioName("");
                    }}
                    className="px-3 py-2 text-xs text-muted-foreground border border-card-border rounded-lg hover:bg-table-hover"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewPortfolioInput(true)}
                  className="px-4 py-2 text-xs font-medium text-muted-foreground border border-dashed border-input-border rounded-lg hover:border-primary hover:text-primary transition-colors"
                >
                  + 새 포트폴리오
                </button>
              )}
            </div>

            {/* Desktop Save & Export buttons */}
            {activePortfolio && (
              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleSave}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    saveFlash
                      ? "bg-accent-green/10 text-accent-green border-accent-green/30"
                      : "bg-card-bg text-muted-foreground border-card-border hover:border-primary hover:text-primary"
                  }`}
                >
                  {saveFlash ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      저장 완료
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      저장
                    </>
                  )}
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting || activePortfolio.stocks.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-primary text-primary-fg rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {exporting ? (
                    <>
                      <span className="inline-block w-3.5 h-3.5 border-2 border-primary-fg/30 border-t-primary-fg rounded-full animate-spin" />
                      내보내는 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Excel
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {activePortfolio ? (
            <>
              {/* Desktop: all sections visible */}
              <div className="hidden md:block space-y-5">
                <div data-help-step="main-table">
                  <PortfolioTable
                    key={activePortfolio.id}
                    stocks={activePortfolio.stocks}
                    onUpdate={handleStocksChange}
                    onAddClick={() => setShowAddModal(true)}
                    onEditClick={handleEditStock}
                  />
                </div>
                <div data-help-step="main-allocation">
                  <AllocationTable portfolio={activePortfolio} onInvestmentAmountChange={handleAmountChange} />
                </div>
                <div data-help-step="main-summary">
                  <PortfolioSummary portfolio={activePortfolio} />
                </div>
                <div data-help-step="main-growth">
                  <GrowthReport portfolio={activePortfolio} />
                </div>
                <HoldingsTable
                  items={holdingItems}
                  onUpdate={handleHoldingsChange}
                  onAddClick={() => setShowAddHoldingModal(true)}
                  onEditClick={handleEditHolding}
                  onCsvImportClick={() => setShowCsvImportModal(true)}
                  onExportTemplate={handleExportTemplate}
                  onExportData={handleExportData}
                />
                {holdingItems.length > 0 && (
                  <HoldingsSummary items={holdingItems} />
                )}
                {holdingItems.length > 0 && activePortfolio.stocks.length > 0 && (
                  <WeightComparisonChart stocks={activePortfolio.stocks} holdings={holdingItems} />
                )}
              </div>

              {/* Mobile: Toss-style hero card + active tab */}
              <div className="md:hidden space-y-3">
                {/* Hero Asset Summary Card */}
                {(() => {
                  const stks = activePortfolio.stocks;
                  const totalWeight = stks.reduce((s, st) => s + st.targetWeight, 0);
                  const wdr = stks.length > 0
                    ? stks.reduce((s, st) => s + st.targetWeight * st.dividendRate, 0) / (totalWeight || 1)
                    : 0;
                  const annDiv = Math.round(activePortfolio.investmentAmount * wdr);
                  const monDiv = Math.round(annDiv / 12);
                  return (
                    <div className="bg-card-bg rounded-2xl shadow-sm p-5">
                      <div className="text-xs text-muted-foreground mb-1">{activePortfolio.name}</div>
                      <div className="text-2xl font-bold text-foreground mb-4">
                        {formatNumber(activePortfolio.investmentAmount)}원
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-accent-green-bg rounded-xl px-3 py-2.5 text-center">
                          <div className="text-[10px] text-muted mb-0.5">월배당</div>
                          <div className="text-sm font-bold text-accent-green">{formatNumber(monDiv)}원</div>
                        </div>
                        <div className="bg-accent-green-bg rounded-xl px-3 py-2.5 text-center">
                          <div className="text-[10px] text-muted mb-0.5">연배당</div>
                          <div className="text-sm font-bold text-accent-green">{formatNumber(annDiv)}원</div>
                        </div>
                        <div className="bg-primary/5 rounded-xl px-3 py-2.5 text-center">
                          <div className="text-[10px] text-muted mb-0.5">종목</div>
                          <div className="text-sm font-bold text-primary">{stks.length}개</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Active tab content */}
                {mobileTab === "portfolio" && (
                  <PortfolioTable
                    key={activePortfolio.id}
                    stocks={activePortfolio.stocks}
                    onUpdate={handleStocksChange}
                    onAddClick={() => setShowAddModal(true)}
                    onEditClick={handleEditStock}
                  />
                )}
                {mobileTab === "allocation" && (
                  <AllocationTable portfolio={activePortfolio} onInvestmentAmountChange={handleAmountChange} />
                )}
                {mobileTab === "summary" && (
                  <PortfolioSummary portfolio={activePortfolio} />
                )}
                {mobileTab === "growth" && (
                  <GrowthReport portfolio={activePortfolio} />
                )}
                {mobileTab === "holdings" && (
                  <>
                    <HoldingsTable
                      items={holdingItems}
                      onUpdate={handleHoldingsChange}
                      onAddClick={() => setShowAddHoldingModal(true)}
                      onEditClick={handleEditHolding}
                      onCsvImportClick={() => setShowCsvImportModal(true)}
                      onExportTemplate={handleExportTemplate}
                      onExportData={handleExportData}
                    />
                    {holdingItems.length > 0 && (
                      <HoldingsSummary items={holdingItems} />
                    )}
                    {holdingItems.length > 0 && activePortfolio.stocks.length > 0 && (
                      <WeightComparisonChart stocks={activePortfolio.stocks} holdings={holdingItems} />
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-muted">
              <p className="text-sm mb-4">포트폴리오가 없습니다.</p>
              <button
                onClick={() => setShowNewPortfolioInput(true)}
                className="px-5 py-2.5 text-sm font-medium bg-primary text-primary-fg rounded-lg hover:bg-primary/90 transition-colors"
              >
                포트폴리오 만들기
              </button>
            </div>
          )}
        </main>

        {/* Desktop footer */}
        <footer className="hidden md:block mt-12 py-6 text-center text-xs text-muted border-t border-card-border">
          ETF 포트폴리오 매니저 - 시세는 네이버 증권 기준 (장 마감 후 갱신)
        </footer>

        {/* Mobile bottom navigation bar — Toss style */}
        {activePortfolio && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card-bg/95 backdrop-blur-md border-t border-card-border safe-area-bottom">
            <div className="flex items-stretch h-16">
              {MOBILE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setMobileTab(tab.key)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                    mobileTab === tab.key
                      ? "text-primary"
                      : "text-muted"
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={mobileTab === tab.key ? 2.5 : 1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                  </svg>
                  <span className={`text-[11px] ${mobileTab === tab.key ? "font-bold" : "font-medium"}`}>
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>

      {showAddModal && (
        <AddStockModal
          onAdd={handleAddStock}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingStock && (
        <AddStockModal
          initialStock={editingStock}
          onAdd={handleUpdateStock}
          onClose={() => setEditingStock(null)}
        />
      )}

      {showAddHoldingModal && (
        <AddHoldingModal
          onAdd={handleAddHolding}
          onClose={() => setShowAddHoldingModal(false)}
        />
      )}

      {editingHolding && (
        <AddHoldingModal
          initialItem={editingHolding}
          onAdd={handleUpdateHolding}
          onClose={() => setEditingHolding(null)}
        />
      )}

      {showCsvImportModal && (
        <CsvImportModal
          onImport={handleCsvImport}
          onClose={() => setShowCsvImportModal(false)}
        />
      )}

      <BalloonTooltip steps={MAIN_STEPS} />
    </>
  );
}
